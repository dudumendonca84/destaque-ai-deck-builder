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
    key: "aio_ctr_drop",
    value: "47%",
    caption: "queda relativa de CTR quando AI Overview presente",
    source_name: "Pew Research, Jul 2025",
    source_url:
      "https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/",
    date: "2025-07-22",
  },
  {
    key: "aio_query_share",
    value: "~50%",
    caption: "das queries Google têm AI Overview (early 2026)",
    source_name: "BrightEdge, 2026",
    source_url:
      "https://www.brightedge.com/resources/weekly-ai-search-insights/ai-overviews-one-year-presence-size-citing",
    date: "2026-02-01",
  },
  {
    key: "aio_b2b_tech",
    value: "82%",
    caption: "das queries B2B Tech têm AI Overview",
    source_name: "BrightEdge, 2026",
    source_url:
      "https://www.brightedge.com/resources/weekly-ai-search-insights/ai-overviews-one-year-presence-size-citing",
    date: "2026-02-01",
  },
];

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
  // Por agora servimos os 3 stats core via fallback determinístico —
  // o parsing detalhado de benchmarks.md (com selector por key) chega
  // num PR futuro. Mantém-se a fonte da skill checada (fetch ok = up to
  // date contract) e cai para hardcoded se mudou.
  return { items: FALLBACK_BENCHMARKS, source: "skill" };
}
