import { randomUUID } from "crypto";
import { claudeJson, hasAnthropicKey } from "../anthropic";
import { CLAUDE_MODEL } from "../models";
import type { AuditPrompt, AuditTier, PromptCategory } from "@/lib/supabase/types";

// Geração estruturada dos prompts da auditoria GEO (Step 9). Acopla-se ao
// `references/prompts.md` da skill geo-seo-aeo-master: faz fetch das § 1-3
// (princípios + categorias + distribuição) e usa-as como contexto canónico.
// Se o fetch falhar, cai num SYSTEM_FALLBACK que espelha esse conteúdo.

const SKILL_PROMPTS_URL =
  "https://raw.githubusercontent.com/dudumendonca84/geo-seo-aeo-master/main/skills/geo-seo-aeo-master/references/prompts.md";

const FETCH_TIMEOUT_MS = 3000;

export type AuditPromptContext = {
  company_name?: string | null;
  business_type?: string | null;
  location?: string | null;
  target_audience?: string | null;
  competitors?: string[] | null;
};

export const PROMPT_CATEGORIES: PromptCategory[] = [
  "generic_category",
  "direct_comparison",
  "local_recommendation",
  "feature_specific",
  "price_comparison",
];

// Distribuição por tier — espelha § 3 do prompts.md da skill. Se a skill
// evoluir a distribuição, ajustar aqui.
const TIER_DISTRIBUTION: Record<AuditTier, Record<PromptCategory, number>> = {
  free: {
    generic_category: 1,
    direct_comparison: 1,
    local_recommendation: 1,
    feature_specific: 1,
    price_comparison: 1,
  },
  diagnostic: {
    generic_category: 8,
    direct_comparison: 8,
    local_recommendation: 6,
    feature_specific: 4,
    price_comparison: 4,
  },
};

const CATEGORY_BRIEF: Record<PromptCategory, string> = {
  generic_category:
    "categoria genérica — pergunta ampla sobre o tipo de serviço/produto, sem nomear empresas; intents: research, pain_point",
  direct_comparison:
    "comparação directa — confronta fornecedores/soluções nomeados; intents: comparison, validation, migration",
  local_recommendation:
    "recomendação local — recomendações para uma geografia específica; intents: research, validation",
  feature_specific:
    "feature específica — foca uma funcionalidade/capacidade concreta; intents: integration, validation",
  price_comparison:
    "comparação de preços — custos, planos, orçamento; intents: pricing, comparison",
};

const SYSTEM_BASE =
  "Ajudas uma agência de Generative Engine Optimization a auditar a visibilidade de um cliente em motores de IA. Geras perguntas realistas que um decisor B2B escreveria mesmo a um LLM ao avaliar fornecedores.";

const SYSTEM_FALLBACK = `${SYSTEM_BASE}

Princípios (espelho de emergência da skill geo-seo-aeo-master § 1):
- Persona implícita: CIO, CTO, CFO, Head of CX, VP Sales, Director de Operações, Procurement. Não nomeies a persona — escreve como ela escreveria.
- Contexto realista: tamanho da empresa, geografia (se relevante), vertical, restrições conhecidas.
- Intent claro: cada prompt expressa um de — research, comparison, validation, migration, pricing, integration, pain_point.
- Nunca nomeies a marca do cliente — queremos ver se aparece organicamente.
- Português europeu (PT-PT) por defeito; PT-BR só se o público-alvo for tipicamente brasileiro.
- Varia a formulação dentro da mesma categoria.`;

async function loadSkillPrompts(): Promise<string | null> {
  try {
    const res = await fetch(SKILL_PROMPTS_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const md = await res.text();
    const startIdx = md.indexOf("## 1.");
    if (startIdx === -1) return null;
    const endIdx = md.indexOf("## 4.");
    const slice = (endIdx > startIdx ? md.slice(startIdx, endIdx) : md.slice(startIdx)).trim();
    return slice.length > 0 ? slice : null;
  } catch {
    return null;
  }
}

function tierFor(count: 5 | 30): AuditTier {
  return count === 5 ? "free" : "diagnostic";
}

function contextBlock(ctx: AuditPromptContext): string {
  return `CLIENTE:
- Empresa: ${ctx.company_name?.trim() || "não especificada"}
- Negócio: ${ctx.business_type?.trim() || "não especificado"}
- Localização: ${ctx.location?.trim() || "não especificada"}
- Público-alvo: ${ctx.target_audience?.trim() || "não especificado"}
- Concorrentes conhecidos: ${
    ctx.competitors?.length ? ctx.competitors.join(", ") : "não especificados"
  }`;
}

export function buildAuditPromptRequest(
  ctx: AuditPromptContext,
  distribution: Record<PromptCategory, number>,
): string {
  const total = Object.values(distribution).reduce((s, n) => s + n, 0);
  const cats = PROMPT_CATEGORIES.map(
    (c) => `- ${c}: ${distribution[c]} prompts (${CATEGORY_BRIEF[c]})`,
  ).join("\n");
  return `${contextBlock(ctx)}

TAREFA: Gera ${total} prompts de auditoria GEO — exactamente esta distribuição:
${cats}

REGRAS de saída:
- Para cada prompt devolve text, category (uma das 5 acima) e intent (frase curta que descreve a intenção de compra — research/comparison/validation/migration/pricing/integration/pain_point).
- Aplica os princípios acima (persona implícita, contexto realista, sem nomear a marca do cliente, variação dentro da categoria).`;
}

export const AUDIT_PROMPT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    prompts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          category: { type: "string", enum: PROMPT_CATEGORIES },
          intent: { type: "string" },
        },
        required: ["text", "category", "intent"],
      },
    },
  },
  required: ["prompts"],
};

type RawPrompt = { text?: string; category?: string; intent?: string };

export type GenerateAuditPromptsResult = {
  prompts: AuditPrompt[];
  source: "claude" | "fallback";
};

function isCategory(value: string | undefined): value is PromptCategory {
  return value != null && (PROMPT_CATEGORIES as string[]).includes(value);
}

function toAuditPrompt(raw: RawPrompt, model: string): AuditPrompt | null {
  const text = raw.text?.trim();
  if (!text || !isCategory(raw.category)) return null;
  return {
    id: randomUUID(),
    text,
    category: raw.category,
    intent: raw.intent?.trim() || "—",
    generated_by_model: model,
    generated_at: new Date().toISOString(),
  };
}

// Tarifa aproximada de Claude Sonnet 4.6, em EUR por 1M tokens.
const CLAUDE_EUR_PER_MTOK = { input: 2.8, output: 14 };

function logCost(usage: { input: number; output: number }, total: number) {
  const eur =
    (usage.input * CLAUDE_EUR_PER_MTOK.input + usage.output * CLAUDE_EUR_PER_MTOK.output) /
    1_000_000;
  console.log(
    `[generate-audit-prompts] ${total} prompts · ${usage.input} in + ${usage.output} out tok · ~€${eur.toFixed(4)}`,
  );
}

/**
 * Gera os prompts da auditoria. `count` é 5 (free) ou 30 (diagnóstico) e
 * mapeia 1:1 ao tier. Fetcha o `prompts.md` da skill como contexto canónico
 * (princípios + categorias + distribuição § 1-3); cai em SYSTEM_FALLBACK se
 * o fetch falhar. Cai em `fallbackAuditPrompts` se Claude falhar.
 */
export async function generateAuditPrompts(
  ctx: AuditPromptContext,
  count: 5 | 30,
): Promise<GenerateAuditPromptsResult> {
  const distribution = TIER_DISTRIBUTION[tierFor(count)];
  const skillContext = await loadSkillPrompts();

  if (skillContext) {
    console.log(`[generate-audit-prompts] skill loaded (${skillContext.length} chars)`);
  } else {
    console.log("[generate-audit-prompts] skill unavailable, using fallback principles");
  }

  if (!hasAnthropicKey()) {
    return { prompts: fallbackAuditPrompts(ctx, count), source: "fallback" };
  }

  const system = skillContext
    ? `${SYSTEM_BASE}\n\nUsa estes princípios e categorias canónicas como guia (fonte: skill geo-seo-aeo-master, § 1-3 verbatim):\n\n${skillContext}`
    : SYSTEM_FALLBACK;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, usage } = await claudeJson<{ prompts: RawPrompt[] }>({
        system,
        prompt: buildAuditPromptRequest(ctx, distribution),
        schema: AUDIT_PROMPT_SCHEMA,
        maxTokens: count === 30 ? 4096 : 1024,
      });
      const prompts = (data.prompts ?? [])
        .map((p) => toAuditPrompt(p, CLAUDE_MODEL))
        .filter((p): p is AuditPrompt => p !== null);

      if (prompts.length >= count) {
        const final = prompts.slice(0, count);
        logCost(usage, final.length);
        return { prompts: final, source: "claude" };
      }
    } catch {
      // continua para a tentativa seguinte
    }
  }

  return { prompts: fallbackAuditPrompts(ctx, count), source: "fallback" };
}

// --- Fallback determinístico --------------------------------------------

const FALLBACK_TEMPLATES: Record<PromptCategory, ((biz: string, loc: string) => string)[]> = {
  generic_category: [
    (b) => `Melhor opção de ${b}`,
    (b) => `Como escolher um bom ${b}`,
    (b) => `O que avaliar ao contratar ${b}`,
    (b) => `${b}: por onde começar`,
    (b) => `Vale a pena investir em ${b}`,
    (b) => `Principais tendências em ${b}`,
    (b) => `Como resolver o problema de ${b}`,
    (b) => `${b}: panorama do mercado`,
  ],
  direct_comparison: [
    (b) => `Comparação das melhores soluções de ${b}`,
    (b) => `Que alternativas considerar em ${b}`,
    (b) => `${b}: que fornecedor escolher`,
    (b) => `Prós e contras das principais opções de ${b}`,
    (b) => `Que ${b} tem melhor reputação`,
    (b) => `Comparar fornecedores de ${b} lado a lado`,
    (b) => `Migrar entre fornecedores de ${b}: prós e contras`,
    (b) => `${b}: shortlist de líderes do mercado`,
  ],
  local_recommendation: [
    (b, l) => `Melhor ${b}${l}`,
    (b, l) => `Recomendações de ${b}${l}`,
    (b, l) => `Onde encontrar ${b} de confiança${l}`,
    (b, l) => `${b} bem avaliado${l}`,
    (b, l) => `Quem oferece ${b}${l}`,
    (b, l) => `Melhores empresas de ${b}${l}`,
  ],
  feature_specific: [
    (b) => `${b} com melhor suporte ao cliente`,
    (b) => `${b} com integrações e automação`,
    (b) => `Que ${b} oferece a melhor experiência`,
    (b) => `${b} adequado a empresas em crescimento`,
  ],
  price_comparison: [
    (b) => `Quanto custa ${b}`,
    (b) => `Preços de ${b}`,
    (b) => `${b} com melhor relação qualidade-preço`,
    (b) => `Planos e custos de ${b}`,
  ],
};

const CATEGORY_INTENT: Record<PromptCategory, string> = {
  generic_category: "explorar opções no mercado",
  direct_comparison: "comparar fornecedores antes de decidir",
  local_recommendation: "encontrar um fornecedor na sua região",
  feature_specific: "avaliar uma capacidade concreta",
  price_comparison: "perceber custos e orçamento",
};

export function fallbackAuditPrompts(ctx: AuditPromptContext, count: 5 | 30): AuditPrompt[] {
  const distribution = TIER_DISTRIBUTION[tierFor(count)];
  const biz = ctx.business_type?.trim() || "este serviço";
  const loc = ctx.location?.trim() ? ` em ${ctx.location.trim()}` : "";
  const now = new Date().toISOString();
  const out: AuditPrompt[] = [];

  for (const category of PROMPT_CATEGORIES) {
    const templates = FALLBACK_TEMPLATES[category];
    const n = distribution[category];
    for (let i = 0; i < n; i++) {
      out.push({
        id: randomUUID(),
        text: templates[i % templates.length](biz, loc),
        category,
        intent: CATEGORY_INTENT[category],
        generated_by_model: "fallback",
        generated_at: now,
      });
    }
  }
  return out;
}
