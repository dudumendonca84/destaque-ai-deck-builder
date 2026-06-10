import { loadSkillFile } from "./loader";
import type { Engine } from "@/lib/llm/models";
import type { AuditTier } from "@/lib/supabase/types";
import { WEB_SEARCH_CAPABLE, webSearchEnabledForTier } from "@/lib/llm/web-search";

/**
 * Consome `references/search_modes.md` da skill para derivar, por motor, se
 * o caminho `augmented` deve correr — uma única coluna boolean derivada da
 * coluna "augmented mode" da tabela canónica `## Per-engine augmentation
 * feature`. NÃO consome a coluna "API surface" — essa é informativa para
 * humanos; a mecânica de chamada (endpoint, tool name, payload shape) vive
 * em TS (`web-search.ts`, `responses-api.ts`, e cada adapter). Esta regra
 * está documentada no INTERFACES.md da skill e foi a lição amarga do bug do
 * Grok (search_parameters HTTP 410 a 2026-01-12) — parsear "API surface"
 * para fazer a chamada reintroduz exactamente esse tipo de regressão.
 *
 * Camada de capability (este ficheiro) ⇔ MD da skill.
 * Camada de mecânica (adapters)        ⇔ TS deste repo.
 *
 * Fallback: WEB_SEARCH_CAPABLE de `src/lib/llm/web-search.ts`. Skill
 * inacessível ⇒ comportamento idêntico ao pre-two-mode (cumpre o loader
 * contract: audit nunca bloqueia).
 *
 * Cache 1h via o loader partilhado.
 */

export type SearchMode = "knowledge" | "augmented";

export type EngineAugmentation = {
  /** Motor expõe pesquisa web nativa de primeira-parte na API que chamamos? */
  supportsAugmented: boolean;
  /** Search-grounded por definição (e.g. Perplexity); knowledge não é medível. */
  alwaysOn: boolean;
};

const SEARCH_MODES_HEADER = "## Per-engine augmentation feature";

/**
 * Fallback derivado do WEB_SEARCH_CAPABLE — fonte única de verdade do
 * fallback é o ficheiro técnico do meu colega de stack
 * (`web-search.ts`), para evitar drift entre o que a expansion vê e o
 * que os adapters realmente conseguem fazer.
 */
export function fallbackAugmentation(): Record<Engine, EngineAugmentation> {
  const out = {} as Record<Engine, EngineAugmentation>;
  for (const [engine, capable] of Object.entries(WEB_SEARCH_CAPABLE)) {
    out[engine as Engine] = { supportsAugmented: capable, alwaysOn: false };
  }
  return out;
}

function parseAugmentationTable(body: string): Record<Engine, EngineAugmentation> {
  const idx = body.indexOf(SEARCH_MODES_HEADER);
  if (idx < 0) return fallbackAugmentation();

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
    };
  }

  return { ...fallbackAugmentation(), ...out } as Record<Engine, EngineAugmentation>;
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
    return { augmentation: fallbackAugmentation(), source: "fallback" };
  }
  return { augmentation: parseAugmentationTable(result.body), source: "skill" };
}

/**
 * Expande motores em pares (engine, mode) para o orchestrator. Regras:
 *  - mistral / deepseek      → só knowledge (sem search nativo).
 *  - chatgpt/claude/gemini/grok → knowledge sempre; augmented se o tier
 *    actual o permitir (`webSearchEnabledForTier`).
 *  - alwaysOn (e.g. Perplexity, se vier a entrar no `ENGINES`) → só
 *    augmented; knowledge não é medível.
 *
 * O gate por tier é a única superfície de controlo operacional aqui — o
 * default no `web-search.ts` é "todos os tiers" (decisão do founder:
 * a pesquisa paga liga em todos os tiers). `AUDIT_WEB_SEARCH_TIERS=...`
 * fica como escape hatch sem deploy.
 */
export function expandEngineModes(
  engines: readonly Engine[],
  augmentation: Record<Engine, EngineAugmentation>,
  tier: AuditTier,
): Array<{ engine: Engine; mode: SearchMode }> {
  const allowAugmented = webSearchEnabledForTier(tier);
  const pairs: Array<{ engine: Engine; mode: SearchMode }> = [];
  for (const engine of engines) {
    const cfg = augmentation[engine] ?? fallbackAugmentation()[engine];
    if (cfg.alwaysOn) {
      pairs.push({ engine, mode: "augmented" });
    } else {
      pairs.push({ engine, mode: "knowledge" });
      if (cfg.supportsAugmented && allowAugmented) {
        pairs.push({ engine, mode: "augmented" });
      }
    }
  }
  return pairs;
}
