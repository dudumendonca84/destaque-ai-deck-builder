import { loadSkillFile } from "./loader";
import type { Engine } from "@/lib/llm/models";

/**
 * Parses references/search_modes.md from the skill to learn which engines
 * support augmented mode and how it is enabled. Single source of truth
 * for the two-mode audit contract. See:
 *   geo-seo-aeo-master/skills/geo-seo-aeo-master/references/search_modes.md
 *
 * Parse anchor: `## Per-engine augmentation feature` (exact, H2).
 * Table columns: Deck engine | Vendor | augmented mode | API surface | Notes
 *
 * The orchestrator uses `expandEngineModes(engines)` to know which
 * (engine, mode) pairs to enqueue for a run. Each engine adapter
 * branches internally on `searchMode` to call the right vendor surface.
 */

export type SearchMode = "knowledge" | "augmented";

export type EngineAugmentation = {
  supportsAugmented: boolean;
  alwaysOn: boolean;
  activation: string | null;
};

const SEARCH_MODES_HEADER = "## Per-engine augmentation feature";

const FALLBACK_AUGMENTATION: Record<Engine, EngineAugmentation> = {
  chatgpt: { supportsAugmented: true, alwaysOn: false, activation: "web_search" },
  claude: { supportsAugmented: true, alwaysOn: false, activation: "web_search" },
  gemini: { supportsAugmented: true, alwaysOn: false, activation: "google_search" },
  grok: { supportsAugmented: true, alwaysOn: false, activation: "live_search" },
  deepseek: { supportsAugmented: false, alwaysOn: false, activation: null },
  mistral: { supportsAugmented: false, alwaysOn: false, activation: null },
};

function parseAugmentationTable(body: string): Record<Engine, EngineAugmentation> {
  const idx = body.indexOf(SEARCH_MODES_HEADER);
  if (idx < 0) return FALLBACK_AUGMENTATION;

  const section = body.slice(idx);
  const out: Partial<Record<Engine, EngineAugmentation>> = {};

  for (const line of section.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    if (trimmed.includes("Deck engine") || /^\|[\s\-:|]+\|$/.test(trimmed)) continue;

    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim().replace(/^`|`$/g, ""));

    if (cells.length < 3) continue;
    const [engine, , mode] = cells;
    if (!engine || !mode) continue;

    const lowered = mode.toLowerCase();
    const alwaysOn = lowered.includes("always") || lowered.includes("n/a");
    const notSupported = lowered.includes("not supported");
    out[engine as Engine] = {
      supportsAugmented: !notSupported && !alwaysOn,
      alwaysOn,
      activation: notSupported || alwaysOn ? null : mode,
    };
  }

  return { ...FALLBACK_AUGMENTATION, ...out } as Record<Engine, EngineAugmentation>;
}

export async function loadEngineAugmentation(): Promise<{
  augmentation: Record<Engine, EngineAugmentation>;
  source: "skill" | "fallback";
}> {
  const result = await loadSkillFile({
    path: "references/search_modes.md",
    fallback: "",
  });
  if (result.source === "fallback") {
    return { augmentation: FALLBACK_AUGMENTATION, source: "fallback" };
  }
  return { augmentation: parseAugmentationTable(result.body), source: "skill" };
}

/**
 * Expand the set of engines into (engine, mode) pairs the orchestrator
 * should actually call. Respects the skill rules:
 *   - knowledge: every engine except `alwaysOn`
 *   - augmented: every engine with `supportsAugmented`
 *   - alwaysOn: emit only augmented (search-grounded by definition)
 */
export function expandEngineModes(
  engines: readonly Engine[],
  augmentation: Record<Engine, EngineAugmentation>,
): Array<{ engine: Engine; mode: SearchMode }> {
  const pairs: Array<{ engine: Engine; mode: SearchMode }> = [];
  for (const engine of engines) {
    const cfg = augmentation[engine] ?? FALLBACK_AUGMENTATION[engine];
    if (cfg.alwaysOn) {
      pairs.push({ engine, mode: "augmented" });
    } else {
      pairs.push({ engine, mode: "knowledge" });
      if (cfg.supportsAugmented) pairs.push({ engine, mode: "augmented" });
    }
  }
  return pairs;
}
