// IDs de modelo centralizados — FALLBACK puro. Em produção os modelos vêm de
// `references/models.md` da skill (resolveModel). Estes valores só são usados
// se o fetch à skill falhar, por isso têm de apontar para modelos VIVOS:
// alinhados com o tracker (gemini-2.0-flash foi descontinuado 2026-06-01,
// grok-2-1212 e deepseek-chat são legados).
export const CLAUDE_MODEL = "claude-sonnet-4-6";
export const OPENAI_MODEL = "gpt-5";
export const GEMINI_MODEL = "gemini-3.5-flash";
export const GROK_MODEL = "grok-4";
export const DEEPSEEK_MODEL = "deepseek-v4";
export const MISTRAL_MODEL = "mistral-large-latest";

export const ENGINES = [
  "chatgpt",
  "claude",
  "gemini",
  "grok",
  "deepseek",
  "mistral",
] as const;
export type Engine = (typeof ENGINES)[number];

/** Número de motores activos — usado em UI/deck para evitar hardcode. */
export const ENGINE_COUNT = ENGINES.length;

export const ENGINE_LABEL: Record<Engine, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  grok: "Grok",
  deepseek: "DeepSeek",
  mistral: "Mistral",
};

export const ENGINE_VERSION: Record<Engine, string> = {
  chatgpt: OPENAI_MODEL,
  claude: "sonnet 4.6",
  gemini: GEMINI_MODEL,
  grok: GROK_MODEL,
  deepseek: DEEPSEEK_MODEL,
  mistral: MISTRAL_MODEL,
};
