import type { EngineSource } from "./types";
import { sourceDomain } from "./web-search";

/**
 * Parser defensivo para um payload da Responses API estilo OpenAI
 * (`POST /v1/responses`). Usado para OpenAI e xAI/Grok, que partilham a forma.
 * Percorre `output[] → message → content[] → output_text` para o texto e
 * recolhe anotações `url_citation` como fontes. Tolerante a campos em falta.
 */
export function parseResponsesPayload(data: unknown): {
  response: string;
  tokens: number;
  sources: EngineSource[];
} {
  const d = (data ?? {}) as {
    output_text?: string;
    output?: Array<{
      type?: string;
      content?: Array<{
        type?: string;
        text?: string;
        annotations?: Array<{ type?: string; url?: string; title?: string }>;
      }>;
    }>;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
    };
  };

  let text = "";
  const sources: EngineSource[] = [];
  const seen = new Set<string>();

  for (const item of d.output ?? []) {
    if (item?.type && item.type !== "message") continue;
    for (const c of item?.content ?? []) {
      if (typeof c?.text === "string") text += c.text;
      for (const a of c?.annotations ?? []) {
        if (a?.type === "url_citation" && a.url && !seen.has(a.url)) {
          seen.add(a.url);
          sources.push({ url: a.url, title: a.title, domain: sourceDomain(a.url) });
        }
      }
    }
  }

  // Fallback para o campo de conveniência (estilo SDK) se não houver texto.
  if (!text && typeof d.output_text === "string") text = d.output_text;

  const tokens =
    d.usage?.total_tokens ??
    (d.usage?.input_tokens ?? 0) + (d.usage?.output_tokens ?? 0);

  return { response: text, tokens, sources };
}
