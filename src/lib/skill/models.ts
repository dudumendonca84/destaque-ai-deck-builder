import { loadSkillFile } from "./loader";
import type { Engine } from "@/lib/llm/models";
import {
  CLAUDE_MODEL,
  CLAUDE_MODEL_COST,
  OPENAI_MODEL,
  OPENAI_MODEL_COST,
  GEMINI_MODEL,
  GEMINI_MODEL_COST,
  GROK_MODEL,
  GROK_MODEL_COST,
  DEEPSEEK_MODEL,
  DEEPSEEK_MODEL_COST,
  MISTRAL_MODEL,
  MISTRAL_MODEL_COST,
} from "@/lib/llm/models";
import type { AuditTier } from "./prompts";

export type EngineModelEntry = {
  production: string;
  cost_optimized: string;
};

/**
 * Fallback hardcoded das API mappings. Reflicte o estado conhecido à
 * data do last refresh do contracto. Usado se o fetch a models.md
 * falhar (rede, parse, etc.).
 */
const FALLBACK_MAPPINGS: Record<Engine, EngineModelEntry> = {
  chatgpt: { production: OPENAI_MODEL, cost_optimized: OPENAI_MODEL_COST },
  claude: { production: CLAUDE_MODEL, cost_optimized: CLAUDE_MODEL_COST },
  gemini: { production: GEMINI_MODEL, cost_optimized: GEMINI_MODEL_COST },
  grok: { production: GROK_MODEL, cost_optimized: GROK_MODEL_COST },
  deepseek: { production: DEEPSEEK_MODEL, cost_optimized: DEEPSEEK_MODEL_COST },
  mistral: { production: MISTRAL_MODEL, cost_optimized: MISTRAL_MODEL_COST },
};

const MAPPINGS_HEADER = "## Deck Builder API mappings";

/**
 * Parse o bloco `## Deck Builder API mappings` de models.md. A tabela
 * tem header `| Deck engine | Vendor | production | cost_optimized |`.
 * Cells com backticks (`gpt-5`); strip-os.
 *
 * Engines no MD que não existam no TS são ignoradas silenciosamente.
 * Engines no TS que faltem no MD herdam o fallback hardcoded.
 */
function parseMappings(body: string): Record<Engine, EngineModelEntry> {
  const idx = body.indexOf(MAPPINGS_HEADER);
  if (idx < 0) return FALLBACK_MAPPINGS;

  const section = body.slice(idx);
  const lines = section.split("\n");
  const out: Record<string, EngineModelEntry> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    // Skip header e separator
    if (trimmed.includes("Deck engine") || /^\|[\s\-:|]+\|$/.test(trimmed)) continue;

    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim().replace(/^`|`$/g, ""));

    if (cells.length < 4) continue;
    const [engine, , production, cost_optimized] = cells;
    if (!engine || !production || !cost_optimized) continue;
    out[engine] = { production, cost_optimized };
  }

  // Merge com fallback para engines que faltam no MD
  return { ...FALLBACK_MAPPINGS, ...(out as Record<Engine, EngineModelEntry>) };
}

export async function loadModelMappings(): Promise<{
  mappings: Record<Engine, EngineModelEntry>;
  source: "skill" | "fallback";
}> {
  const result = await loadSkillFile({
    path: "references/models.md",
    fallback: "",
  });
  if (result.source === "fallback") {
    return { mappings: FALLBACK_MAPPINGS, source: "fallback" };
  }
  return { mappings: parseMappings(result.body), source: "skill" };
}

export function resolveModel(
  mappings: Record<Engine, EngineModelEntry>,
  engine: Engine,
  tier: AuditTier,
): string {
  const entry = mappings[engine] ?? FALLBACK_MAPPINGS[engine];
  // free → cost_optimized; diagnostic + premium → production
  return tier === "free" ? entry.cost_optimized : entry.production;
}
