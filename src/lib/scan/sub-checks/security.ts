import type { Finding, SubCheck } from "../types";
import { safeFetch } from "./fetch-helpers";

/**
 * Security/compression headers — sinais técnicos básicos. Cobre HSTS,
 * X-Content-Type-Options, Content-Encoding (Brotli/gzip).
 */

const REQUIRED_SECURITY_HEADERS = [
  "strict-transport-security",
  "x-content-type-options",
];

export const securityCheck: SubCheck = async ({ url, fetchOptions }) => {
  const findings: Finding[] = [];
  const res = await safeFetch(url, {
    method: "GET",
    userAgent: fetchOptions.userAgent,
    headers: { "accept-encoding": "br, gzip" },
  });

  if (!res) {
    findings.push({
      id: "security.fetch.failed",
      dimension: "technical",
      severity: "unknown",
      title: "Não foi possível verificar headers de segurança",
      why_it_matters: "Timeout ou domínio inacessível.",
      suggestion: "",
    });
    return findings;
  }

  const headers = res.headers;
  const missing: string[] = [];
  for (const h of REQUIRED_SECURITY_HEADERS) {
    if (!headers.has(h)) missing.push(h);
  }

  if (missing.length > 0) {
    findings.push({
      id: "security.headers.missing",
      dimension: "technical",
      severity: "warning",
      title: `Headers de segurança em falta: ${missing.join(", ")}`,
      why_it_matters:
        "HSTS protege contra downgrade HTTP→HTTPS. X-Content-Type-Options evita MIME sniffing. Search Quality Rater Guidelines listam estes como sinais de site bem mantido.",
      suggestion:
        "Adiciona via Cloudflare Transform Rules ou Vercel headers (next.config.ts): `Strict-Transport-Security: max-age=31536000; includeSubDomains` e `X-Content-Type-Options: nosniff`.",
      evidence: { missing },
    });
  } else {
    findings.push({
      id: "security.headers.ok",
      dimension: "technical",
      severity: "ok",
      title: "Headers de segurança básicos presentes",
      why_it_matters: "",
      suggestion: "",
    });
  }

  const encoding = headers.get("content-encoding");
  if (!encoding) {
    findings.push({
      id: "security.compression.missing",
      dimension: "technical",
      severity: "warning",
      title: "Sem `Content-Encoding` (sem Brotli/gzip)",
      why_it_matters:
        "Compressão reduz HTML payload em 60-80%. Sem ela, TTFB efectivo sobe e Core Web Vitals degradam.",
      suggestion: "Activa Brotli na CDN/origem (Cloudflare/Vercel fazem por defeito).",
    });
  } else {
    findings.push({
      id: "security.compression.ok",
      dimension: "technical",
      severity: "ok",
      title: `Compressão activa (${encoding})`,
      why_it_matters: "",
      suggestion: "",
    });
  }

  return findings;
};
