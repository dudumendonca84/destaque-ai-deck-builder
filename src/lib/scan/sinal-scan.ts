import type { Finding, ScanResult } from "./types";
import { aggregate } from "./score";
import { schemaCheck } from "./sub-checks/schema";
import { aiSignalsCheck } from "./sub-checks/ai-signals";
import { sitemapCheck } from "./sub-checks/sitemap";
import { securityCheck } from "./sub-checks/security";
import { performanceCheck } from "./sub-checks/performance";
import { makeEntityCheck } from "./sub-checks/entity";
import { makeAuthorityCheck } from "./sub-checks/authority";

/**
 * SINAL scan — corre em paralelo com Step 10 (audit LLM).
 * Cobre 8 dimensões SINAL: technical, content, entity, authority,
 * ux, measurement, positioning, operational.
 *
 * Por agora implementadas: technical (schema, ai-signals, sitemap,
 * security, performance), entity (Wikidata, Wikipedia), authority
 * (manual verification stubs). Outras dimensões serão progressivamente
 * adicionadas e propagam-se via score weighting.
 *
 * Princípios:
 * - Crawler etiquette: User-Agent declarado, timeouts curtos, respeita
 *   robots.txt para sub-checks (TBD — implementação básica por agora)
 * - Cada sub-check falha graciosamente: se timeout ou erro, devolve
 *   finding com severity=unknown em vez de throw
 * - Resultados auto-agregam para score per dimensão + global
 */

const USER_AGENT = "destaque-ai-bot/1.0 (+https://destaque.ai/bot)";

function normalizeDomainUrl(rawDomain: string): { domain: string; url: string } {
  let url = rawDomain.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    return { domain: parsed.hostname, url: parsed.origin };
  } catch {
    return { domain: rawDomain, url };
  }
}

export async function runSinalScan(
  rawDomain: string,
  brandName: string,
): Promise<ScanResult> {
  const { domain, url } = normalizeDomainUrl(rawDomain);
  const fetchOptions = { userAgent: USER_AGENT };
  const input = { domain, url, fetchOptions };

  // Corre todos os sub-checks em paralelo. Cada um já falha graciosamente.
  const subChecks = [
    schemaCheck(input),
    aiSignalsCheck(input),
    sitemapCheck(input),
    securityCheck(input),
    performanceCheck(input),
    makeEntityCheck(brandName)(input),
    makeAuthorityCheck(brandName)(input),
  ];

  const results = await Promise.allSettled(subChecks);
  const findings: Finding[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") findings.push(...r.value);
  }

  return aggregate(domain, findings);
}
