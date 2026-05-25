import type { Finding, SubCheck } from "../types";
import { fetchText, safeFetch } from "./fetch-helpers";

/**
 * Verifica AI-ready signals: /llms.txt, /llms-full.txt, robots.txt
 * permissions para os principais AI crawlers.
 *
 * SINAL caveat: llms.txt tem near-zero uptake em log studies (Otterly
 * Nov 2025). Recomenda-se publicar para hygiene mas não promete impacto
 * em inference. Robots.txt para AI crawlers é o que importa.
 */

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "Meta-ExternalAgent",
];

function isCrawlerBlocked(robots: string, crawler: string): boolean {
  // Crude parse — match `User-agent: <crawler>` seguido de `Disallow: /`
  // antes da próxima User-agent. Não exhaustivo mas apanha o padrão comum.
  const lines = robots.split("\n").map((l) => l.trim());
  let inBlock = false;
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith("user-agent:")) {
      const agent = line.slice(line.indexOf(":") + 1).trim();
      inBlock = agent === crawler || agent === "*";
      // Se mudou para outro user-agent, sai do bloco do crawler
      if (agent !== crawler && agent !== "*") {
        inBlock = false;
      } else {
        inBlock = agent === crawler;
      }
    } else if (inBlock && lower.startsWith("disallow:")) {
      const path = line.slice(line.indexOf(":") + 1).trim();
      if (path === "/" || path === "") return path === "/";
    }
  }
  return false;
}

export const aiSignalsCheck: SubCheck = async ({ url, fetchOptions }) => {
  const findings: Finding[] = [];
  const base = url.replace(/\/$/, "");

  // llms.txt
  const llmsRes = await safeFetch(`${base}/llms.txt`, {
    method: "GET",
    userAgent: fetchOptions.userAgent,
  });
  if (llmsRes && llmsRes.ok) {
    findings.push({
      id: "ai.llms_txt.present",
      dimension: "technical",
      severity: "ok",
      title: "`/llms.txt` publicado",
      why_it_matters: "",
      suggestion: "",
    });
  } else {
    findings.push({
      id: "ai.llms_txt.missing",
      dimension: "technical",
      severity: "warning",
      title: "`/llms.txt` em falta",
      why_it_matters:
        "Sem efeito comprovado em citação por LLMs (log studies 2025 mostram near-zero pickup), mas é hygiene esperada para dev-tool/SaaS docs. Cloudflare, Anthropic, Vercel publicam.",
      suggestion:
        "Publica `/llms.txt` no root do site seguindo a spec (Answer.AI / llmstxt.org). Promete pouco em inference mas remove o blocker de \"não tens isto?\".",
    });
  }

  // llms-full.txt
  const llmsFullRes = await safeFetch(`${base}/llms-full.txt`, {
    method: "GET",
    userAgent: fetchOptions.userAgent,
  });
  if (llmsFullRes && llmsFullRes.ok) {
    findings.push({
      id: "ai.llms_full_txt.present",
      dimension: "technical",
      severity: "ok",
      title: "`/llms-full.txt` publicado",
      why_it_matters: "",
      suggestion: "",
    });
  }

  // robots.txt — AI crawlers permissions
  const robots = await fetchText(`${base}/robots.txt`, fetchOptions.userAgent);
  if (!robots) {
    findings.push({
      id: "ai.robots.missing",
      dimension: "technical",
      severity: "warning",
      title: "`/robots.txt` em falta ou inacessível",
      why_it_matters:
        "Sem robots.txt o site fica em fallback ambíguo — alguns crawlers tratam como permissive, outros como restrictive.",
      suggestion: "Publica `/robots.txt` mesmo que permissive, declarando o sitemap.xml.",
    });
    return findings;
  }

  const blocked: string[] = [];
  for (const crawler of AI_CRAWLERS) {
    if (isCrawlerBlocked(robots, crawler)) blocked.push(crawler);
  }

  if (blocked.length > 0) {
    findings.push({
      id: "ai.robots.blocking",
      dimension: "technical",
      severity: "critical",
      title: `${blocked.length} crawler(s) IA bloqueado(s) em robots.txt`,
      why_it_matters:
        "Bloquear AI crawlers reduz drasticamente a probabilidade de citação. Notavelmente Google-Extended bloqueia treino/grounding do Gemini sem afetar ranking Search.",
      suggestion: `Revê robots.txt — remove Disallow: / para: ${blocked.join(", ")}. Se queres opt-out selectivo, bloqueia só os de treino (GPTBot, ClaudeBot), nunca os de pesquisa (OAI-SearchBot, ChatGPT-User, PerplexityBot).`,
      evidence: { blocked },
    });
  } else {
    findings.push({
      id: "ai.robots.permissive",
      dimension: "technical",
      severity: "ok",
      title: "robots.txt permite os AI crawlers principais",
      why_it_matters: "",
      suggestion: "",
    });
  }

  return findings;
};
