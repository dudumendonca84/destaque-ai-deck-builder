import { createServiceClient } from "@/lib/supabase/server";
import type {
  AuditResults,
  AuditEngineSummary,
  AuditTier,
  EngineRunStatus,
  GeneratedPromptMeta,
} from "@/lib/supabase/types";
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
import {
  loadModelMappings,
  resolveModel,
  type EngineModelEntry,
} from "@/lib/skill/models";
import { filterRelevantCompetitors } from "./competitor-filter";
import { runSinalScan } from "@/lib/scan/sinal-scan";

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

async function queryEngine(
  engine: Engine,
  prompt: string,
  model: string,
): Promise<EngineQueryResult> {
  if (engine === "chatgpt") return queryChatGPT(prompt, model);
  if (engine === "gemini") return queryGemini(prompt, model);
  if (engine === "grok") return queryGrok(prompt, model);
  if (engine === "deepseek") return queryDeepSeek(prompt, model);
  if (engine === "mistral") return queryMistral(prompt, model);
  // claude
  const { text, tokens } = await claudeComplete({ prompt, maxTokens: 1024, model });
  return { response: text, tokens };
}

type RunRow = {
  prompt: string;
  engine: Engine;
  response: string | null;
  analysis: CitationAnalysis | null;
  tokens: number;
  error_reason: string | null;
};

function mockAuditEnabled(): boolean {
  return process.env.MOCK_AUDIT === "true";
}

async function runSingle(opts: {
  engine: Engine;
  prompt: string;
  brandName: string;
  competitors: string[];
  model: string;
}): Promise<RunRow> {
  const { engine, prompt, brandName, competitors, model } = opts;

  if (!keyAvailable(engine)) {
    if (mockAuditEnabled()) {
      return {
        prompt,
        engine,
        response: mockEngineQuery(prompt, engine).response,
        analysis: mockCitationAnalysis({ prompt, engine, brandName, competitors }),
        tokens: 0,
        error_reason: null,
      };
    }
    return { prompt, engine, response: null, analysis: null, tokens: 0, error_reason: "no_api_key" };
  }

  try {
    const query = await queryEngine(engine, prompt, model);
    const analysis = await parseCitations({
      response: query.response,
      brandName,
      knownCompetitors: competitors,
    });
    return { prompt, engine, response: query.response, analysis, tokens: query.tokens, error_reason: null };
  } catch {
    if (mockAuditEnabled()) {
      return {
        prompt,
        engine,
        response: mockEngineQuery(prompt, engine).response,
        analysis: mockCitationAnalysis({ prompt, engine, brandName, competitors }),
        tokens: 0,
        error_reason: null,
      };
    }
    return { prompt, engine, response: null, analysis: null, tokens: 0, error_reason: "api_failed" };
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

function summarise(rows: RunRow[], relevant?: Set<string>): AuditEngineSummary {
  // Rows sem análise (motor sem key ou API failed) ficam fora do denominador.
  // Garante que citation_rate e SoV reflectem só respostas LLM reais.
  const valid = rows.filter(
    (r): r is RunRow & { analysis: CitationAnalysis } => r.analysis !== null,
  );
  if (valid.length === 0) {
    return { citation_rate: 0, share_of_voice: 0, avg_position: null, top_competitors: [] };
  }
  const present = valid.filter((r) => r.analysis.brand_present);
  const citation_rate = present.length / valid.length;

  // Filtro de competitors relevantes (se fornecido). Reduz ruído de
  // empresas não relacionadas que apareceram nas respostas.
  const isRelevant = (c: string) => !relevant || relevant.has(c);

  // Share of voice (convenção Profound/Peec): por resposta onde a marca aparece,
  // share = 1 / total_brands_named_in_response (a marca conta como 1).
  // Resultado final = média desses shares. Não é "menções globais da marca /
  // menções globais totais" — essa fórmula sobre-pondera respostas com muitos
  // competitors mencionados.
  const perResponseShares: number[] = present.map((r) => {
    const compsInResponse = r.analysis.competitors_mentioned.filter(isRelevant);
    const totalBrandsInResponse = 1 + compsInResponse.length;
    return totalBrandsInResponse > 0 ? 1 / totalBrandsInResponse : 0;
  });
  const share_of_voice =
    perResponseShares.length > 0
      ? perResponseShares.reduce((a, b) => a + b, 0) / perResponseShares.length
      : 0;

  // Contagem agregada de competitors (para top_competitors), só os relevantes.
  const compCounts = new Map<string, number>();
  for (const r of valid) {
    for (const c of r.analysis.competitors_mentioned) {
      if (!isRelevant(c)) continue;
      compCounts.set(c, (compCounts.get(c) ?? 0) + 1);
    }
  }

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

function aggregate(rows: RunRow[], relevant?: Set<string>): AuditResults {
  const by_engine = {} as Record<Engine, AuditEngineSummary>;
  const engines_status = {} as Record<Engine, EngineRunStatus>;
  for (const engine of ENGINES) {
    const engineRows = rows.filter((r) => r.engine === engine);
    by_engine[engine] = summarise(engineRows, relevant);
    engines_status[engine] = {
      real: engineRows.filter((r) => r.analysis !== null).length,
      no_api_key: engineRows.filter((r) => r.error_reason === "no_api_key").length,
      api_failed: engineRows.filter((r) => r.error_reason === "api_failed").length,
    };
  }
  return { summary: summarise(rows, relevant), by_engine, engines_status };
}

/**
 * Corre a auditoria GEO completa para uma proposta. Para cada motor,
 * resolve o `model id` a partir de `models.md` da skill conforme o
 * `audit_tier` da proposta (free → cost_optimized; diagnostic → production).
 * Paralelismo controlado por `AUDIT_CONCURRENCY`.
 */
export async function runAudit(proposalId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id,custom_prompts,prospect_id,audit_tier,prompts_meta")
    .eq("id", proposalId)
    .single();

  if (!proposal) throw new Error("proposal_not_found");

  const { data: prospect } = await supabase
    .from("prospects")
    .select("company_name,company_website,competitors")
    .eq("id", proposal.prospect_id)
    .single();

  const brandName: string = prospect?.company_name ?? "a marca";
  const companyWebsite: string | null = prospect?.company_website ?? null;
  const competitors: string[] = prospect?.competitors ?? [];
  const prompts: string[] = proposal.custom_prompts ?? [];
  const tier: AuditTier = (proposal.audit_tier as AuditTier | undefined) ?? "free";

  // Map prompt → intent_stage via prompts_meta (se existir)
  const intentByPrompt = new Map<string, string>();
  const meta = proposal.prompts_meta as GeneratedPromptMeta[] | null;
  if (Array.isArray(meta)) {
    for (const m of meta) {
      if (m?.text && m?.intent_stage) intentByPrompt.set(m.text, m.intent_stage);
    }
  }

  await supabase
    .from("proposals")
    .update({ audit_status: "running", audit_started_at: new Date().toISOString() })
    .eq("id", proposalId);

  try {
    await supabase.from("audit_runs").delete().eq("proposal_id", proposalId);
    await supabase.from("sinal_scans").delete().eq("proposal_id", proposalId);

    // SINAL scan corre em paralelo com as queries aos LLMs. Independente —
    // se falhar não bloqueia o audit principal.
    const scanPromise = companyWebsite
      ? runSinalScan(companyWebsite, brandName).then(async (result) => {
          await supabase.from("sinal_scans").insert({
            proposal_id: proposalId,
            domain: result.domain,
            score: result.score,
            scan_results: result,
            critical_count: result.critical_findings.length,
            unknown_count: result.unknown_count,
          });
        }).catch(() => undefined)
      : Promise.resolve();

    const { mappings } = await loadModelMappings();

    const tasks = prompts.flatMap((prompt) =>
      ENGINES.map((engine) => ({
        prompt,
        engine,
        model: resolveModel(mappings as Record<Engine, EngineModelEntry>, engine, tier),
        intent_stage: intentByPrompt.get(prompt) ?? null,
      })),
    );

    const rows = await runWithLimit(tasks, resolveConcurrency(), async (task) => {
      const row = await runSingle({
        engine: task.engine,
        prompt: task.prompt,
        brandName,
        competitors,
        model: task.model,
      });
      await supabase.from("audit_runs").insert({
        proposal_id: proposalId,
        prompt: row.prompt,
        engine: row.engine,
        intent_stage: task.intent_stage,
        response: row.response,
        citations_found: row.analysis?.citations_found ?? null,
        brand_position: row.analysis?.brand_position ?? null,
        brand_present: row.analysis?.brand_present ?? null,
        competitors_mentioned: row.analysis?.competitors_mentioned ?? null,
        sentiment_score: row.analysis?.sentiment_score ?? null,
        tokens_used: row.tokens,
        error_reason: row.error_reason,
      });
      return row;
    });

    // Filtra competitors via classificação semântica antes de gravar nos
    // results (descarta SEO-only puros e ruído). Só rows com analysis real.
    const allMentioned = new Set<string>();
    for (const row of rows) {
      if (!row.analysis) continue;
      for (const c of row.analysis.competitors_mentioned) allMentioned.add(c);
    }
    const relevant = await filterRelevantCompetitors([...allMentioned]);
    const results = aggregate(rows, new Set(relevant));

    // Aguarda o scan se ainda não terminou — independente do audit já estar.
    await scanPromise;

    await supabase
      .from("proposals")
      .update({
        audit_status: "completed",
        audit_completed_at: new Date().toISOString(),
        audit_results: results,
        // Sinaliza à Routine no Claude Code Max (geo-seo-aeo-master)
        // que esta proposta precisa de synthesis. Routine corre na
        // subscription Max do operador (zero custo API).
        deck_synthesis_pending: true,
      })
      .eq("id", proposalId);
  } catch {
    await supabase.from("proposals").update({ audit_status: "failed" }).eq("id", proposalId);
    throw new Error("audit_failed");
  }
}
