// IDs de modelo centralizados. Atualizar aqui propaga para toda a app.
export const CLAUDE_MODEL = "claude-sonnet-4-6";
export const OPENAI_MODEL = "gpt-4o";
export const GEMINI_MODEL = "gemini-2.0-flash";
export const PERPLEXITY_MODEL = "sonar";

export const ENGINES = ["chatgpt", "claude", "gemini", "perplexity"] as const;
export type Engine = (typeof ENGINES)[number];

export const ENGINE_LABEL: Record<Engine, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

export const ENGINE_VERSION: Record<Engine, string> = {
  chatgpt: OPENAI_MODEL,
  claude: "sonnet 4.6",
  gemini: GEMINI_MODEL,
  perplexity: PERPLEXITY_MODEL,
};
