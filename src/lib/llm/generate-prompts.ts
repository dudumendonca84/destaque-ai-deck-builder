import { claudeJson, hasAnthropicKey } from "./anthropic";
import { fallbackPrompts } from "./fallback-prompts";

export type PromptContext = {
  business_type?: string | null;
  location?: string | null;
  company_name?: string | null;
  target_audience?: string | null;
  competitors?: string[] | null;
};

const SYSTEM = `Estás a ajudar uma agência de Generative Engine Optimization a auditar a visibilidade de um cliente em motores de IA (ChatGPT, Claude, Gemini, Perplexity).`;

function buildPrompt(ctx: PromptContext): string {
  return `CLIENTE:
- Negócio: ${ctx.business_type ?? "não especificado"}
- Localização: ${ctx.location ?? "não especificada"}
- Empresa: ${ctx.company_name ?? "não especificada"}
- Público-alvo: ${ctx.target_audience ?? "não especificado"}
- Concorrentes: ${ctx.competitors?.length ? ctx.competitors.join(", ") : "não especificados"}

TAREFA: Gera 5 prompts realistas que pessoas do público-alvo deste cliente fariam em ChatGPT/Claude/Gemini quando procuram um serviço como este.

REGRAS:
- Em português europeu (PT-PT) se a localização for Portugal
- Prompts naturais, curtos, como as pessoas escrevem mesmo
- Variedade: alguns com localização, outros comparativos, outros com intenção específica
- NÃO menciones a empresa do cliente nos prompts (queremos ver se aparece organicamente)
- Devolve exactamente 5 prompts.

Exemplos para "dentista em Braga":
1. Melhor dentista em Braga para implantes
2. Onde fazer ortodontia invisível Braga preços
3. Clínica dentária em Braga aberta sábados
4. Dentista pediátrico recomendado Braga centro
5. Tratamento de canal em Braga avaliações`;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    prompts: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["prompts"],
};

export type GeneratePromptsResult = {
  prompts: string[];
  source: "claude" | "fallback";
};

export async function generatePrompts(ctx: PromptContext): Promise<GeneratePromptsResult> {
  if (!hasAnthropicKey()) {
    return { prompts: fallbackPrompts(ctx), source: "fallback" };
  }
  try {
    const { data } = await claudeJson<{ prompts: string[] }>({
      system: SYSTEM,
      prompt: buildPrompt(ctx),
      schema: SCHEMA,
      maxTokens: 1024,
    });
    const prompts = (data.prompts ?? [])
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 7);
    if (prompts.length >= 3) return { prompts, source: "claude" };
    return { prompts: fallbackPrompts(ctx), source: "fallback" };
  } catch {
    return { prompts: fallbackPrompts(ctx), source: "fallback" };
  }
}
