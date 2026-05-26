import { OPENAI_MODEL } from "./models";
import type { EngineQueryResult } from "./types";

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function queryChatGPT(
  prompt: string,
  model: string = OPENAI_MODEL,
): Promise<EngineQueryResult> {
  // gpt-5/o1/o3 são reasoning models — thinking interno consome 30-90s no
  // default `medium` effort. Para audit (queries curtas, não bench), `low`
  // mantém qualidade aceitável e respeita o budget de 60s do worker pool.
  // Usam `max_completion_tokens` em vez de `max_tokens` e rejeitam temperature.
  const isReasoningModel =
    model.startsWith("gpt-5") || model.startsWith("o1") || model.startsWith("o3");

  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "user", content: prompt }],
  };

  if (isReasoningModel) {
    body.reasoning_effort = "low";
    body.max_completion_tokens = 1024;
  } else {
    body.max_tokens = 1024;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
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
