import type { Finding, SubCheck } from "../types";
import { fetchText } from "./fetch-helpers";

/**
 * Verifica JSON-LD schema na home: presença, types relevantes, sameAs
 * depth. Dimension: technical (presença/sintaxe) + entity (sameAs depth).
 *
 * Princípio SINAL: presença não é tudo. Schema vazio ou só `WebSite` não
 * conta. O que conta é `Organization` rico com sameAs apontando para
 * Wikidata/LinkedIn/etc.
 */

type JsonLd = Record<string, unknown> & { "@type"?: string | string[] };

function extractJsonLd(html: string): JsonLd[] {
  const out: JsonLd[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === "object") out.push(item as JsonLd);
        }
      } else if (parsed && typeof parsed === "object") {
        if ("@graph" in parsed && Array.isArray(parsed["@graph"])) {
          for (const item of parsed["@graph"]) {
            if (item && typeof item === "object") out.push(item as JsonLd);
          }
        }
        out.push(parsed as JsonLd);
      }
    } catch {
      // schema malformado — ignora
    }
  }
  return out;
}

function hasType(item: JsonLd, type: string): boolean {
  const t = item["@type"];
  if (!t) return false;
  if (Array.isArray(t)) return t.includes(type);
  return t === type;
}

export const schemaCheck: SubCheck = async ({ domain, url, fetchOptions }) => {
  const findings: Finding[] = [];
  const html = await fetchText(url, fetchOptions.userAgent);

  if (!html) {
    findings.push({
      id: "schema.fetch.failed",
      dimension: "technical",
      severity: "unknown",
      title: "Não foi possível obter HTML da home",
      why_it_matters:
        "Sem acesso ao HTML não é possível avaliar Schema.org. Verifica acessibilidade do domínio e robots.txt.",
      suggestion: "Confirma que o site responde a GET / com HTML.",
      evidence: { domain, url },
    });
    return findings;
  }

  const ldItems = extractJsonLd(html);

  if (ldItems.length === 0) {
    findings.push({
      id: "schema.missing",
      dimension: "technical",
      severity: "critical",
      title: "Sem JSON-LD na home",
      why_it_matters:
        "Schema.org é um dos sinais primários que LLMs e AI Overviews usam para identificar a entidade. Sem JSON-LD, a IA depende de heurística pobre.",
      suggestion:
        "Adiciona JSON-LD `Organization` com `name`, `url`, `logo`, `sameAs` (LinkedIn, GitHub, X, Crunchbase, Wikidata).",
    });
    return findings;
  }

  const hasOrg = ldItems.some((i) => hasType(i, "Organization"));
  if (!hasOrg) {
    findings.push({
      id: "schema.organization.missing",
      dimension: "entity",
      severity: "critical",
      title: "JSON-LD presente mas sem `Organization`",
      why_it_matters:
        "A entidade da marca não está declarada. AI Overviews precisam de `Organization` para disambiguar entre brands com nomes parecidos.",
      suggestion:
        "Adiciona um bloco JSON-LD `Organization` na home com `name`, `url`, `logo`, `sameAs`, `address`, `contactPoint`.",
    });
  } else {
    const org = ldItems.find((i) => hasType(i, "Organization"));
    const sameAs = org && Array.isArray(org["sameAs"]) ? (org["sameAs"] as string[]) : [];
    if (sameAs.length === 0) {
      findings.push({
        id: "schema.organization.sameAs.empty",
        dimension: "entity",
        severity: "critical",
        title: "`Organization.sameAs` vazio",
        why_it_matters:
          "`sameAs` corrobora a identidade da marca ligando-a a fontes externas (LinkedIn, GitHub, Wikidata, Crunchbase). Sem isto a IA não consegue verificar.",
        suggestion:
          "Adiciona pelo menos 3 URLs em `sameAs`: perfil LinkedIn da empresa, GitHub org (se aplicável), X/Twitter, Crunchbase, Wikidata.",
      });
    } else if (sameAs.length < 3) {
      findings.push({
        id: "schema.organization.sameAs.thin",
        dimension: "entity",
        severity: "warning",
        title: `Apenas ${sameAs.length} sameAs`,
        why_it_matters:
          "Recomenda-se ≥3 entradas em `sameAs` para corroboração forte da entidade.",
        suggestion:
          "Adiciona mais URLs: LinkedIn, Wikidata, Crunchbase, perfis de fundadores, GitHub.",
        evidence: { sameAs },
      });
    } else {
      findings.push({
        id: "schema.organization.sameAs.ok",
        dimension: "entity",
        severity: "ok",
        title: `${sameAs.length} sameAs declarados`,
        why_it_matters: "",
        suggestion: "",
        evidence: { sameAs },
      });
    }

    const hasLogo = org && typeof org["logo"] === "string";
    if (!hasLogo) {
      findings.push({
        id: "schema.organization.logo.missing",
        dimension: "entity",
        severity: "warning",
        title: "`Organization.logo` em falta",
        why_it_matters:
          "Logo é o sinal visual primário para Knowledge Panel e citation cards das AI Overviews.",
        suggestion: "Adiciona `logo` (URL absoluto) ao bloco Organization.",
      });
    }
  }

  return findings;
};
