import { loadSkillFile } from "./loader";

/**
 * Fetches `references/benchmarks.md` da skill e expõe stats com fonte
 * para uso no deck. Princípio SINAL: **nenhuma estatística sem fonte**.
 * Se um stat não conseguir ser parsed/encontrado, devolve null — o
 * caller esconde o card em vez de inventar.
 */

export type Benchmark = {
  key: string;
  value: string;
  caption: string;
  source_name: string;
  source_url: string;
  date: string;
};

/**
 * Fallback hardcoded — 3 stats core para o Slide 03 alinhados com
 * benchmarks.md à data do last refresh. Usado se o fetch falhar.
 */
const FALLBACK_BENCHMARKS: Benchmark[] = [
  {
    key: "b2b_ai_answer",
    value: "82%",
    caption: "das pesquisas em tech B2B já acionam uma resposta de IA",
    source_name: "BrightEdge, 2026 (36% → 82% em 12 meses)",
    source_url:
      "https://www.brightedge.com/resources/weekly-ai-search-insights/ai-overviews-one-year-presence-size-citing",
    date: "2026-02-01",
  },
  {
    key: "aio_click_share",
    value: "~1%",
    caption: "dos utilizadores clica numa fonte dentro de uma AI Overview",
    source_name: "Pew Research, Jul 2025 (CTR 8% vs 15%)",
    source_url:
      "https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/",
    date: "2025-07-22",
  },
  {
    key: "cited_brand_clicks",
    value: "35%",
    caption: "mais cliques orgânicos para marcas citadas em respostas de IA",
    source_name: "Seer Interactive, 2026 (2,43 mil milhões de impressões)",
    source_url: "https://www.seerinteractive.com/insights",
    date: "2026-01-01",
  },
  {
    key: "aio_top10_share",
    value: "54%",
    caption: "das citações em AI Overviews vêm de URLs no top-10 orgânico",
    source_name: "BrightEdge, 2025 (rank overlap, 16 meses)",
    source_url:
      "https://www.brightedge.com/resources/weekly-ai-search-insights/rank-overlap-after-16-months-of-aio",
    date: "2025-11-01",
  },
];

const CORE_STATS_HEADER = "## Deck Builder core stats";

/**
 * Mínimo de linhas válidas para confiar na tabela da skill: os 3 stats
 * headline do Slide 03. Stats adicionais (ex. `aio_top10_share` no Slide
 * 05) são lookups opcionais por `key` — a sua ausência esconde o número
 * nesse slide, não invalida a tabela inteira.
 */
const MIN_VALID_BENCHMARKS = 3;

/**
 * Parse a tabela `## Deck Builder core stats` de benchmarks.md.
 * Header: `| key | value | caption | source | url | date |`. Cells podem
 * vir em backticks (`b2b_ai_answer`) — strip-os. Pára na próxima secção
 * `## `. Devolve [] se a tabela faltar — o caller decide o fallback.
 */
function parseCoreBenchmarks(body: string): Benchmark[] {
  const idx = body.indexOf(CORE_STATS_HEADER);
  if (idx < 0) return [];
  const lines = body.slice(idx + CORE_STATS_HEADER.length).split("\n");
  const out: Benchmark[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) break; // próxima secção termina a tabela
    if (!trimmed.startsWith("|")) continue;
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue; // separador
    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim().replace(/^`|`$/g, ""));
    if (cells.length < 6) continue;
    const [key, value, caption, source_name, source_url, date] = cells;
    if (key.toLowerCase() === "key") continue; // linha de cabeçalho
    if (!key || !value || !caption) continue;
    out.push({ key, value, caption, source_name, source_url, date });
  }
  return out;
}

export async function loadCoreBenchmarks(): Promise<{
  items: Benchmark[];
  source: "skill" | "fallback";
}> {
  const result = await loadSkillFile({
    path: "references/benchmarks.md",
    fallback: "",
  });
  if (result.source === "fallback" || !result.body) {
    return { items: FALLBACK_BENCHMARKS, source: "fallback" };
  }
  const parsed = parseCoreBenchmarks(result.body);
  // Skill alcançável mas tabela ausente/incompleta → fallback seguro.
  if (parsed.length < MIN_VALID_BENCHMARKS) {
    return { items: FALLBACK_BENCHMARKS, source: "fallback" };
  }
  return { items: parsed, source: "skill" };
}

/**
 * Procura um stat por `key` (ex. "aio_top10_share"). Devolve undefined se
 * ausente — o slide renderiza graciosamente sem o número, nunca o inventa.
 */
export function findBenchmark(items: Benchmark[], key: string): Benchmark | undefined {
  return items.find((b) => b.key === key);
}
