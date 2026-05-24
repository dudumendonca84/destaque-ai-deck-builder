import { DEEPSEEK_MODEL } from "./models";
import type { EngineQueryResult } from "./types";

export function hasDeepSeekKey(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

// DeepSeek tem soft rate limits — retentamos 429/503 com backoff exponencial.
const RETRY_DELAYS_MS = [1000, 2000, 4000];

export async function queryDeepSeek(
  prompt: string,
  model: string = DEEPSEEK_MODEL,
): Promise<EngineQueryResult> {
  let lastError = "DeepSeek: sem resposta";
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { total_tokens?: number };
      };
      return {
        response: data.choices?.[0]?.message?.content ?? "",
        tokens: data.usage?.total_tokens ?? 0,
      };
    }

    lastError = `DeepSeek ${res.status}: ${await res.text()}`;
    if (res.status !== 429 && res.status !== 503) break;
    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
    }
  }
  throw new Error(lastError);
}
