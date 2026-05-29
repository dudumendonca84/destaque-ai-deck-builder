import { claudeJson, hasAnthropicKey } from "../anthropic";
import { fallbackPrompts } from "../fallback-prompts";
import { loadPromptDirectives, loadPromptConfig } from "@/lib/skill/prompts";
import type {
  AuditTier,
  IntentStage,
  PromptCategory,
  TierDistribution,
} from "@/lib/skill/prompts";
import { PROMPT_CATEGORIES, INTENT_STAGES } from "@/lib/skill/prompts";

export type PromptContext = {
  business_type?: string | null;
  location?: string | null;
  company_name?: string | null;
  target_audience?: string | null;
  competitors?: string[] | null;
  tier?: AuditTier;
};

export type GeneratedPrompt = {
  text: string;
  category: PromptCategory;
  intent_stage: IntentStage;
};

export type GeneratePromptsResult = {
  prompts: string[]; // Texto puro, para compat com call sites antigos
  prompts_detailed: GeneratedPrompt[]; // Com category + intent_stage
  source: "claude" | "fallback";
  skill_source: "skill" | "fallback";
  tier: AuditTier;
};

const SYSTEM_BASE = `És parte do método SINAL (Sistema Integrado destaque.ai de Notabilidade em AI search e LLMs). Ajudas a gerar prompts de audit de visibilidade em motores de IA seguindo as regras canónicas da destaque.ai abaixo.`;

function buildSystem(directives: string): string {
  return `${SYSTEM_BASE}\n\n${directives}\n\nIntent stages canónicos: ${INTENT_STAGES.join(", ")}. Cada prompt deve receber um intent_stage que reflicta o estágio do funil que a query expressa.`;
}

function sumDist(dist: TierDistribution): number {
  return Object.values(dist).reduce((a, b) => a + b, 0);
}

function distributionTable(dist: TierDistribution): string {
  return PROMPT_CATEGORIES.map((cat) => `- ${cat}: ${dist[cat]}`).join("\n");
}

function buildPrompt(ctx: PromptContext, tier: AuditTier, dist: TierDistribution): string {
  const total = sumDist(dist);
  return `CLIENTE:
- Negócio: ${ctx.business_type ?? "não especificado"}
- Localização: ${ctx.location ?? "não especificada"}
- Empresa: ${ctx.company_name ?? "não especificada"}
- Público-alvo: ${ctx.target_audience ?? "não especificado"}
- Concorrentes: ${ctx.competitors?.length ? ctx.competitors.join(", ") : "não especificados"}

TIER: ${tier} (${total} prompts no total)

DISTRIBUIÇÃO POR CATEGORIA (segue exactamente):
${distributionTable(dist)}

TAREFA: Gera ${total} prompts em conformidade com a distribuição acima. Cada prompt segue os princípios SINAL e tem category + intent_stage. Sem nomear a marca do cliente. PT-PT por defeito; PT-BR só se o público-alvo for tipicamente brasileiro.

OUTPUT: array de exactamente ${total} objectos { text, category, intent_stage }.`;
}

const SCHEMA = {
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
          category: { type: "string", enum: [...PROMPT_CATEGORIES] },
          intent_stage: { type: "string", enum: [...INTENT_STAGES] },
        },
        required: ["text", "category", "intent_stage"],
      },
    },
  },
  required: ["prompts"],
};

async function attempt(opts: {
  system: string;
  ctx: PromptContext;
  tier: AuditTier;
  dist: TierDistribution;
}): Promise<GeneratedPrompt[]> {
  const total = sumDist(opts.dist);
  const { data } = await claudeJson<{ prompts: GeneratedPrompt[] }>({
    system: opts.system,
    prompt: buildPrompt(opts.ctx, opts.tier, opts.dist),
    schema: SCHEMA,
    maxTokens: opts.tier === "free" ? 1024 : 4096,
  });
  return (data.prompts ?? [])
    .map((p) => ({
      text: p.text?.trim() ?? "",
      category: p.category,
      intent_stage: p.intent_stage,
    }))
    .filter((p) => p.text && p.category && p.intent_stage)
    .slice(0, total);
}

function withDefaultIntent(prompts: string[]): GeneratedPrompt[] {
  // Fallback: assume todos generic_category + research stage. Não óptimo
  // mas mantém o schema válido para downstream.
  return prompts.map((text) => ({
    text,
    category: "generic_category" as PromptCategory,
    intent_stage: "research" as IntentStage,
  }));
}

export async function generateAuditPrompts(
  ctx: PromptContext,
): Promise<GeneratePromptsResult> {
  const tier: AuditTier = ctx.tier ?? "free";

  if (!hasAnthropicKey()) {
    const fallback = fallbackPrompts(ctx);
    return {
      prompts: fallback,
      prompts_detailed: withDefaultIntent(fallback),
      source: "fallback",
      skill_source: "fallback",
      tier,
    };
  }

  // Sequencial: o 1.º fetch popula a cache do loader; o 2.º (mesmo path) é hit.
  const directives = await loadPromptDirectives();
  const config = await loadPromptConfig();
  const dist = config.distribution[tier];
  const total = sumDist(dist);
  const system = buildSystem(directives.body);

  const minAcceptable = tier === "free" ? 3 : Math.max(5, total - 5);

  for (let i = 0; i < 2; i++) {
    try {
      const prompts_detailed = await attempt({ system, ctx, tier, dist });
      if (prompts_detailed.length >= minAcceptable) {
        return {
          prompts: prompts_detailed.map((p) => p.text),
          prompts_detailed,
          source: "claude",
          skill_source: directives.source,
          tier,
        };
      }
    } catch {
      // tenta de novo
    }
  }

  const fallback = fallbackPrompts(ctx);
  return {
    prompts: fallback,
    prompts_detailed: withDefaultIntent(fallback),
    source: "fallback",
    skill_source: directives.source,
    tier,
  };
}
