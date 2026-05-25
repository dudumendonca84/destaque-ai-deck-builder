// Metadados dos 19 slides — sem "use client", utilizável em Server Components
// (ex.: dashboard de analytics) e na geração de PDF.

export type SlideMeta = { n: number; id: string; title: string };

export const SLIDE_META: SlideMeta[] = [
  { n: 1, id: "cover", title: "Capa" },
  { n: 2, id: "problem", title: "O problema" },
  { n: 3, id: "data", title: "O contexto" },
  { n: 4, id: "live-audit", title: "Auditoria personalizada" },
  { n: 5, id: "seo-vs-geo", title: "SEO vs GEO" },
  { n: 6, id: "definition", title: "O que é GEO" },
  { n: 7, id: "methodology", title: "Metodologia" },
  { n: 8, id: "phases-1-2", title: "Fases 1 e 2" },
  { n: 9, id: "phases-3-4", title: "Fases 3 e 4" },
  { n: 10, id: "kpis", title: "Ponto de partida" },
  { n: 11, id: "pricing", title: "Investimento" },
  { n: 12, id: "next-steps", title: "Próximos passos" },
  { n: 13, id: "appendix-intro", title: "Apêndices" },
  { n: 14, id: "appendix-a", title: "Apêndice A · Diagnóstico" },
  { n: 15, id: "appendix-b", title: "Apêndice B · Sprint" },
  { n: 16, id: "appendix-c", title: "Apêndice C · Retainer" },
  { n: 17, id: "appendix-d", title: "Apêndice D · Investimento" },
  { n: 18, id: "appendix-e", title: "Apêndice E · Análise SINAL" },
  { n: 19, id: "thank-you", title: "Vamos a isto" },
];

export const TOTAL_SLIDES = SLIDE_META.length;

export function slideTitle(n: number | null | undefined): string {
  if (n == null) return "—";
  return SLIDE_META.find((s) => s.n === n)?.title ?? `Slide ${n}`;
}
