import { claudeJson, hasAnthropicKey } from "./anthropic";

/**
 * Filtra competitors mencionados nas respostas, mantendo apenas os que
 * oferecem serviços GEO/AEO especificamente (ou marketing digital com
 * AI). Descarta SEO clássico puro, ruído (empresas não relacionadas).
 *
 * Usa Claude para classificar. Se Claude não estiver disponível,
 * devolve a lista original sem filtrar.
 */

export type CompetitorRelevance = "relevant_geo_aeo" | "relevant_seo_only" | "unrelated";

type ClassifyResult = {
  classifications: Array<{ name: string; relevance: CompetitorRelevance; reason: string }>;
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    classifications: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          relevance: {
            type: "string",
            enum: ["relevant_geo_aeo", "relevant_seo_only", "unrelated"],
          },
          reason: { type: "string" },
        },
        required: ["name", "relevance", "reason"],
      },
    },
  },
  required: ["classifications"],
};

const SYSTEM = `Classificas empresas mencionadas em respostas de motores de IA pela relevância como concorrentes de uma agência de Generative Engine Optimization (GEO/AEO).

Categorias:
- relevant_geo_aeo: empresa que oferece serviços GEO, AEO, ou marketing digital com foco em IA / LLM optimization. Inclui agências que tenham migrado de SEO clássico para GEO.
- relevant_seo_only: agência de SEO clássico sem oferta GEO/AEO declarada. Não é concorrente directo mas pode aparecer em queries relacionadas.
- unrelated: ruído. Empresas que não fazem nada relacionado com SEO/GEO/AEO/marketing digital (ex.: marca alimentar, banco, empresa industrial que apareceu por coincidência).`;

export async function classifyCompetitors(
  names: string[],
): Promise<Map<string, CompetitorRelevance>> {
  const out = new Map<string, CompetitorRelevance>();
  if (names.length === 0 || !hasAnthropicKey()) {
    // Fallback: assume todos relevantes (não descarta nada)
    for (const n of names) out.set(n, "relevant_geo_aeo");
    return out;
  }

  try {
    const { data } = await claudeJson<ClassifyResult>({
      system: SYSTEM,
      prompt: `Classifica cada empresa abaixo:\n\n${names.map((n) => `- ${n}`).join("\n")}`,
      schema: SCHEMA,
      maxTokens: 1024,
    });
    for (const c of data.classifications ?? []) {
      out.set(c.name, c.relevance);
    }
    // Preenche qualquer um que Claude tenha falhado
    for (const n of names) {
      if (!out.has(n)) out.set(n, "relevant_geo_aeo");
    }
  } catch {
    for (const n of names) out.set(n, "relevant_geo_aeo");
  }
  return out;
}

/**
 * Filtra uma lista de competitors mantendo apenas `relevant_geo_aeo`.
 * Por defeito ignora `relevant_seo_only` e `unrelated`. Configurável via
 * env `COMPETITOR_FILTER_STRICT` — se "false", inclui também seo_only.
 */
export async function filterRelevantCompetitors(names: string[]): Promise<string[]> {
  const classified = await classifyCompetitors(names);
  const strict = process.env.COMPETITOR_FILTER_STRICT !== "false";
  return names.filter((n) => {
    const r = classified.get(n);
    if (r === "relevant_geo_aeo") return true;
    if (!strict && r === "relevant_seo_only") return true;
    return false;
  });
}
