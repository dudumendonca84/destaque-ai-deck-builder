import { ENGINES, type Engine } from "./models";
import type { AuditEngineSummary, AuditResults } from "@/lib/supabase/types";
import type { CitationAnalysis, EngineQueryResult } from "./types";
import { claudeComplete, hasAnthropicKey } from "./anthropic";
import { hasOpenAIKey, queryChatGPT } from "./openai";
import { hasGeminiKey, queryGemini } from "./gemini";
import { hasPerplexityKey, queryPerplexity } from "./perplexity";
import { parseCitations } from "./parse-citations";
import { mockCitationAnalysis, mockEngineQuery } from "./mock-audit";

// Motor de auditoria GEO — orquestração pura, sem acesso à base de dados. A
// persistência vive em run-audit.ts; aqui só corremos prompts × motores e
// agregamos. Testável sem credenciais (cai nos mocks determinísticos).

const DEFAULT_CONCURRENCY = 5;

/** Nº de prompts processados em paralelo. Configurável via AUDIT_CONCURRENCY. */
export function auditConcurrency(): number {
  const raw = Number(process.env.AUDIT_CONCURRENCY);
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : DEFAULT_CONCURRENCY;
}

function keyAvailable(engine: Engine): boolean {
  if (engine === "chatgpt") return hasOpenAIKey();
  if (engine === "claude") return hasAnthropicKey();
  if (engine === "gemini") return hasGeminiKey();
  return hasPerplexityKey();
}

async function queryEngine(engine: Engine, prompt: string): Promise<EngineQueryResult> {
  if (engine === "chatgpt") return queryChatGPT(prompt);
  if (engine === "gemini") return queryGemini(prompt);
  if (engine === "perplexity") return queryPerplexity(prompt);
  const { text, tokens } = await claudeComplete({ prompt, maxTokens: 1024 });
  return { response: text, tokens };
}

export type AuditResponseRow = {
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
}): Promise<AuditResponseRow> {
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

function summarise(rows: AuditResponseRow[]): AuditEngineSummary {
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

function aggregate(rows: AuditResponseRow[]): AuditResults {
  const by_engine = {} as Record<Engine, AuditEngineSummary>;
  for (const engine of ENGINES) {
    by_engine[engine] = summarise(rows.filter((r) => r.engine === engine));
  }
  return { summary: summarise(rows), by_engine };
}

export type ExecuteAuditInput = {
  prompts: string[];
  brandName: string;
  competitors: string[];
  /** MVP = 1. Multi-run fica para o Visibility Tracker. */
  runsPerPrompt?: number;
  concurrency?: number;
};

export type ExecuteAuditOutput = {
  rows: AuditResponseRow[];
  results: AuditResults;
};

/**
 * Corre todos os prompts × 4 motores com limite de concorrência. `onBatch` é
 * chamado a cada prompt concluído (× 4 motores), permitindo persistência
 * incremental sem acoplar este módulo à base de dados.
 */
export async function executeAudit(
  input: ExecuteAuditInput,
  onBatch?: (rows: AuditResponseRow[]) => Promise<void>,
): Promise<ExecuteAuditOutput> {
  const runs = Math.max(1, Math.floor(input.runsPerPrompt ?? 1));
  const concurrency = Math.max(1, Math.floor(input.concurrency ?? auditConcurrency()));
  const { brandName, competitors } = input;

  // Cada job = um prompt (× 4 motores). runs > 1 repete o prompt.
  const jobs: string[] = [];
  for (const prompt of input.prompts) {
    for (let r = 0; r < runs; r++) jobs.push(prompt);
  }

  const allRows: AuditResponseRow[] = [];
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < jobs.length) {
      const prompt = jobs[cursor++];
      const batch = await Promise.all(
        ENGINES.map((engine) => runSingle({ engine, prompt, brandName, competitors })),
      );
      allRows.push(...batch);
      if (onBatch) await onBatch(batch);
    }
  }

  const poolSize = Math.min(concurrency, Math.max(1, jobs.length));
  await Promise.all(Array.from({ length: poolSize }, worker));

  return { rows: allRows, results: aggregate(allRows) };
}
