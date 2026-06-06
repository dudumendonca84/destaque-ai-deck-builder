import { GEMINI_MODEL } from "./models";
import type { EngineQueryResult } from "./types";
import type { SearchMode } from "@/lib/skill/searchModes";

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GOOGLE_AI_API_KEY);
}

export async function queryGemini(
  prompt: string,
  model: string = GEMINI_MODEL,
  searchMode: SearchMode = "knowledge",
): Promise<EngineQueryResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  // Augmented mode: enables Google Search grounding. Citation URIs surface
  // under candidates[*].groundingMetadata.groundingChunks[*].web.uri.
  if (searchMode === "augmented") {
    body.tools = [{ googleSearch: {} }];
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    usageMetadata?: { totalTokenCount?: number };
  };

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

  return { response: text, tokens: data.usageMetadata?.totalTokenCount ?? 0 };
}
