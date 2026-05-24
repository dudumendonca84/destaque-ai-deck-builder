// IDs de modelo centralizados. Atualizar aqui propaga para toda a app.
export const CLAUDE_MODEL = "claude-sonnet-4-6";
export const OPENAI_MODEL = "gpt-4o";
export const GEMINI_MODEL = "gemini-3.5-flash";
export const PERPLEXITY_MODEL = "sonar";
export const MISTRAL_MODEL = "mistral-large-latest";
export const GROK_MODEL = "grok-4.1-fast";
export const DEEPSEEK_MODEL = "deepseek-v4-flash";

export const ENGINES = [
  "chatgpt",
  "claude",
  "gemini",
  "perplexity",
  "mistral",
  "grok",
  "deepseek",
] as const;
export type Engine = (typeof ENGINES)[number];

export const ENGINE_LABEL: Record<Engine, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
  mistral: "Mistral",
  grok: "Grok",
  deepseek: "DeepSeek",
};

export const ENGINE_VERSION: Record<Engine, string> = {
  chatgpt: OPENAI_MODEL,
  claude: "sonnet 4.6",
  gemini: GEMINI_MODEL,
  perplexity: PERPLEXITY_MODEL,
  mistral: MISTRAL_MODEL,
  grok: GROK_MODEL,
  deepseek: DEEPSEEK_MODEL,
};
