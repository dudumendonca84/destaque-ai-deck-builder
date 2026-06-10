import { OPENAI_MODEL } from "./models";
import type { EngineQueryResult } from "./types";
import type { SearchMode } from "@/lib/skill/searchModes";

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function queryChatGPT(
  prompt: string,
  model: string = OPENAI_MODEL,
  searchMode: SearchMode = "knowledge",
): Promise<EngineQueryResult> {
  if (searchMode === "augmented") return queryAugmented(prompt, model);
  return queryKnowledge(prompt, model);
}

/**
 * Knowledge mode: chat.completions, sem tools. Reasoning models
 * (gpt-5/o1/o3) usam `reasoning_effort: low` + `max_completion_tokens`.
 */
async function queryKnowledge(prompt: string, model: string): Promise<EngineQueryResult> {
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

/**
 * Augmented mode: Responses API com a `web_search` tool nativa — modelo
 * faz retrieval de live web context. Espelha o que um utilizador
 * ChatGPT.com vê com browse on.
 */
async function queryAugmented(prompt: string, model: string): Promise<EngineQueryResult> {
  const isReasoningModel =
    model.startsWith("gpt-5") || model.startsWith("o1") || model.startsWith("o3");

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      input: prompt,
      tools: [{ type: "web_search" }],
      max_output_tokens: 1024,
      // Reasoning models a effort default (medium) gastam 30-90s de
      // thinking — somado ao web search rebenta o timeout de 60s do
      // worker pool e trip o circuit breaker. `low` chega para audit.
      ...(isReasoningModel ? { reasoning: { effort: "low" } } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }

  // NOTA: `output_text` é um convenience helper dos SDKs oficiais — NÃO
  // existe no JSON cru da Responses API. Com fetch directo temos de
  // percorrer `output[]` e juntar os content items `output_text`.
  const data = (await res.json()) as {
    output?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: string }>;
    }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const text = (data.output ?? [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("");

  const tokensIn = data.usage?.input_tokens ?? 0;
  const tokensOut = data.usage?.output_tokens ?? 0;
  return {
    response: text,
    tokens: tokensIn + tokensOut,
  };
}
