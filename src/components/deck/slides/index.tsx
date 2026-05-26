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
import { AppendixF1Analysis } from "./21a_AppendixF1_Analysis";
import { AppendixF2Findings } from "./21b_AppendixF2_Findings";
import { AppendixF3ActionH1 } from "./21c_AppendixF3_ActionH1";
import { AppendixFActionH2H3 } from "./21d_AppendixF_ActionH2H3";
import { AppendixFFAQ } from "./21e_AppendixF_FAQ";
import { Tracker } from "./19_Tracker";
import { ThankYou } from "./22_ThankYou";

// Registo dos slides — ordem é a ordem de apresentação.
//
// Cleanup 2026-05-26: removeu-se Pricing, NextSteps, AppendixIntro,
// AppendixA-D, AppendixE — todos slides template hardcoded (3 pontos
// genéricos por fase, "Sob consulta", durações fixas, etc.) que não
// adicionavam informação personalizada para o cliente. O conteúdo
// personalizado vive nos slides F1-F5 (output da Routine SINAL) e em
// LiveAudit/KPIs (dados reais do audit). Pricing/contacto agora subtil
// no ThankYou final.
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
  { id: "appendix-f1", title: "Análise editorial", tone: "paper", Component: AppendixF1Analysis },
  { id: "appendix-f2", title: "Findings críticos", tone: "paper", Component: AppendixF2Findings },
  { id: "appendix-f3", title: "Plano H1 · semana 1-2", tone: "paper", Component: AppendixF3ActionH1 },
  { id: "appendix-f4", title: "Plano H2 · H3 · contínuo", tone: "paper", Component: AppendixFActionH2H3 },
  { id: "appendix-f5", title: "Perguntas frequentes", tone: "paper", Component: AppendixFFAQ },
  { id: "tracker", title: "O que entregamos", tone: "paper", Component: Tracker },
  { id: "thank-you", title: "Vamos a isto", tone: "ink", Component: ThankYou },
];
