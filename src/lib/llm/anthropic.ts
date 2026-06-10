import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "./models";
import type { EngineSource } from "./types";
import { sourceDomain } from "./web-search";

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

/**
 * Geração de texto via Claude. Com `webSearch`, liga o server tool
 * `web_search_20260209` (replica o que o utilizador vê em claude.ai) e devolve
 * as fontes citadas. Sem `webSearch`, comportamento idêntico ao anterior.
 */
export async function claudeComplete(opts: {
  system?: string;
  prompt: string;
  maxTokens?: number;
  model?: string;
  webSearch?: boolean;
}): Promise<{ text: string; tokens: number; sources?: EngineSource[] }> {
  const c = client();
  const model = opts.model ?? CLAUDE_MODEL;
  const maxTokens = opts.maxTokens ?? 1024;

  if (!opts.webSearch) {
    const message = await c.messages.create({
      model,
      max_tokens: maxTokens,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
    });
    return {
      text: textOf(message),
      tokens: message.usage.input_tokens + message.usage.output_tokens,
    };
  }

  // Grounded: o server corre um loop search→read e pode devolver
  // stop_reason "pause_turn" quando atinge o limite de iterações; resume-se
  // ecoando o turno do assistente. Os blocos de tool/result são mais recentes
  // que a union do SDK pinned — iteramos de forma defensiva.
  const tools = [
    { type: "web_search_20260209", name: "web_search", max_uses: 5 },
  ];
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: opts.prompt },
  ];
  let text = "";
  let tokens = 0;
  const sources: EngineSource[] = [];
  const seen = new Set<string>();

  for (let turn = 0; turn < 5; turn++) {
    const message = await c.messages.create({
      model,
      max_tokens: maxTokens,
      system: opts.system,
      messages,
      tools,
    } as unknown as Anthropic.MessageCreateParamsNonStreaming);
    tokens += message.usage.input_tokens + message.usage.output_tokens;

    for (const block of message.content as unknown as Array<Record<string, unknown>>) {
      if (block.type === "text" && typeof block.text === "string") {
        text += block.text;
      } else if (block.type === "web_search_tool_result") {
        const results = Array.isArray(block.content) ? block.content : [];
        for (const r of results as Array<Record<string, unknown>>) {
          const url = typeof r.url === "string" ? r.url : undefined;
          if (url && !seen.has(url)) {
            seen.add(url);
            sources.push({
              url,
              title: typeof r.title === "string" ? r.title : undefined,
              domain: sourceDomain(url),
            });
          }
        }
      }
    }

    if (message.stop_reason === "pause_turn") {
      messages.push({
        role: "assistant",
        content: message.content as unknown as Anthropic.ContentBlockParam[],
      });
      continue;
    }
    break;
  }

  return { text, tokens, sources };
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
