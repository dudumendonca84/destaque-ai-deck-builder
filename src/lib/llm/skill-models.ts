import { ENGINES, type Engine } from "./models";
import type { AuditTier } from "@/lib/supabase/types";

// Parser do bloco "## Deck Builder API mappings" no models.md da skill
// geo-seo-aeo-master. Contrato:
//   - secção: "## Deck Builder API mappings"
//   - tabela com header: | Deck engine | Vendor | production | cost_optimized |
//   - IDs API em backticks (strip)
//   - tier mapping: free → cost_optimized, diagnostic → production

const SKILL_MODELS_URL =
  "https://raw.githubusercontent.com/dudumendonca84/geo-seo-aeo-master/main/skills/geo-seo-aeo-master/references/models.md";

const FETCH_TIMEOUT_MS = 3000;

export type EngineModelMap = Partial<Record<Engine, string>>;

type Mapping = { production: string; cost_optimized: string };
type Mappings = Partial<Record<Engine, Mapping>>;

/**
 * Carrega o mapping motor→modelo da skill, seleccionando a coluna pelo tier.
 * Devolve null se o fetch ou o parse falharem — os defaults em `models.ts`
 * servem como fallback no wrapper de cada motor.
 */
export async function loadSkillModelMap(tier: AuditTier): Promise<EngineModelMap | null> {
  const mappings = await loadMappings();
  if (!mappings) return null;
  const column: keyof Mapping = tier === "diagnostic" ? "production" : "cost_optimized";
  const out: EngineModelMap = {};
  for (const engine of Object.keys(mappings) as Engine[]) {
    const m = mappings[engine];
    if (m) out[engine] = m[column];
  }
  return Object.keys(out).length > 0 ? out : null;
}

async function loadMappings(): Promise<Mappings | null> {
  try {
    const res = await fetch(SKILL_MODELS_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    return parseMappings(await res.text());
  } catch {
    return null;
  }
}

export function parseMappings(md: string): Mappings | null {
  const heading = md.indexOf("## Deck Builder API mappings");
  if (heading === -1) return null;

  const lines = md.slice(heading).split("\n");
  const out: Mappings = {};
  let columns: string[] | null = null;
  let inTable = false;

  for (const raw of lines) {
    const line = raw.trim();

    if (!inTable) {
      if (line.startsWith("| Deck engine")) {
        columns = parseRow(line);
        continue;
      }
      if (columns && /^\|\s*[-:|\s]+\|/.test(line)) {
        inTable = true;
        continue;
      }
      continue;
    }

    if (!line.startsWith("|")) break;
    const cells = parseRow(line);
    if (!columns || cells.length < columns.length) continue;

    const prodIdx = columns.indexOf("production");
    const costIdx = columns.indexOf("cost_optimized");
    if (prodIdx === -1 || costIdx === -1) return null;

    const engineName = stripBackticks(cells[0]);
    const production = stripBackticks(cells[prodIdx]);
    const cost_optimized = stripBackticks(cells[costIdx]);

    if ((ENGINES as readonly string[]).includes(engineName) && production && cost_optimized) {
      out[engineName as Engine] = { production, cost_optimized };
    }
  }

  return Object.keys(out).length > 0 ? out : null;
}

function parseRow(line: string): string[] {
  return line.split("|").slice(1, -1).map((c) => c.trim());
}

function stripBackticks(s: string): string {
  return s.replace(/`/g, "").trim();
}
