import type { Engine } from "./models";
import type { AuditTier } from "@/lib/supabase/types";

/**
 * Web search / grounding por motor.
 *
 * Só fundamentamos (grounding) os motores que expõem uma pesquisa web real e
 * de primeira-parte na API que já chamamos:
 *  - claude  → Messages API, server tool `web_search_20260209`
 *  - chatgpt → Responses API, tool `web_search`
 *  - gemini  → tool `google_search` (grounding)
 *  - grok    → Responses API, tool `web_search` (o antigo `search_parameters`
 *              Live Search foi descontinuado a 2026-01-12 / HTTP 410)
 *
 * Deixados ungrounded (intencional, documentado):
 *  - deepseek → a API não tem pesquisa web (só a app)
 *  - mistral  → pesquisa web só via Agents/Conversations API, não no endpoint
 *               de chat completions que este repo chama
 *
 * Porquê: o ponto do audit é replicar o que um comprador vê quando pergunta a
 * uma AI hoje — e essas AIs pesquisam na web em tempo real.
 */
export const WEB_SEARCH_CAPABLE: Record<Engine, boolean> = {
  chatgpt: true,
  claude: true,
  gemini: true,
  grok: true,
  deepseek: false,
  mistral: false,
  perplexity: true,
};

/**
 * Motores search-grounded *por definição* — não há modo sem pesquisa para medir.
 * Correm augmented-only (ver `expandEngineModes`). Perplexity sonar pesquisa
 * sempre a web viva.
 */
export const ALWAYS_SEARCH: Partial<Record<Engine, boolean>> = {
  perplexity: true,
};

function masterEnabled(): boolean {
  const raw = (process.env.AUDIT_WEB_SEARCH ?? "1").trim().toLowerCase();
  return raw !== "0" && raw !== "false" && raw !== "off" && raw !== "no";
}

/**
 * Se os motores devem correr grounded (web search) para um dado tier de audit.
 *
 * Default: ligado em TODOS os tiers ("replicar exatamente o que o cliente vê").
 * Define `AUDIT_WEB_SEARCH_TIERS` com uma lista separada por vírgulas para
 * restringir — ex. `diagnostic,premium` mantém o `free` (lead-gen) sem custo de
 * pesquisa. `AUDIT_WEB_SEARCH=0` desliga em todo o lado.
 */
export function webSearchEnabledForTier(tier: AuditTier): boolean {
  if (!masterEnabled()) return false;
  const list = (process.env.AUDIT_WEB_SEARCH_TIERS ?? "").trim();
  if (!list) return true; // default: todos os tiers
  return list
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .includes(tier);
}

/**
 * Timeout por chamada grounded. A pesquisa web corre um loop server-side de
 * search+read materialmente mais lento que uma completion normal, por isso o
 * timeout default do audit (60s) é demasiado apertado. Configurável via
 * `AUDIT_SEARCH_TIMEOUT_MS` (default 120s).
 */
export function searchTimeoutMs(): number {
  const raw = process.env.AUDIT_SEARCH_TIMEOUT_MS;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 120_000;
}

/** Best-effort hostname → domínio cru de um URL de fonte citada. */
export function sourceDomain(url: string): string | undefined {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host || undefined;
  } catch {
    return undefined;
  }
}
