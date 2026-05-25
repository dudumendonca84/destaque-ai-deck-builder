import { claudeJson, hasAnthropicKey } from "../anthropic";
import { fallbackPrompts } from "../fallback-prompts";
import { loadPromptDirectives } from "@/lib/skill/prompts";
import type { AuditTier } from "@/lib/skill/prompts";
import { PROMPT_CATEGORIES, TIER_DISTRIBUTION, tierTotal } from "@/lib/skill/prompts";

export type PromptContext = {
  business_type?: string | null;
  location?: string | null;
  company_name?: string | null;
  target_audience?: string | null;
  competitors?: string[] | null;
  tier?: AuditTier;
};

export type GeneratePromptsResult = {
  prompts: string[];
  source: "claude" | "fallback";
  skill_source: "skill" | "fallback";
  tier: AuditTier;
};

const SYSTEM_BASE = `És parte do método SINAL (Sistema Integrado destaque.ai de Notabilidade em AI search e LLMs). Ajudas a gerar prompts de audit de visibilidade em motores de IA (ChatGPT, Claude, Gemini, Grok, DeepSeek, Mistral) seguindo as regras canónicas da destaque.ai abaixo.`;

function buildSystem(directives: string): string {
  return `${SYSTEM_BASE}\n\n${directives}`;
}

function distributionTable(tier: AuditTier): string {
  const dist = TIER_DISTRIBUTION[tier];
  const lines = PROMPT_CATEGORIES.map((cat) => `- ${cat}: ${dist[cat]}`);
  return lines.join("\n");
}

function buildPrompt(ctx: PromptContext, tier: AuditTier): string {
  const total = tierTotal(tier);
  return `CLIENTE:
- Negócio: ${ctx.business_type ?? "não especificado"}
- Localização: ${ctx.location ?? "não especificada"}
- Empresa: ${ctx.company_name ?? "não especificada"}
- Público-alvo: ${ctx.target_audience ?? "não especificado"}
- Concorrentes: ${ctx.competitors?.length ? ctx.competitors.join(", ") : "não especificados"}

TIER: ${tier} (${total} prompts no total)

DISTRIBUIÇÃO POR CATEGORIA CANÓNICA (segue exactamente):
${distributionTable(tier)}

TAREFA: Gera ${total} prompts em conformidade com a distribuição acima. Cada prompt segue os princípios e categorias canónicas SINAL. Sem nomear a marca do cliente (queremos ver se aparece organicamente). PT-PT por defeito; PT-BR só se o público-alvo for tipicamente brasileiro.

OUTPUT: devolve um array de exactamente ${total} strings.`;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    prompts: { type: "array", items: { type: "string" } },
  },
  required: ["prompts"],
};

async function attempt(opts: {
  system: string;
  ctx: PromptContext;
  tier: AuditTier;
}): Promise<string[]> {
  const total = tierTotal(opts.tier);
  const { data } = await claudeJson<{ prompts: string[] }>({
    system: opts.system,
    prompt: buildPrompt(opts.ctx, opts.tier),
    schema: SCHEMA,
    maxTokens: opts.tier === "free" ? 1024 : 4096,
  });
  return (data.prompts ?? [])
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, total);
}

export async function generateAuditPrompts(
  ctx: PromptContext,
): Promise<GeneratePromptsResult> {
  const tier: AuditTier = ctx.tier ?? "free";
  const total = tierTotal(tier);

  if (!hasAnthropicKey()) {
    return {
      prompts: fallbackPrompts(ctx),
      source: "fallback",
      skill_source: "fallback",
      tier,
    };
  }

  const directives = await loadPromptDirectives();
  const system = buildSystem(directives.body);

  // Mínimo aceitável: free precisa de ≥3; diagnostic precisa de ≥ total - 5.
  const minAcceptable = tier === "free" ? 3 : Math.max(5, total - 5);

  for (let i = 0; i < 2; i++) {
    try {
      const prompts = await attempt({ system, ctx, tier });
      if (prompts.length >= minAcceptable) {
        return { prompts, source: "claude", skill_source: directives.source, tier };
      }
    } catch {
      // tenta de novo
    }
  }

  return {
    prompts: fallbackPrompts(ctx),
    source: "fallback",
    skill_source: directives.source,
    tier,
  };
}
