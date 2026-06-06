import { GROK_MODEL } from "./models";
import type { EngineQueryResult } from "./types";
import type { SearchMode } from "@/lib/skill/searchModes";

export function hasGrokKey(): boolean {
  return Boolean(process.env.XAI_API_KEY);
}

export async function queryGrok(
  prompt: string,
  model: string = GROK_MODEL,
  searchMode: SearchMode = "knowledge",
): Promise<EngineQueryResult> {
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  };

  // Augmented mode: xAI live search (real-time web + X corpus).
  // Citation URLs surface under choices[0].message.citations.
  if (searchMode === "augmented") {
    body.search_parameters = { mode: "on" };
  }

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify(body),
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
