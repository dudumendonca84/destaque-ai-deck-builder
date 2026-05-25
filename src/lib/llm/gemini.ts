import { GEMINI_MODEL } from "./models";
import type { EngineQueryResult } from "./types";

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GOOGLE_AI_API_KEY);
}

export async function queryGemini(
  prompt: string,
  model: string = GEMINI_MODEL,
): Promise<EngineQueryResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
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
