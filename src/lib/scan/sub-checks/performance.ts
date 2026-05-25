import type { Finding, SubCheck } from "../types";
import { fetchJson } from "./fetch-helpers";

/**
 * Core Web Vitals via PageSpeed Insights API. Funciona sem key para
 * volume baixo; com key (GOOGLE_PAGESPEED_API_KEY) sobe quota até 25k/dia.
 *
 * Métricas relevantes: LCP, INP, CLS, performance score.
 */

type PageSpeedResponse = {
  lighthouseResult?: {
    categories?: { performance?: { score?: number } };
    audits?: Record<string, { numericValue?: number; displayValue?: string }>;
  };
  loadingExperience?: {
    metrics?: Record<string, { percentile?: number; category?: string }>;
  };
};

function thresholdLcp(ms: number): "ok" | "warning" | "critical" {
  if (ms <= 2500) return "ok";
  if (ms <= 4000) return "warning";
  return "critical";
}

function thresholdInp(ms: number): "ok" | "warning" | "critical" {
  if (ms <= 200) return "ok";
  if (ms <= 500) return "warning";
  return "critical";
}

function thresholdCls(value: number): "ok" | "warning" | "critical" {
  if (value <= 0.1) return "ok";
  if (value <= 0.25) return "warning";
  return "critical";
}

export const performanceCheck: SubCheck = async ({ url }) => {
  const findings: Finding[] = [];
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  const params = new URLSearchParams({
    url,
    strategy: "mobile",
    category: "performance",
  });
  if (apiKey) params.set("key", apiKey);

  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`;
  const data = await fetchJson<PageSpeedResponse>(apiUrl, "destaque-ai-bot/1.0");

  if (!data) {
    findings.push({
      id: "performance.unavailable",
      dimension: "technical",
      severity: "unknown",
      title: "PageSpeed Insights indisponível",
      why_it_matters:
        "Não foi possível obter Core Web Vitals automaticamente. Pode ser rate limit ou domínio bloqueado.",
      suggestion: "Verifica manualmente em pagespeed.web.dev e considera adicionar GOOGLE_PAGESPEED_API_KEY no Vercel.",
    });
    return findings;
  }

  const score = data.lighthouseResult?.categories?.performance?.score;
  const audits = data.lighthouseResult?.audits ?? {};

  const lcp = audits["largest-contentful-paint"]?.numericValue;
  const inp = audits["interaction-to-next-paint"]?.numericValue ?? audits["interactive"]?.numericValue;
  const cls = audits["cumulative-layout-shift"]?.numericValue;

  if (typeof score === "number") {
    const pct = Math.round(score * 100);
    findings.push({
      id: "performance.score",
      dimension: "technical",
      severity: pct >= 90 ? "ok" : pct >= 50 ? "warning" : "critical",
      title: `Lighthouse Performance ${pct}/100 (mobile)`,
      why_it_matters: pct < 90 ? "Pages com score < 90 perdem em Core Web Vitals e podem ser penalisadas em ranking." : "",
      suggestion: pct < 90 ? "Optimiza LCP (image sizing, server response), reduz JS, defere scripts não críticos." : "",
      evidence: { score: pct },
    });
  }

  if (typeof lcp === "number") {
    const t = thresholdLcp(lcp);
    findings.push({
      id: "performance.lcp",
      dimension: "technical",
      severity: t,
      title: `LCP ${Math.round(lcp)}ms`,
      why_it_matters: t !== "ok" ? "LCP > 2.5s impacta INP, ranking e bounce. Threshold Google: 2.5s good." : "",
      suggestion: t !== "ok" ? "Pré-carrega o hero image, reduz blocking resources, considera CDN PT-side." : "",
      evidence: { lcp_ms: Math.round(lcp) },
    });
  }

  if (typeof inp === "number") {
    const t = thresholdInp(inp);
    findings.push({
      id: "performance.inp",
      dimension: "technical",
      severity: t,
      title: `INP ${Math.round(inp)}ms`,
      why_it_matters: t !== "ok" ? "INP > 200ms causa jank perceptível e degrada UX score." : "",
      suggestion: t !== "ok" ? "Reduz JS execution time, evita long tasks, defer GTM/analytics." : "",
      evidence: { inp_ms: Math.round(inp) },
    });
  }

  if (typeof cls === "number") {
    const t = thresholdCls(cls);
    findings.push({
      id: "performance.cls",
      dimension: "technical",
      severity: t,
      title: `CLS ${cls.toFixed(3)}`,
      why_it_matters: t !== "ok" ? "Layout shift acima de 0.1 incomoda leitura e prejudica conversion." : "",
      suggestion: t !== "ok" ? "Reserva espaço para imagens/iframes (width/height), evita injecção de DOM depois de render." : "",
      evidence: { cls },
    });
  }

  return findings;
};
