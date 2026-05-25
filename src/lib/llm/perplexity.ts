import { PERPLEXITY_MODEL } from "./models";
import type { EngineQueryResult } from "./types";

export function hasPerplexityKey(): boolean {
  return Boolean(process.env.PERPLEXITY_API_KEY);
}

export async function queryPerplexity(
  prompt: string,
  model: string = PERPLEXITY_MODEL,
): Promise<EngineQueryResult> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Perplexity ${res.status}: ${await res.text()}`);
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
