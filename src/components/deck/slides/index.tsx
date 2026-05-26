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

// Estrutura narrativa em 4 atos:
//
//   ACT 1 — CONTEXTO          (engage: pesquisa mudou, números)
//   ACT 2 — A TUA MARCA HOJE  (audit + análise personalizada)
//   ACT 3 — COMO AJUDAMOS     (método + plano + deliverables)
//   ACT 4 — CLOSING           (contacto · sem pricing)
//
// Deck principal é DIAGNÓSTICO — entrega de valor sem valor comercial.
// Pricing vive em deck separado, enviado quando o prospect responde ao
// contacto. Mantém o foco editorial/sober deste deliverable.
export const SLIDES: SlideDef[] = [
  // ACT 1 — Contexto
  { id: "cover", title: "Capa", tone: "paper", Component: Cover },
  { id: "problem", title: "O problema", tone: "ink", Component: Problem },
  { id: "data", title: "O contexto", tone: "paper", Component: Data },
  { id: "seo-vs-geo", title: "SEO vs GEO", tone: "paper", Component: SEOvsGEO },
  { id: "definition", title: "O que é GEO", tone: "ink", Component: Definition },

  // ACT 2 — A tua marca hoje
  { id: "live-audit", title: "Auditoria personalizada", tone: "paper", Component: LiveAudit },
  { id: "kpis", title: "Ponto de partida", tone: "paper", Component: KPIs },
  { id: "appendix-f1", title: "Análise editorial", tone: "paper", Component: AppendixF1Analysis },
  { id: "appendix-f2", title: "Findings críticos", tone: "paper", Component: AppendixF2Findings },

  // ACT 3 — Como podemos ajudar
  { id: "methodology", title: "Metodologia", tone: "paper", Component: Methodology },
  { id: "phases-1-2", title: "Fases 1 e 2", tone: "paper", Component: Phases12 },
  { id: "phases-3-4", title: "Fases 3 e 4", tone: "paper", Component: Phases34 },
  { id: "appendix-f3", title: "Plano H1 · semana 1-2", tone: "paper", Component: AppendixF3ActionH1 },
  { id: "appendix-f4", title: "Plano H2 · H3 · contínuo", tone: "paper", Component: AppendixFActionH2H3 },
  { id: "appendix-f5", title: "Perguntas frequentes", tone: "paper", Component: AppendixFFAQ },
  { id: "tracker", title: "O que entregamos", tone: "paper", Component: Tracker },

  // ACT 4 — Closing
  { id: "thank-you", title: "Vamos a isto", tone: "ink", Component: ThankYou },
];
