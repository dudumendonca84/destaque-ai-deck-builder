import { PERPLEXITY_MODEL } from "./models";
import type { EngineQueryResult, EngineSource } from "./types";
import { sourceDomain } from "./web-search";

export function hasPerplexityKey(): boolean {
  return Boolean(process.env.PERPLEXITY_API_KEY);
}

/**
 * Perplexity — search-grounded por definição (os modelos `sonar` pesquisam
 * sempre a web viva e devolvem fontes). API OpenAI-compatible em
 * api.perplexity.ai; corre augmented-only (ver `ALWAYS_SEARCH`). As fontes
 * vêm FORA do schema OpenAI: `search_results` (title+url) nos modelos actuais,
 * `citations` (URLs) nas respostas antigas.
 */
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
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    throw new Error(`Perplexity ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { total_tokens?: number };
    search_results?: { title?: string; url?: string }[];
    citations?: string[];
  };

  const sources: EngineSource[] = [];
  const seen = new Set<string>();
  for (const s of data.search_results ?? []) {
    if (s?.url && !seen.has(s.url)) {
      seen.add(s.url);
      sources.push({ url: s.url, title: s.title, domain: sourceDomain(s.url) });
    }
  }
  for (const u of data.citations ?? []) {
    if (typeof u === "string" && u && !seen.has(u)) {
      seen.add(u);
      sources.push({ url: u, domain: sourceDomain(u) });
    }
  }

  return {
    response: data.choices?.[0]?.message?.content ?? "",
    tokens: data.usage?.total_tokens ?? 0,
    sources: sources.length ? sources : undefined,
  };
}
