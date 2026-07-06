import { GROK_MODEL, AUDIT_MAX_TOKENS } from "./models";
import type { EngineQueryResult } from "./types";
import { parseResponsesPayload } from "./responses-api";

export function hasGrokKey(): boolean {
  return Boolean(process.env.XAI_API_KEY);
}

export async function queryGrok(
  prompt: string,
  model: string = GROK_MODEL,
  opts: { webSearch?: boolean } = {},
): Promise<EngineQueryResult> {
  if (opts.webSearch) return queryGrokGrounded(prompt, model);

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    throw new Error(`Grok ${res.status}: ${await res.text()}`);
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

/**
 * Caminho grounded: a xAI descontinuou a Live Search via `search_parameters` a
 * 2026-01-12 (HTTP 410). O caminho atual é a Responses API com o tool nativo
 * `web_search` — mesma forma que a OpenAI.
 */
async function queryGrokGrounded(
  prompt: string,
  model: string,
): Promise<EngineQueryResult> {
  const res = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      input: prompt,
      tools: [{ type: "web_search" }],
      max_output_tokens: AUDIT_MAX_TOKENS,
    }),
  });

  if (!res.ok) {
    throw new Error(`Grok ${res.status}: ${await res.text()}`);
  }

  const { response, tokens, sources } = parseResponsesPayload(await res.json());
  return { response, tokens, sources };
}
