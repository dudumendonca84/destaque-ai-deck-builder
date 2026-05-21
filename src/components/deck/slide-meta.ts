// Metadados dos 18 slides — sem "use client", utilizável em Server Components
// (ex.: dashboard de analytics) e na geração de PowerPoint.

export type SlideMeta = { n: number; id: string; title: string };

export const SLIDE_META: SlideMeta[] = [
  { n: 1, id: "cover", title: "Capa" },
  { n: 2, id: "problem", title: "O problema" },
  { n: 3, id: "audit-intro", title: "Método" },
  { n: 4, id: "live-audit", title: "Auditoria ao vivo" },
  { n: 5, id: "by-engine", title: "Resultados por motor" },
  { n: 6, id: "share-of-voice", title: "Share of voice" },
  { n: 7, id: "competitors", title: "Concorrentes" },
  { n: 8, id: "diagnosis", title: "Diagnóstico" },
  { n: 9, id: "geo", title: "O que é GEO" },
  { n: 10, id: "method", title: "Metodologia" },
  { n: 11, id: "phase-1", title: "Fase 1 · Diagnóstico" },
  { n: 12, id: "phase-2", title: "Fase 2 · Sprint" },
  { n: 13, id: "phase-3", title: "Fase 3 · Retainer" },
  { n: 14, id: "timeline", title: "Timeline" },
  { n: 15, id: "pricing", title: "Pricing" },
  { n: 16, id: "why-us", title: "Porquê destaque.ai" },
  { n: 17, id: "next-steps", title: "Próximos passos" },
  { n: 18, id: "cta", title: "Agendar" },
];

export const TOTAL_SLIDES = SLIDE_META.length;

export function slideTitle(n: number | null | undefined): string {
  if (n == null) return "—";
  return SLIDE_META.find((s) => s.n === n)?.title ?? `Slide ${n}`;
}
