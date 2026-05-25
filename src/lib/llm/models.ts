// IDs de modelo centralizados. Atualizar aqui propaga para toda a app.
export const CLAUDE_MODEL = "claude-sonnet-4-6";
export const OPENAI_MODEL = "gpt-4o";
export const GEMINI_MODEL = "gemini-2.0-flash";
export const GROK_MODEL = "grok-2-1212";
export const DEEPSEEK_MODEL = "deepseek-chat";
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
