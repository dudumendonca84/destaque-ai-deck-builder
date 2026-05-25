// IDs de modelo centralizados. Atualizar aqui propaga para toda a app.
// A skill (`references/models.md`) é o source-of-truth real para production
// vs cost_optimized — estes valores são fallbacks usados se o fetch falhar.
export const CLAUDE_MODEL = "claude-sonnet-4-6";
export const OPENAI_MODEL = "gpt-4o";
export const GEMINI_MODEL = "gemini-2.0-flash";
export const GROK_MODEL = "grok-2-1212";
export const DEEPSEEK_MODEL = "deepseek-chat";
export const MISTRAL_MODEL = "mistral-large-latest";
export const PERPLEXITY_MODEL = "sonar";
export const META_MODEL = "meta-llama/llama-3.1-405b-instruct";
export const COPILOT_MODEL = "gpt-4o";

export const ENGINES = [
  "chatgpt",
  "claude",
  "gemini",
  "grok",
  "deepseek",
  "mistral",
  "perplexity",
  "meta",
  "copilot",
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
  perplexity: "Perplexity",
  meta: "Meta",
  copilot: "Copilot",
};

export const ENGINE_VERSION: Record<Engine, string> = {
  chatgpt: OPENAI_MODEL,
  claude: "sonnet 4.6",
  gemini: GEMINI_MODEL,
  grok: GROK_MODEL,
  deepseek: DEEPSEEK_MODEL,
  mistral: MISTRAL_MODEL,
  perplexity: PERPLEXITY_MODEL,
  meta: META_MODEL,
  copilot: COPILOT_MODEL,
};
