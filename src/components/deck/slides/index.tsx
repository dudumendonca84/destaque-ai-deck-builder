import type { SlideDef, SlideProps, DeckData } from "../types";
import { Cover } from "./01_Cover";
import { Problem } from "./02_Problem";
import { Villain, hasVillainData } from "./03a_Villain";
import { OurStudy } from "./03b_OurStudy";
import { Hope } from "./03c_Hope";
import { Data } from "./03_Data";
import { LiveAudit, liveAuditPageCount } from "./04_LiveAudit";
import { SEOvsGEO } from "./05_SEOvsGEO";
import { Definition } from "./06_Definition";
import { Methodology, methodologyPageCount } from "./07_Methodology";
import { Phases12 } from "./08_Phases12";
import { Phases34 } from "./09_Phases34";
import { KPIs } from "./10_KPIs";
import { CostOfInvisibility } from "./10b_CostOfInvisibility";
import { Pricing } from "./11_Pricing";
import { NextSteps } from "./12_NextSteps";
import { AppendixF1Analysis } from "./21a_AppendixF1_Analysis";
import { AppendixF2Findings, findingsPageCount } from "./21b_AppendixF2_Findings";
import { AppendixFLandscape, landscapePageCount } from "./21y_AppendixF_Landscape";
import { AppendixFPotential } from "./21x_AppendixF_Potential";
import { AppendixFActionHorizon, actionsPageCount, type Horizon } from "./21f_AppendixF_ActionHorizon";
import { AppendixFFAQ, faqPageCount } from "./21e_AppendixF_FAQ";
import { AppendixAPrompts, appendixAPromptsPageCount } from "./15a_AppendixA_Prompts";
import { allAuditedPrompts } from "./04_LiveAudit";
import { Tracker, trackerPageCount } from "./19_Tracker";
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
 * Monta a sequência de slides para um deck concreto. Cinco actos:
 *
 *   ACT 1 — ABERTURA E TENSÃO     (problema → vilão → destino)
 *   ACT 2 — DIAGNÓSTICO COMPLETO  (prova → audit → landscape → KPIs →
 *                                  custo → análise → findings → contexto)
 *   ACT 3 — COMO SE RESOLVE       (SEO vs GEO → definição → SINAL)
 *   ACT 4 — O PLANO               (fases → horizontes → potencial)
 *   ACT 5 — ENTREGA E FECHO       (tracker → preço → next steps →
 *                                  apêndices → close)
 *
 * Slides personalizados (F-slides) e o Villain dinâmico só entram quando
 * há dados para os alimentar. Slides com muito conteúdo são paginados,
 * nunca cortados.
 */
export function buildSlides(deck: DeckData): SlideDef[] {
  const synth = deck.synthesized;
  const out: SlideDef[] = [];

  // ACT 1 — ABERTURA E TENSÃO
  out.push(
    { id: "cover", title: "Capa", tone: "paper", Component: Cover },
    { id: "problem", title: "O problema", tone: "ink", Component: Problem },
  );
  if (hasVillainData(deck)) {
    out.push({ id: "villain", title: "Quem aparece", tone: "paper", Component: Villain });
  }
  out.push({ id: "hope", title: "O destino", tone: "ink", Component: Hope });

  // ACT 2 — DIAGNÓSTICO COMPLETO
  out.push(
    { id: "our-study", title: "A prova", tone: "paper", Component: OurStudy },
    ...paginated("live-audit", "E sobre ti?", "paper", LiveAudit, liveAuditPageCount(deck)),
  );
  out.push(
    ...paginated(
      "appendix-landscape",
      "Landscape competitivo",
      "paper",
      AppendixFLandscape,
      landscapePageCount(deck),
    ),
  );
  out.push(
    { id: "kpis", title: "Ponto de partida", tone: "paper", Component: KPIs },
    { id: "cost-invisibility", title: "Custo da invisibilidade", tone: "ink", Component: CostOfInvisibility },
  );
  if (synth) {
    if (synth.executive_reading_md || synth.executive_reading) {
      out.push({
        id: "appendix-f1",
        title: "Análise editorial",
        tone: "paper",
        Component: AppendixF1Analysis,
      });
    }
    out.push(
      ...paginated("appendix-f2", "Findings críticos", "paper", AppendixF2Findings, findingsPageCount(deck)),
    );
  }
  out.push({ id: "data", title: "O contexto", tone: "paper", Component: Data });

  // ACT 3 — COMO SE RESOLVE
  out.push(
    { id: "seo-vs-geo", title: "SEO vs GEO", tone: "paper", Component: SEOvsGEO },
    { id: "definition", title: "O que é GEO", tone: "ink", Component: Definition },
    ...paginated("methodology", "Metodologia", "paper", Methodology, methodologyPageCount(deck)),
  );

  // ACT 4 — O PLANO
  out.push(
    { id: "phases-1-2", title: "Fases 1 e 2", tone: "paper", Component: Phases12 },
    { id: "phases-3-4", title: "Fases 3 e 4", tone: "paper", Component: Phases34 },
  );
  if (synth) {
    const horizons: Array<{ key: Horizon; title: string }> = [
      { key: "h1", title: "Plano H1" },
      { key: "h2", title: "Plano H2" },
      { key: "h3", title: "Plano H3" },
      { key: "ongoing", title: "Plano contínuo" },
    ];
    for (const h of horizons) {
      const pageCount = actionsPageCount(deck, h.key);
      if (pageCount > 0) {
        const Base = (props: SlideProps) => <AppendixFActionHorizon {...props} horizon={h.key} />;
        out.push(...paginated(`appendix-action-${h.key}`, h.title, "paper", Base, pageCount));
      }
    }
    if (synth.projection_6m) {
      out.push({
        id: "appendix-potential",
        title: "Potencial · 6 meses",
        tone: "paper",
        Component: AppendixFPotential,
      });
    }
  }

  // ACT 5 — ENTREGA E FECHO
  out.push(
    ...paginated("tracker", "O que entregamos", "paper", Tracker, trackerPageCount(deck)),
    { id: "pricing", title: "Investimento", tone: "paper", Component: Pricing },
    { id: "next-steps", title: "A seguir", tone: "paper", Component: NextSteps },
  );
  if (allAuditedPrompts(deck).length > 0) {
    out.push(
      ...paginated(
        "appendix-a-prompts",
        "Apêndice A · prompts",
        "paper",
        AppendixAPrompts,
        appendixAPromptsPageCount(deck),
      ),
    );
  }
  if (synth) {
    out.push(
      ...paginated("appendix-faq", "Perguntas frequentes", "paper", AppendixFFAQ, faqPageCount(deck)),
    );
  }
  out.push({ id: "thank-you", title: "Vamos a isto", tone: "ink", Component: ThankYou });

  return out;
}

/**
 * Lista estática (page-agnostic) — usada por consumidores de metadata
 * que só precisam dos ids/títulos base, não da paginação nem das
 * condicionais. Ordem espelha o arco em 5 actos do `buildSlides`.
 */
export const SLIDES: SlideDef[] = [
  // ACT 1
  { id: "cover", title: "Capa", tone: "paper", Component: Cover },
  { id: "problem", title: "O problema", tone: "ink", Component: Problem },
  { id: "villain", title: "Quem aparece", tone: "paper", Component: Villain },
  { id: "hope", title: "O destino", tone: "ink", Component: Hope },
  // ACT 2
  { id: "our-study", title: "A prova", tone: "paper", Component: OurStudy },
  { id: "live-audit", title: "E sobre ti?", tone: "paper", Component: LiveAudit },
  { id: "appendix-landscape", title: "Landscape competitivo", tone: "paper", Component: AppendixFLandscape },
  { id: "kpis", title: "Ponto de partida", tone: "paper", Component: KPIs },
  { id: "cost-invisibility", title: "Custo da invisibilidade", tone: "ink", Component: CostOfInvisibility },
  { id: "appendix-f1", title: "Análise editorial", tone: "paper", Component: AppendixF1Analysis },
  { id: "appendix-f2", title: "Findings críticos", tone: "paper", Component: AppendixF2Findings },
  { id: "data", title: "O contexto", tone: "paper", Component: Data },
  // ACT 3
  { id: "seo-vs-geo", title: "SEO vs GEO", tone: "paper", Component: SEOvsGEO },
  { id: "definition", title: "O que é GEO", tone: "ink", Component: Definition },
  { id: "methodology", title: "Metodologia", tone: "paper", Component: Methodology },
  // ACT 4
  { id: "phases-1-2", title: "Fases 1 e 2", tone: "paper", Component: Phases12 },
  { id: "phases-3-4", title: "Fases 3 e 4", tone: "paper", Component: Phases34 },
  { id: "appendix-action-h1", title: "Plano H1", tone: "paper", Component: AppendixFActionHorizon },
  { id: "appendix-potential", title: "Potencial · 6 meses", tone: "paper", Component: AppendixFPotential },
  // ACT 5
  { id: "tracker", title: "O que entregamos", tone: "paper", Component: Tracker },
  { id: "pricing", title: "Investimento", tone: "paper", Component: Pricing },
  { id: "next-steps", title: "A seguir", tone: "paper", Component: NextSteps },
  { id: "appendix-faq", title: "Perguntas frequentes", tone: "paper", Component: AppendixFFAQ },
  { id: "thank-you", title: "Vamos a isto", tone: "ink", Component: ThankYou },
];
