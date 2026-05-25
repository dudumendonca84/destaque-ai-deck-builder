// IDs de modelo centralizados. Estes constants são o FALLBACK quando o
// fetch de `references/models.md` da skill falha (rede, parse error, 404).
// Em runtime normal os IDs vêm da skill via `loadModelMappings()` em
// `src/lib/skill/models.ts`.
//
// Alinhamento canónico em https://raw.githubusercontent.com/dudumendonca84/
// geo-seo-aeo-master/main/skills/geo-seo-aeo-master/references/models.md
// secção `## Deck Builder API mappings`.
//
// Production: tier `diagnostic` / `premium`. Cost-optimized: tier `free`.

export const CLAUDE_MODEL = "claude-sonnet-4-6";
export const CLAUDE_MODEL_COST = "claude-haiku-4-5-20251001";

export const OPENAI_MODEL = "gpt-5";
export const OPENAI_MODEL_COST = "gpt-4o";

export const GEMINI_MODEL = "gemini-3.5-flash";
export const GEMINI_MODEL_COST = "gemini-2.5-flash";

export const GROK_MODEL = "grok-4";
export const GROK_MODEL_COST = "grok-4.1-fast";

export const DEEPSEEK_MODEL = "deepseek-v4";
export const DEEPSEEK_MODEL_COST = "deepseek-v4-flash";

export const MISTRAL_MODEL = "mistral-large-latest";
export const MISTRAL_MODEL_COST = "mistral-small-latest";

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
  claude: CLAUDE_MODEL,
  gemini: GEMINI_MODEL,
  grok: GROK_MODEL,
  deepseek: DEEPSEEK_MODEL,
  mistral: MISTRAL_MODEL,
};
