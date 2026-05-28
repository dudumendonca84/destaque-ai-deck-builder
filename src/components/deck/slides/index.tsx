import type { SlideDef, SlideProps, DeckData } from "../types";
import { Cover } from "./01_Cover";
import { Problem } from "./02_Problem";
import { Data } from "./03_Data";
import { LiveAudit, liveAuditPageCount } from "./04_LiveAudit";
import { SEOvsGEO } from "./05_SEOvsGEO";
import { Definition } from "./06_Definition";
import { Methodology } from "./07_Methodology";
import { Phases12 } from "./08_Phases12";
import { Phases34 } from "./09_Phases34";
import { KPIs } from "./10_KPIs";
import { CostOfInvisibility } from "./10b_CostOfInvisibility";
import { AppendixF1Analysis } from "./21a_AppendixF1_Analysis";
import { AppendixF2Findings, findingsPageCount } from "./21b_AppendixF2_Findings";
import { AppendixFLandscape } from "./21y_AppendixF_Landscape";
import { AppendixFPotential } from "./21x_AppendixF_Potential";
import { AppendixFActionHorizon, actionsFor, type Horizon } from "./21f_AppendixF_ActionHorizon";
import { AppendixFFAQ, faqPageCount } from "./21e_AppendixF_FAQ";
import { AppendixAPrompts } from "./15a_AppendixA_Prompts";
import { allAuditedPrompts } from "./04_LiveAudit";
import { Tracker } from "./19_Tracker";
import { ThankYou } from "./22_ThankYou";

/**
 * Helper de paginação: emite N SlideDefs do mesmo componente base, cada
 * um com `page`/`pageCount` injectados por closure. Garante que conteúdo
 * que não cabe num slide é dividido em vários — nunca cortado, nunca scroll.
 */
function paginated(
  baseId: string,
  title: string,
  tone: "paper" | "ink",
  Base: React.ComponentType<SlideProps>,
  pages: number,
): SlideDef[] {
  if (pages <= 0) return [];
  return Array.from({ length: pages }, (_, p) => ({
    id: pages > 1 ? `${baseId}-${p + 1}` : baseId,
    title: pages > 1 ? `${title} ${p + 1}/${pages}` : title,
    tone,
    Component: (props: SlideProps) => <Base {...props} page={p} pageCount={pages} />,
  }));
}

/**
 * Monta a sequência de slides para um deck concreto. Estrutura narrativa
 * em 4 atos. Slides personalizados (F*) só entram quando há dados — slides
 * vazios são saltados. Slides com muito conteúdo (LiveAudit, Findings) são
 * paginados em vez de cortados.
 *
 *   ACT 1 — CONTEXTO          (pesquisa mudou, números, definição)
 *   ACT 2 — A TUA MARCA HOJE  (audit + análise + landscape + potencial)
 *   ACT 3 — COMO AJUDAMOS     (método + plano + deliverables)
 *   ACT 4 — CLOSING           (contacto · sem pricing)
 */
export function buildSlides(deck: DeckData): SlideDef[] {
  const synth = deck.synthesized;
  const out: SlideDef[] = [];

  // ACT 1 — Contexto
  out.push(
    { id: "cover", title: "Capa", tone: "paper", Component: Cover },
    { id: "problem", title: "O problema", tone: "ink", Component: Problem },
    { id: "data", title: "O contexto", tone: "paper", Component: Data },
    { id: "seo-vs-geo", title: "SEO vs GEO", tone: "paper", Component: SEOvsGEO },
    { id: "definition", title: "O que é GEO", tone: "ink", Component: Definition },
  );

  // ACT 2 — A tua marca hoje
  out.push(
    ...paginated("live-audit", "Auditoria personalizada", "paper", LiveAudit, liveAuditPageCount(deck)),
    { id: "kpis", title: "Ponto de partida", tone: "paper", Component: KPIs },
    { id: "cost-invisibility", title: "O custo da invisibilidade", tone: "ink", Component: CostOfInvisibility },
  );
  if (synth) {
    if (synth.executive_reading_md || synth.executive_reading) {
      out.push({ id: "appendix-f1", title: "Análise editorial", tone: "paper", Component: AppendixF1Analysis });
    }
    out.push(
      ...paginated("appendix-f2", "Findings críticos", "paper", AppendixF2Findings, findingsPageCount(deck)),
    );
    if ((synth.competitor_profiles?.length ?? 0) > 0) {
      out.push({ id: "appendix-landscape", title: "Landscape competitivo", tone: "paper", Component: AppendixFLandscape });
    }
    if (synth.projection_6m) {
      out.push({ id: "appendix-potential", title: "Potencial · 6 meses", tone: "paper", Component: AppendixFPotential });
    }
  }

  // ACT 3 — Como podemos ajudar
  out.push(
    { id: "methodology", title: "Metodologia", tone: "paper", Component: Methodology },
    { id: "phases-1-2", title: "Fases 1 e 2", tone: "paper", Component: Phases12 },
    { id: "phases-3-4", title: "Fases 3 e 4", tone: "paper", Component: Phases34 },
  );
  if (synth) {
    // Um slide por horizonte com acções (1 horizonte/página, sem espremer).
    const horizons: Array<{ key: Horizon; title: string }> = [
      { key: "h1", title: "Plano H1 · semana 1-2" },
      { key: "h2", title: "Plano H2 · semana 3-8" },
      { key: "h3", title: "Plano H3 · mês 2-6" },
      { key: "ongoing", title: "Plano · contínuo" },
    ];
    for (const h of horizons) {
      if (actionsFor(deck, h.key).length > 0) {
        out.push({
          id: `appendix-action-${h.key}`,
          title: h.title,
          tone: "paper",
          Component: (props: SlideProps) => <AppendixFActionHorizon {...props} horizon={h.key} />,
        });
      }
    }
    out.push(
      ...paginated("appendix-faq", "Perguntas frequentes", "paper", AppendixFFAQ, faqPageCount(deck)),
    );
  }
  out.push({ id: "tracker", title: "O que entregamos", tone: "paper", Component: Tracker });
  // Apêndice A — prompts auditados completos (movidos do slide 04 invertido).
  if (allAuditedPrompts(deck).length > 0) {
    out.push({ id: "appendix-a-prompts", title: "Apêndice A · prompts", tone: "paper", Component: AppendixAPrompts });
  }

  // ACT 4 — Closing
  out.push({ id: "thank-you", title: "Vamos a isto", tone: "ink", Component: ThankYou });

  return out;
}

/**
 * Lista estática (page-agnostic) — usada por consumidores de metadata
 * (PDF, analytics) que só precisam dos ids/títulos base, não da paginação.
 * O runtime de render usa `buildSlides(deck)`.
 */
export const SLIDES: SlideDef[] = [
  { id: "cover", title: "Capa", tone: "paper", Component: Cover },
  { id: "problem", title: "O problema", tone: "ink", Component: Problem },
  { id: "data", title: "O contexto", tone: "paper", Component: Data },
  { id: "seo-vs-geo", title: "SEO vs GEO", tone: "paper", Component: SEOvsGEO },
  { id: "definition", title: "O que é GEO", tone: "ink", Component: Definition },
  { id: "live-audit", title: "Auditoria personalizada", tone: "paper", Component: LiveAudit },
  { id: "kpis", title: "Ponto de partida", tone: "paper", Component: KPIs },
  { id: "appendix-f1", title: "Análise editorial", tone: "paper", Component: AppendixF1Analysis },
  { id: "appendix-f2", title: "Findings críticos", tone: "paper", Component: AppendixF2Findings },
  { id: "appendix-landscape", title: "Landscape competitivo", tone: "paper", Component: AppendixFLandscape },
  { id: "appendix-potential", title: "Potencial · 6 meses", tone: "paper", Component: AppendixFPotential },
  { id: "methodology", title: "Metodologia", tone: "paper", Component: Methodology },
  { id: "phases-1-2", title: "Fases 1 e 2", tone: "paper", Component: Phases12 },
  { id: "phases-3-4", title: "Fases 3 e 4", tone: "paper", Component: Phases34 },
  { id: "appendix-action-h1", title: "Plano H1 · semana 1-2", tone: "paper", Component: AppendixFActionHorizon },
  { id: "appendix-f5", title: "Perguntas frequentes", tone: "paper", Component: AppendixFFAQ },
  { id: "tracker", title: "O que entregamos", tone: "paper", Component: Tracker },
  { id: "thank-you", title: "Vamos a isto", tone: "ink", Component: ThankYou },
];
