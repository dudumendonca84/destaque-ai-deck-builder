import type { SlideDef } from "../types";
import { Cover } from "./01_Cover";
import { Problem } from "./02_Problem";
import { Data } from "./03_Data";
import { LiveAudit } from "./04_LiveAudit";
import { SEOvsGEO } from "./05_SEOvsGEO";
import { Definition } from "./06_Definition";
import { Methodology } from "./07_Methodology";
import { Phases12 } from "./08_Phases12";
import { Phases34 } from "./09_Phases34";
import { KPIs } from "./10_KPIs";
import { Pricing } from "./11_Pricing";
import { NextSteps } from "./12_NextSteps";
import { AppendixIntro } from "./13_AppendixIntro";
import { AppendixA } from "./14_AppendixA";
import { AppendixB } from "./15_AppendixB";
import { AppendixC } from "./16_AppendixC";
import { AppendixD } from "./17_AppendixD";
import { AppendixE } from "./18_AppendixE";
import { Tracker } from "./19_Tracker";
import { CTA } from "./20_CTA";
import { ThankYou } from "./21_ThankYou";

// Registo dos 21 slides — ordem é a ordem de apresentação.
export const SLIDES: SlideDef[] = [
  { id: "cover", title: "Capa", tone: "paper", Component: Cover },
  { id: "problem", title: "O problema", tone: "ink", Component: Problem },
  { id: "data", title: "O contexto", tone: "paper", Component: Data },
  { id: "live-audit", title: "Auditoria personalizada", tone: "paper", Component: LiveAudit },
  { id: "seo-vs-geo", title: "SEO vs GEO", tone: "paper", Component: SEOvsGEO },
  { id: "definition", title: "O que é GEO", tone: "ink", Component: Definition },
  { id: "methodology", title: "Metodologia", tone: "paper", Component: Methodology },
  { id: "phases-1-2", title: "Fases 1 e 2", tone: "paper", Component: Phases12 },
  { id: "phases-3-4", title: "Fases 3 e 4", tone: "paper", Component: Phases34 },
  { id: "kpis", title: "Ponto de partida", tone: "paper", Component: KPIs },
  { id: "pricing", title: "Investimento", tone: "paper", Component: Pricing },
  { id: "next-steps", title: "Próximos passos", tone: "paper", Component: NextSteps },
  { id: "appendix-intro", title: "Apêndices", tone: "ink", Component: AppendixIntro },
  { id: "appendix-a", title: "Apêndice A · Diagnóstico", tone: "paper", Component: AppendixA },
  { id: "appendix-b", title: "Apêndice B · Sprint", tone: "paper", Component: AppendixB },
  { id: "appendix-c", title: "Apêndice C · Retainer", tone: "paper", Component: AppendixC },
  { id: "appendix-d", title: "Apêndice D · Investimento", tone: "paper", Component: AppendixD },
  { id: "appendix-e", title: "Apêndice E · Análise SINAL", tone: "paper", Component: AppendixE },
  { id: "tracker", title: "Visibility Tracker · preview", tone: "paper", Component: Tracker },
  { id: "cta", title: "Próxima acção", tone: "paper", Component: CTA },
  { id: "thank-you", title: "Vamos a isto", tone: "ink", Component: ThankYou },
];
