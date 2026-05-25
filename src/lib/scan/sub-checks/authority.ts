import type { Finding, SubCheck } from "../types";

/**
 * Authority dimension — Tier-1 PT media presence, podcast appearances,
 * conference speaking. Automatização limitada por agora; gera findings
 * "manual_verification" para o operador confirmar.
 *
 * Roadmap:
 * - Google News API (queries `"<brand>" site:observador.pt`, etc.) —
 *   requer paid API ou scraping cuidado
 * - Listen Notes API free tier para podcasts — ~10k calls/mês
 */

const PT_TIER_1 = [
  "observador.pt",
  "eco.pt",
  "publico.pt",
  "expresso.pt",
  "dinheirovivo.pt",
  "jornaldenegocios.pt",
];

export function makeAuthorityCheck(brandName: string): SubCheck {
  return async () => {
    const findings: Finding[] = [];

    findings.push({
      id: "authority.pt_tier1.manual",
      dimension: "authority",
      severity: "info",
      title: "Tier-1 PT media — verificação manual recomendada",
      why_it_matters:
        "Branded anchor text de Tier-1 PT (Observador, ECO, Público, Expresso, Dinheiro Vivo, Jornal de Negócios) correlaciona fortemente com AI Overview presence (r=0.527 — Ahrefs 75k brands). Sem cobertura, a marca fica invisível no canal de pesquisa que mais influencia decisões B2B.",
      suggestion: `Pesquisa manualmente "${brandName}" site:observador.pt + 5 outros tier-1. Se 0 menções nos últimos 12 meses → priorize digital PR campaign no plano de acção. Listar contactos editoriais por publicação.`,
      evidence: { tier1_domains: PT_TIER_1 },
    });

    findings.push({
      id: "authority.podcasts.manual",
      dimension: "authority",
      severity: "info",
      title: "Podcasts do segmento — pitch outreach",
      why_it_matters:
        "Podcasts B2B em PT (Pessoa Comum, Próxima Paragem, Bumba na Fofinha business episodes, Mensageiros) são frequentemente citados por LLMs em queries de research e validation. Aparecer como guest cria backlink autoritativo + transcript indexável.",
      suggestion:
        "Identifica 10 podcasts B2B/SaaS PT com >1k downloads/episódio. Drafta pitch personalizado por podcast. Target: 2-3 appearances por trimestre.",
    });

    findings.push({
      id: "authority.conferences.manual",
      dimension: "authority",
      severity: "info",
      title: "Conference speaking — calendário PT/EU",
      why_it_matters:
        "Speaking spots em conferências B2B (Web Summit, SaaStock, Surge Conference Lisbon, IDC events) geram citações em coverage da imprensa + LinkedIn posts dos atendentes + vídeo no YouTube/canal.",
      suggestion:
        "Submete propostas para 3-4 conferências relevantes no próximo 6 meses. Foco em talks técnicos (não pitch comercial) — LLMs distinguem.",
    });

    return findings;
  };
}
