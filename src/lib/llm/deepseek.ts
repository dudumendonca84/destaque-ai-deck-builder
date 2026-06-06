import { DEEPSEEK_MODEL } from "./models";
import type { EngineQueryResult } from "./types";
import type { SearchMode } from "@/lib/skill/searchModes";

export function hasDeepSeekKey(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export async function queryDeepSeek(
  prompt: string,
  model: string = DEEPSEEK_MODEL,
  searchMode: SearchMode = "knowledge",
): Promise<EngineQueryResult> {
  // DeepSeek tem sem first-party search/grounding (skill search_modes.md).
  // O orchestrator filtra via tabela; este throw é defensivo contra drift.
  if (searchMode === "augmented") {
    throw new Error("deepseek does not support augmented mode");
  }
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

  if (!res.ok) {
    throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
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
