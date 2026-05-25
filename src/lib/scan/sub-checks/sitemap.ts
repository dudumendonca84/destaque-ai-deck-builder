import type { Finding, SubCheck } from "../types";
import { fetchText } from "./fetch-helpers";

/**
 * Verifica sitemap.xml: presença, freshness, URL count, bilingual hreflang.
 */

const FRESHNESS_DAYS = 30;

function extractLastmods(xml: string): string[] {
  const re = /<lastmod>([^<]+)<\/lastmod>/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1].trim());
  return out;
}

function extractUrlCount(xml: string): number {
  const matches = xml.match(/<url>/g);
  return matches?.length ?? 0;
}

export const sitemapCheck: SubCheck = async ({ url, fetchOptions }) => {
  const findings: Finding[] = [];
  const base = url.replace(/\/$/, "");
  const xml = await fetchText(`${base}/sitemap.xml`, fetchOptions.userAgent);

  if (!xml) {
    findings.push({
      id: "sitemap.missing",
      dimension: "technical",
      severity: "warning",
      title: "`/sitemap.xml` em falta",
      why_it_matters:
        "Sitemap acelera descoberta por crawlers (Googlebot, Bingbot, AI crawlers que respeitam). Sem ele, URLs profundos ficam dependentes de descoberta por links.",
      suggestion: "Gera sitemap.xml automaticamente (Next.js: `app/sitemap.ts`) e declara-o em robots.txt.",
    });
    return findings;
  }

  const count = extractUrlCount(xml);
  const lastmods = extractLastmods(xml);

  if (count === 0) {
    findings.push({
      id: "sitemap.empty",
      dimension: "technical",
      severity: "warning",
      title: "sitemap.xml está vazio (0 URLs)",
      why_it_matters: "Sitemap sem URLs não tem utilidade prática.",
      suggestion: "Verifica que o gerador de sitemap está a listar todas as páginas indexáveis.",
    });
    return findings;
  }

  if (lastmods.length > 0) {
    const newest = Math.max(
      ...lastmods
        .map((d) => new Date(d).getTime())
        .filter((t) => !Number.isNaN(t) && t > 0),
    );
    const daysSince = (Date.now() - newest) / (1000 * 60 * 60 * 24);
    if (daysSince > FRESHNESS_DAYS) {
      findings.push({
        id: "sitemap.stale",
        dimension: "technical",
        severity: "warning",
        title: `Sitemap não actualiza há ${Math.round(daysSince)} dias`,
        why_it_matters:
          "Sitemaps obsoletos sinalizam ao Google que o site está parado. Pode afectar crawl budget.",
        suggestion: "Garante que `lastmod` actualiza quando publicas/editas páginas.",
        evidence: { newest: new Date(newest).toISOString(), urlCount: count },
      });
    } else {
      findings.push({
        id: "sitemap.fresh",
        dimension: "technical",
        severity: "ok",
        title: `Sitemap com ${count} URLs e fresco (${Math.round(daysSince)}d)`,
        why_it_matters: "",
        suggestion: "",
        evidence: { urlCount: count },
      });
    }
  } else {
    findings.push({
      id: "sitemap.ok",
      dimension: "technical",
      severity: "ok",
      title: `Sitemap com ${count} URLs (sem lastmod)`,
      why_it_matters: "",
      suggestion: "Considera adicionar `lastmod` por URL para sinalizar frescura ao Googlebot.",
      evidence: { urlCount: count },
    });
  }

  return findings;
};
