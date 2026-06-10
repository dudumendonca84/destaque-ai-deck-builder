import { GEMINI_MODEL } from "./models";
import type { EngineQueryResult, EngineSource } from "./types";

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GOOGLE_AI_API_KEY);
}

export async function queryGemini(
  prompt: string,
  model: string = GEMINI_MODEL,
  opts: { webSearch?: boolean } = {},
): Promise<EngineQueryResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
  };
  // REST v1beta usa `google_search` (snake_case) para Gemini 2.0+ — nota que o
  // SDK @google/genai usa `googleSearch` (camelCase). Repos diferentes,
  // formatos diferentes.
  if (opts.webSearch) body.tools = [{ google_search: {} }];

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
      groundingMetadata?: {
        groundingChunks?: { web?: { uri?: string; title?: string } }[];
      };
    }[];
    usageMetadata?: { totalTokenCount?: number };
  };

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

  let sources: EngineSource[] | undefined;
  if (opts.webSearch) {
    const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const seen = new Set<string>();
    sources = [];
    for (const ch of chunks) {
      const uri = ch.web?.uri;
      if (!uri || seen.has(uri)) continue;
      seen.add(uri);
      // O `uri` é um redirect da Google (vertexaisearch...); o domínio legível
      // da fonte vem no `title`.
      sources.push({ url: uri, title: ch.web?.title, domain: ch.web?.title });
    }
  }

  return {
    response: text,
    tokens: data.usageMetadata?.totalTokenCount ?? 0,
    sources,
  };
}
