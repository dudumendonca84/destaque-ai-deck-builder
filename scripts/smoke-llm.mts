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
import { queryPerplexity, hasPerplexityKey } from "../src/lib/llm/perplexity";
import { claudeComplete, hasAnthropicKey } from "../src/lib/llm/anthropic";
import { generatePrompts } from "../src/lib/llm/generate-prompts";
import { parseCitations } from "../src/lib/llm/parse-citations";

const PROMPT = "Recomenda uma boa pizzaria em Lisboa.";

function line(label: string, ok: boolean, detail: string) {
  const mark = ok ? "PASS" : "SKIP/FAIL";
  console.log(`[${mark}] ${label} — ${detail}`);
}

async function main() {
  console.log("=== Smoke-test LLM ===\n");

  // ChatGPT
  if (hasOpenAIKey()) {
    try {
      const r = await queryChatGPT(PROMPT);
      line("ChatGPT (gpt-4o)", true, `${r.response.slice(0, 60)}… (${r.tokens} tokens)`);
    } catch (e) {
      line("ChatGPT", false, e instanceof Error ? e.message : "erro");
    }
  } else {
    line("ChatGPT", false, "OPENAI_API_KEY em falta");
  }

  // Gemini
  if (hasGeminiKey()) {
    try {
      const r = await queryGemini(PROMPT);
      line("Gemini (2.0-flash)", true, `${r.response.slice(0, 60)}… (${r.tokens} tokens)`);
    } catch (e) {
      line("Gemini", false, e instanceof Error ? e.message : "erro");
    }
  } else {
    line("Gemini", false, "GOOGLE_AI_API_KEY em falta");
  }

  // Perplexity
  if (hasPerplexityKey()) {
    try {
      const r = await queryPerplexity(PROMPT);
      line("Perplexity (sonar)", true, `${r.response.slice(0, 60)}… (${r.tokens} tokens)`);
    } catch (e) {
      line("Perplexity", false, e instanceof Error ? e.message : "erro");
    }
  } else {
    line("Perplexity", false, "PERPLEXITY_API_KEY em falta");
  }

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
