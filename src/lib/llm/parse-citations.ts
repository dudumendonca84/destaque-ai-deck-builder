import { claudeJson, hasAnthropicKey } from "./anthropic";
import type { CitationAnalysis } from "./types";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    citations_found: { type: "array", items: { type: "string" } },
    brand_present: { type: "boolean" },
    brand_position: { type: ["integer", "null"] },
    competitors_mentioned: { type: "array", items: { type: "string" } },
    sentiment_score: { type: "number" },
  },
  required: [
    "citations_found",
    "brand_present",
    "brand_position",
    "competitors_mentioned",
    "sentiment_score",
  ],
};

const SYSTEM = `És um analista de Generative Engine Optimization. Extrais marcas, empresas e produtos mencionados nas respostas de motores de IA, de forma rigorosa e objectiva.`;

/**
 * Analisa uma resposta de motor para a marca do prospect.
 * - citations_found: todas as marcas/empresas mencionadas, por ordem de aparição
 * - brand_present: a marca do prospect aparece?
 * - brand_position: posição (1 = primeira marca mencionada), ou null
 * - competitors_mentioned: subconjunto de citations_found que são concorrentes
 * - sentiment_score: -1 (negativo) a 1 (positivo) sobre a marca do prospect; 0 se ausente
 */
export async function parseCitations(opts: {
  response: string;
  brandName: string;
  knownCompetitors: string[];
}): Promise<CitationAnalysis> {
  if (!hasAnthropicKey() || !opts.response.trim()) {
    return heuristicAnalysis(opts);
  }

  try {
    const { data } = await claudeJson<CitationAnalysis>({
      system: SYSTEM,
      schema: SCHEMA,
      maxTokens: 1024,
      prompt: `MARCA DO CLIENTE: ${opts.brandName}
CONCORRENTES CONHECIDOS: ${opts.knownCompetitors.join(", ") || "nenhum"}

RESPOSTA DE UM MOTOR DE IA A ANALISAR:
"""
${opts.response.slice(0, 6000)}
"""

Extrai a análise pedida no schema. brand_position conta a ordem em que as marcas aparecem (1 = primeira). Se a marca do cliente não aparecer, brand_present=false, brand_position=null, sentiment_score=0.`,
    });
    return {
      citations_found: data.citations_found ?? [],
      brand_present: Boolean(data.brand_present),
      brand_position: data.brand_position ?? null,
      competitors_mentioned: data.competitors_mentioned ?? [],
      sentiment_score: typeof data.sentiment_score === "number" ? data.sentiment_score : 0,
    };
  } catch {
    return heuristicAnalysis(opts);
  }
}

/** Fallback sem Claude: deteção por substring. */
function heuristicAnalysis(opts: {
  response: string;
  brandName: string;
  knownCompetitors: string[];
}): CitationAnalysis {
  const text = opts.response.toLowerCase();
  const brand = opts.brandName.toLowerCase().trim();
  const present = brand.length > 1 && text.includes(brand);
  const competitors = opts.knownCompetitors.filter(
    (c) => c.trim().length > 1 && text.includes(c.toLowerCase().trim()),
  );
  return {
    citations_found: present ? [opts.brandName, ...competitors] : competitors,
    brand_present: present,
    brand_position: present ? 1 : null,
    competitors_mentioned: competitors,
    sentiment_score: present ? 0.2 : 0,
  };
}
