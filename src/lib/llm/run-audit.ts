import { createServiceClient } from "@/lib/supabase/server";
import type { AuditResults, AuditEngineSummary } from "@/lib/supabase/types";
import { ENGINES, type Engine } from "./models";
import type { CitationAnalysis, EngineQueryResult } from "./types";
import { claudeComplete, hasAnthropicKey } from "./anthropic";
import { hasOpenAIKey, queryChatGPT } from "./openai";
import { hasGeminiKey, queryGemini } from "./gemini";
import { hasGrokKey, queryGrok } from "./grok";
import { hasDeepSeekKey, queryDeepSeek } from "./deepseek";
import { hasMistralKey, queryMistral } from "./mistral";
import { parseCitations } from "./parse-citations";
import { mockCitationAnalysis, mockEngineQuery } from "./mock-audit";

function resolveConcurrency(): number {
  const raw = process.env.AUDIT_CONCURRENCY;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

function keyAvailable(engine: Engine): boolean {
  if (engine === "chatgpt") return hasOpenAIKey();
  if (engine === "claude") return hasAnthropicKey();
  if (engine === "gemini") return hasGeminiKey();
  if (engine === "grok") return hasGrokKey();
  if (engine === "deepseek") return hasDeepSeekKey();
  return hasMistralKey();
}

async function queryEngine(engine: Engine, prompt: string): Promise<EngineQueryResult> {
  if (engine === "chatgpt") return queryChatGPT(prompt);
  if (engine === "gemini") return queryGemini(prompt);
  if (engine === "grok") return queryGrok(prompt);
  if (engine === "deepseek") return queryDeepSeek(prompt);
  if (engine === "mistral") return queryMistral(prompt);
  const { text, tokens } = await claudeComplete({ prompt, maxTokens: 1024 });
  return { response: text, tokens };
}

type RunRow = {
  prompt: string;
  engine: Engine;
  response: string;
  analysis: CitationAnalysis;
  tokens: number;
};

async function runSingle(opts: {
  engine: Engine;
  prompt: string;
  brandName: string;
  competitors: string[];
}): Promise<RunRow> {
  const { engine, prompt, brandName, competitors } = opts;

  if (!keyAvailable(engine)) {
    return {
      prompt,
      engine,
      response: mockEngineQuery(prompt, engine).response,
      analysis: mockCitationAnalysis({ prompt, engine, brandName, competitors }),
      tokens: 0,
    };
  }

  try {
    const query = await queryEngine(engine, prompt);
    const analysis = await parseCitations({
      response: query.response,
      brandName,
      knownCompetitors: competitors,
    });
    return { prompt, engine, response: query.response, analysis, tokens: query.tokens };
  } catch {
    // Falha de rede / API — degrada para simulação para não bloquear a auditoria.
    return {
      prompt,
      engine,
      response: mockEngineQuery(prompt, engine).response,
      analysis: mockCitationAnalysis({ prompt, engine, brandName, competitors }),
      tokens: 0,
    };
  }
}

async function runWithLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const lane = async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  };
  const lanes = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: lanes }, lane));
  return results;
}

function summarise(rows: RunRow[]): AuditEngineSummary {
  if (rows.length === 0) {
    return { citation_rate: 0, share_of_voice: 0, avg_position: null, top_competitors: [] };
  }
  const present = rows.filter((r) => r.analysis.brand_present);
  const citation_rate = present.length / rows.length;

  let brandMentions = 0;
  const compCounts = new Map<string, number>();
  for (const r of rows) {
    if (r.analysis.brand_present) brandMentions += 1;
    for (const c of r.analysis.competitors_mentioned) {
      compCounts.set(c, (compCounts.get(c) ?? 0) + 1);
    }
  }
  // share of voice = mentions da marca / (mentions da marca + concorrentes)
  const compTotal = [...compCounts.values()].reduce((a, b) => a + b, 0);
  const share_of_voice =
    brandMentions + compTotal > 0 ? brandMentions / (brandMentions + compTotal) : 0;

  const positions = present
    .map((r) => r.analysis.brand_position)
    .filter((p): p is number => typeof p === "number");
  const avg_position =
    positions.length > 0
      ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
      : null;

  const top_competitors = [...compCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  return {
    citation_rate: Math.round(citation_rate * 100) / 100,
    share_of_voice: Math.round(share_of_voice * 100) / 100,
    avg_position,
    top_competitors,
  };
}

function aggregate(rows: RunRow[]): AuditResults {
  const by_engine = {} as Record<Engine, AuditEngineSummary>;
  for (const engine of ENGINES) {
    by_engine[engine] = summarise(rows.filter((r) => r.engine === engine));
  }
  return { summary: summarise(rows), by_engine };
}

/**
 * Corre a auditoria GEO completa para uma proposta: prompts × motores activos.
 * Atualiza audit_status, grava audit_runs (uma a uma, para progresso fluido)
 * e popula audit_results. Paralelismo controlado por AUDIT_CONCURRENCY.
 */
export async function runAudit(proposalId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id,custom_prompts,prospect_id")
    .eq("id", proposalId)
    .single();

  if (!proposal) throw new Error("proposal_not_found");

  const { data: prospect } = await supabase
    .from("prospects")
    .select("company_name,competitors")
    .eq("id", proposal.prospect_id)
    .single();

  const brandName: string = prospect?.company_name ?? "a marca";
  const competitors: string[] = prospect?.competitors ?? [];
  const prompts: string[] = proposal.custom_prompts ?? [];

  await supabase
    .from("proposals")
    .update({ audit_status: "running", audit_started_at: new Date().toISOString() })
    .eq("id", proposalId);

  try {
    await supabase.from("audit_runs").delete().eq("proposal_id", proposalId);

    const tasks = prompts.flatMap((prompt) =>
      ENGINES.map((engine) => ({ prompt, engine })),
    );

    const rows = await runWithLimit(tasks, resolveConcurrency(), async (task) => {
      const row = await runSingle({ ...task, brandName, competitors });
      // Insere imediatamente para que /api/audit/[id]/status reporte progresso ao vivo.
      await supabase.from("audit_runs").insert({
        proposal_id: proposalId,
        prompt: row.prompt,
        engine: row.engine,
        response: row.response,
        citations_found: row.analysis.citations_found,
        brand_position: row.analysis.brand_position,
        brand_present: row.analysis.brand_present,
        competitors_mentioned: row.analysis.competitors_mentioned,
        sentiment_score: row.analysis.sentiment_score,
        tokens_used: row.tokens,
      });
      return row;
    });

    const results = aggregate(rows);
    await supabase
      .from("proposals")
      .update({
        audit_status: "completed",
        audit_completed_at: new Date().toISOString(),
        audit_results: results,
      })
      .eq("id", proposalId);
  } catch {
    await supabase.from("proposals").update({ audit_status: "failed" }).eq("id", proposalId);
    throw new Error("audit_failed");
  }
}
