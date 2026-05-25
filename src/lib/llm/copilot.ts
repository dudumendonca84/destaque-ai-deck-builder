import { COPILOT_MODEL } from "./models";
import type { EngineQueryResult } from "./types";

/**
 * Copilot — proxy via Azure OpenAI (que serve GPT-5 a Microsoft 365
 * Copilot e Bing Copilot). NOTA HONESTA: o output aqui é o GPT-5
 * base, sem o Bing index de grounding que diferencia Bing Copilot
 * dos outros surfaces de GPT-5.
 *
 * Como configurar:
 *   AZURE_OPENAI_API_KEY      — key da Azure
 *   AZURE_OPENAI_ENDPOINT     — ex.: https://my-resource.openai.azure.com
 *   AZURE_OPENAI_DEPLOYMENT   — nome do deployment (ex.: "gpt-5")
 *   AZURE_OPENAI_API_VERSION  — ex.: "2026-02-01"
 *
 * Se a key Azure não estiver configurada, fallback para OPENAI_API_KEY
 * direct (chamando o mesmo modelo). Garante que o slot Copilot é
 * sempre rastreável vs ChatGPT — duas chamadas paralelas ao GPT-5 são
 * legítimas para medir variância de output, mas isto deve ser
 * explícito no deck.
 */

export function hasCopilotKey(): boolean {
  return Boolean(process.env.AZURE_OPENAI_API_KEY) || Boolean(process.env.OPENAI_API_KEY);
}

async function queryAzure(prompt: string, model: string): Promise<EngineQueryResult> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "") ?? "";
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? model;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2026-02-01";
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": process.env.AZURE_OPENAI_API_KEY ?? "",
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    throw new Error(`Azure OpenAI (Copilot) ${res.status}: ${await res.text()}`);
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

async function queryOpenAiFallback(prompt: string, model: string): Promise<EngineQueryResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    throw new Error(`Copilot (OpenAI proxy) ${res.status}: ${await res.text()}`);
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

export async function queryCopilot(
  prompt: string,
  model: string = COPILOT_MODEL,
): Promise<EngineQueryResult> {
  if (process.env.AZURE_OPENAI_API_KEY) {
    return queryAzure(prompt, model);
  }
  return queryOpenAiFallback(prompt, model);
}
