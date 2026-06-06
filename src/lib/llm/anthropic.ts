import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "./models";
import type { SearchMode } from "@/lib/skill/searchModes";

let cached: Anthropic | null = null;

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function client(): Anthropic {
  if (!cached) {
    cached = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return cached;
}

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

const WEB_SEARCH_TOOL = {
  type: "web_search_20250305" as const,
  name: "web_search" as const,
  max_uses: 3,
};

/**
 * Geração de texto simples via Claude. Quando `searchMode === "augmented"`,
 * o cliente activa a `web_search_20250305` tool nativa (Anthropic) — o
 * modelo retrieves live web context e tece nas suas respostas. Em
 * `knowledge` (default), nenhuma tool: training-only.
 */
export async function claudeComplete(opts: {
  system?: string;
  prompt: string;
  maxTokens?: number;
  model?: string;
  searchMode?: SearchMode;
}): Promise<{ text: string; tokens: number }> {
  const message = await client().messages.create({
    model: opts.model ?? CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
    ...(opts.searchMode === "augmented" ? { tools: [WEB_SEARCH_TOOL] } : {}),
  });
  return {
    text: textOf(message),
    tokens: message.usage.input_tokens + message.usage.output_tokens,
  };
}

/** Remove cercas markdown e extrai o primeiro objecto JSON do texto. */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : raw).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return body.slice(start, end + 1);
  }
  return body;
}

/**
 * Pede a Claude uma resposta estruturada em JSON. O `schema` é passado a
 * Claude como contrato textual; a resposta é parseada de forma defensiva.
 */
export async function claudeJson<T>(opts: {
  system?: string;
  prompt: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<{ data: T; tokens: number }> {
  const instruction = `${opts.prompt}

Responde APENAS com um objecto JSON válido que cumpra este JSON Schema, sem texto antes ou depois, sem cercas markdown:
${JSON.stringify(opts.schema)}`;

  const message = await client().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    system: opts.system,
    messages: [{ role: "user", content: instruction }],
  });
  const raw = textOf(message);
  return {
    data: JSON.parse(extractJson(raw)) as T,
    tokens: message.usage.input_tokens + message.usage.output_tokens,
  };
}
