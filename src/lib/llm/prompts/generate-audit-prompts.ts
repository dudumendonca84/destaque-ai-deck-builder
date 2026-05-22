import { randomUUID } from "crypto";
import { claudeJson, hasAnthropicKey } from "../anthropic";
import { CLAUDE_MODEL } from "../models";
import type { AuditPrompt, PromptCategory } from "@/lib/supabase/types";

// Geração estruturada dos prompts da auditoria GEO (Step 9). Independente do
// gerador legacy `generate-prompts.ts`, que continua a servir o wizard.

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

const CATEGORY_BRIEF: Record<PromptCategory, string> = {
  generic_category:
    "categoria genérica — pergunta ampla sobre o tipo de serviço/produto, sem nomear empresas",
  direct_comparison: "comparação directa — confronta fornecedores ou soluções entre si",
  local_recommendation:
    "recomendação local — pede recomendações para uma geografia específica",
  feature_specific: "feature específica — foca uma funcionalidade ou capacidade concreta",
  price_comparison: "comparação de preços — pergunta sobre custos, planos ou orçamento",
};

const SYSTEM =
  "Ajudas uma agência de Generative Engine Optimization a auditar a visibilidade de um cliente em motores de IA (ChatGPT, Claude, Gemini, Perplexity). Geras perguntas realistas que um decisor B2B escreveria mesmo a um LLM ao avaliar fornecedores.";

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

export function buildAuditPromptRequest(ctx: AuditPromptContext, perCategory: number): string {
  const total = perCategory * PROMPT_CATEGORIES.length;
  const cats = PROMPT_CATEGORIES.map((c) => `- ${c}: ${CATEGORY_BRIEF[c]}`).join("\n");
  return `${contextBlock(ctx)}

TAREFA: Gera ${total} prompts de auditoria GEO — exactamente ${perCategory} por cada uma destas ${PROMPT_CATEGORIES.length} categorias:
${cats}

REGRAS:
- Português europeu (PT-PT). PT-BR só se o público-alvo for tipicamente brasileiro.
- Cada prompt é uma pergunta natural que um decisor B2B faria mesmo a um LLM ao avaliar fornecedores deste tipo.
- NÃO menciones a empresa do cliente — queremos ver se aparece organicamente.
- Varia a formulação; evita prompts quase idênticos.
- "intent" é uma frase curta que descreve a intenção de compra por trás do prompt.`;
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
 * Gera os prompts da auditoria. `count` é 5 (auditoria gratuita) ou 30
 * (diagnóstico) — distribuídos igualmente pelas 5 categorias. Degrada para
 * o fallback determinístico se faltar a API key ou Claude falhar.
 */
export async function generateAuditPrompts(
  ctx: AuditPromptContext,
  count: 5 | 30,
): Promise<GenerateAuditPromptsResult> {
  const perCategory = count / PROMPT_CATEGORIES.length;

  if (!hasAnthropicKey()) {
    return { prompts: fallbackAuditPrompts(ctx, count), source: "fallback" };
  }

  // Até 2 tentativas — o parse de JSON pode falhar pontualmente.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data, usage } = await claudeJson<{ prompts: RawPrompt[] }>({
        system: SYSTEM,
        prompt: buildAuditPromptRequest(ctx, perCategory),
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
  ],
  direct_comparison: [
    (b) => `Comparação das melhores soluções de ${b}`,
    (b) => `Que alternativas considerar em ${b}`,
    (b) => `${b}: que fornecedor escolher`,
    (b) => `Prós e contras das principais opções de ${b}`,
    (b) => `Que ${b} tem melhor reputação`,
    (b) => `Comparar fornecedores de ${b} lado a lado`,
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
    (b) => `${b} com bom histórico de resultados`,
    (b) => `${b} fácil de implementar`,
  ],
  price_comparison: [
    (b) => `Quanto custa ${b}`,
    (b) => `Preços de ${b}`,
    (b) => `${b} com melhor relação qualidade-preço`,
    (b) => `Planos e custos de ${b}`,
    (b) => `${b} acessível para PME`,
    (b) => `Orçamento típico para ${b}`,
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
  const perCategory = count / PROMPT_CATEGORIES.length;
  const biz = ctx.business_type?.trim() || "este serviço";
  const loc = ctx.location?.trim() ? ` em ${ctx.location.trim()}` : "";
  const now = new Date().toISOString();
  const out: AuditPrompt[] = [];

  for (const category of PROMPT_CATEGORIES) {
    const templates = FALLBACK_TEMPLATES[category];
    for (let i = 0; i < perCategory; i++) {
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
