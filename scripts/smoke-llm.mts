/**
 * Smoke-test das integrações LLM. Faz uma chamada real a cada motor
 * para o qual exista API key, e testa a geração de prompts e o parsing
 * de citações via Claude.
 *
 * Correr (com .env.local preenchido):
 *   npm run smoke:llm
 */
import { queryChatGPT, hasOpenAIKey } from "../src/lib/llm/openai";
import { queryGemini, hasGeminiKey } from "../src/lib/llm/gemini";
import { queryGrok, hasGrokKey } from "../src/lib/llm/grok";
import { queryDeepSeek, hasDeepSeekKey } from "../src/lib/llm/deepseek";
import { queryMistral, hasMistralKey } from "../src/lib/llm/mistral";
import { claudeComplete, hasAnthropicKey } from "../src/lib/llm/anthropic";
import { generatePrompts } from "../src/lib/llm/generate-prompts";
import { parseCitations } from "../src/lib/llm/parse-citations";
import {
  OPENAI_MODEL,
  GEMINI_MODEL,
  GROK_MODEL,
  DEEPSEEK_MODEL,
  MISTRAL_MODEL,
} from "../src/lib/llm/models";

const PROMPT = "Recomenda uma boa pizzaria em Lisboa.";

function line(label: string, ok: boolean, detail: string) {
  const mark = ok ? "PASS" : "SKIP/FAIL";
  console.log(`[${mark}] ${label} — ${detail}`);
}

async function tryEngine(
  label: string,
  has: () => boolean,
  envVar: string,
  call: () => Promise<{ response: string; tokens: number }>,
) {
  if (!has()) {
    line(label, false, `${envVar} em falta`);
    return;
  }
  try {
    const r = await call();
    line(label, true, `${r.response.slice(0, 60)}… (${r.tokens} tokens)`);
  } catch (e) {
    line(label, false, e instanceof Error ? e.message : "erro");
  }
}

async function main() {
  console.log("=== Smoke-test LLM ===\n");

  await tryEngine(
    `ChatGPT (${OPENAI_MODEL})`,
    hasOpenAIKey,
    "OPENAI_API_KEY",
    () => queryChatGPT(PROMPT),
  );

  await tryEngine(
    `Gemini (${GEMINI_MODEL})`,
    hasGeminiKey,
    "GOOGLE_AI_API_KEY",
    () => queryGemini(PROMPT),
  );

  await tryEngine(
    `Grok (${GROK_MODEL})`,
    hasGrokKey,
    "XAI_API_KEY",
    () => queryGrok(PROMPT),
  );

  await tryEngine(
    `DeepSeek (${DEEPSEEK_MODEL})`,
    hasDeepSeekKey,
    "DEEPSEEK_API_KEY",
    () => queryDeepSeek(PROMPT),
  );

  await tryEngine(
    `Mistral (${MISTRAL_MODEL})`,
    hasMistralKey,
    "MISTRAL_API_KEY",
    () => queryMistral(PROMPT),
  );

  // Claude
  if (hasAnthropicKey()) {
    try {
      const r = await claudeComplete({ prompt: PROMPT, maxTokens: 256 });
      line("Claude (sonnet-4-6)", true, `${r.text.slice(0, 60)}… (${r.tokens} tokens)`);
    } catch (e) {
      line("Claude", false, e instanceof Error ? e.message : "erro");
    }
  } else {
    line("Claude", false, "ANTHROPIC_API_KEY em falta");
  }

  // Pipeline: geração de prompts
  console.log("");
  const gp = await generatePrompts({
    business_type: "pizzaria",
    location: "Lisboa, Portugal",
    company_name: "Pizzaria Teste",
    target_audience: "particulares",
    competitors: ["Pizzaria A"],
  });
  line(
    "generatePrompts",
    gp.prompts.length >= 3,
    `source=${gp.source}, ${gp.prompts.length} prompts`,
  );

  // Pipeline: parsing de citações
  const pc = await parseCitations({
    response: "As melhores são a Pizzaria Teste e a Pizzaria A.",
    brandName: "Pizzaria Teste",
    knownCompetitors: ["Pizzaria A"],
  });
  line(
    "parseCitations",
    pc.brand_present === true,
    `brand_present=${pc.brand_present}, pos=${pc.brand_position}`,
  );

  console.log("\n=== Fim ===");
}

main().catch((e) => {
  console.error("Erro inesperado:", e);
  process.exit(1);
});
