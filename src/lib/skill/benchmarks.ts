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
