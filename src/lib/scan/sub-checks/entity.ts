import type { Finding, SubCheck } from "../types";
import { fetchJson } from "./fetch-helpers";

/**
 * Entity dimension — Wikidata QID + Wikipedia presence.
 *
 * Esta é uma das dimensões SINAL mais sub-utilizadas pelo mercado. A
 * presença em Wikidata (knowledge graph) e Wikipedia é o substrato que
 * Google e LLMs usam para desambiguar entidades.
 */

type WikidataSearchResponse = {
  search?: Array<{ id?: string; label?: string; description?: string }>;
};

type WikipediaSummaryResponse = {
  title?: string;
  extract?: string;
  type?: string;
  description?: string;
};

async function searchWikidata(name: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&format=json&type=item&limit=1&origin=*&search=${encodeURIComponent(name)}`;
  const data = await fetchJson<WikidataSearchResponse>(url, "destaque-ai-bot/1.0");
  if (!data?.search || data.search.length === 0) return null;
  return data.search[0].id ?? null;
}

async function checkWikipedia(name: string, lang = "pt"): Promise<boolean> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
  const data = await fetchJson<WikipediaSummaryResponse>(url, "destaque-ai-bot/1.0");
  if (!data) return false;
  // Type "standard" = artigo real. "disambiguation" / "no-extract" = não conta.
  return data.type === "standard" && Boolean(data.extract);
}

export function makeEntityCheck(brandName: string): SubCheck {
  return async () => {
    const findings: Finding[] = [];

    if (!brandName || brandName.length < 2) {
      return findings;
    }

    // Wikidata
    const qid = await searchWikidata(brandName);
    if (!qid) {
      findings.push({
        id: "entity.wikidata.missing",
        dimension: "entity",
        severity: "critical",
        title: "Sem entry na Wikidata",
        why_it_matters:
          "Wikidata QID é a referência canónica da entidade para Google Knowledge Panel, AI Overviews e LLMs. Sem QID, a marca tem identidade frágil em todas as superfícies IA.",
        suggestion:
          "Cria QID na Wikidata.org: regista name, statement of `instance of` (Q4830453 organization), `country`, `inception`, `official website`. Fontes: LinkedIn, Crunchbase, imprensa.",
      });
    } else {
      findings.push({
        id: "entity.wikidata.present",
        dimension: "entity",
        severity: "ok",
        title: `Wikidata QID: ${qid}`,
        why_it_matters: "",
        suggestion: "Mantém a entry actualizada — `official website`, `logo`, `industry`.",
        evidence: { qid },
      });
    }

    // Wikipedia PT
    const wikipediaPT = await checkWikipedia(brandName, "pt");
    const wikipediaEN = await checkWikipedia(brandName, "en");

    if (!wikipediaPT && !wikipediaEN) {
      findings.push({
        id: "entity.wikipedia.missing",
        dimension: "entity",
        severity: "warning",
        title: "Sem artigo Wikipedia (PT/EN)",
        why_it_matters:
          "Wikipedia é uma das fontes mais citadas por ChatGPT (~14% do top citation share). Sem entry, perdes presença em queries de awareness.",
        suggestion:
          "Avalia notabilidade (Wikipedia:Notability/Organizations). Se atinge bar: drafta artigo em PT-PT, cita fontes Tier-1 PT (Observador, ECO, Público), submete via Articles for Creation. Não inflaciona — Wikipedia rejeita auto-promo.",
      });
    } else {
      findings.push({
        id: "entity.wikipedia.present",
        dimension: "entity",
        severity: "ok",
        title: `Wikipedia: ${[wikipediaPT && "PT", wikipediaEN && "EN"].filter(Boolean).join(", ")}`,
        why_it_matters: "",
        suggestion: "",
      });
    }

    return findings;
  };
}
