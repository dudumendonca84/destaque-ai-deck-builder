import { META_MODEL } from "./models";
import type { EngineQueryResult } from "./types";

/**
 * Meta (Llama 5) via OpenRouter. OpenRouter expõe Llama 5 405B com
 * pricing transparente (~$0.001 per 1k tokens). Não é o Meta AI que
 * vive no WhatsApp/Instagram (esses não têm API pública) — é o modelo
 * base que os alimenta.
 *
 * Trade-off declarado: este resultado é proxy para inferir o que o
 * modelo Llama responderia; não inclui a integração Meta search nem
 * o contexto social-graph que Meta AI usa em produto.
 *
 * Para usar: definir OPENROUTER_API_KEY no Vercel.
 */

export function hasMetaKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export async function queryMeta(
  prompt: string,
  model: string = META_MODEL,
): Promise<EngineQueryResult> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "http-referer": "https://destaque.ai",
      "x-title": "destaque.ai deck builder",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    throw new Error(`Meta/OpenRouter ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { total_tokens?: number };
  };

  return {
    response: data.choices?.[0]?.message?.content ?? "",
    tokens: data.usage?.total_tokens ?? 0,
  };
}
