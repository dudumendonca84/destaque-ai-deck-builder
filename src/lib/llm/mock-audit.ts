import type { Engine } from "./models";
import type { CitationAnalysis, EngineQueryResult } from "./types";

// Gerador determinístico de auditoria simulada — usado quando faltam API keys,
// para que o fluxo completo (wizard → deck) seja testável sem credenciais.

function seed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

export function mockEngineQuery(prompt: string, engine: Engine): EngineQueryResult {
  return {
    response: `[Simulação · ${engine}] Resposta gerada sem chamada real ao motor para o prompt: "${prompt}".`,
    tokens: 0,
  };
}

export function mockCitationAnalysis(opts: {
  prompt: string;
  engine: Engine;
  brandName: string;
  competitors: string[];
}): CitationAnalysis {
  const r = seed(`${opts.prompt}|${opts.engine}|${opts.brandName}`);
  const present = r > 0.55;
  const comps = opts.competitors.length
    ? opts.competitors
    : ["Concorrente A", "Concorrente B", "Concorrente C"];
  const mentioned = comps.filter((_, i) => seed(`${opts.engine}${opts.prompt}${i}`) > 0.4);
  const position = present ? Math.min(5, 1 + Math.floor(r * 4)) : null;
  return {
    citations_found: present ? [opts.brandName, ...mentioned] : mentioned,
    brand_present: present,
    brand_position: position,
    competitors_mentioned: mentioned,
    sentiment_score: present ? Math.round((r - 0.4) * 100) / 100 : 0,
  };
}
