/**
 * Smoke-test de render do deck (PDF). Garante que `buildPdf` gera em todos
 * os formatos de dados — incluindo `audit_results` esparsos (summary sem
 * `top_competitors`), a condição que dava 500 no download.
 *
 * Self-contained: faz mock do fetch para 404, por isso os loaders da skill
 * usam o fallback hardcoded — corre em qualquer lado (CI incluído), sem
 * depender do repo da skill nem de API keys.
 *
 * Correr:  npm run smoke:deck
 */
import { loadMethod } from "../src/lib/skill/method";
import { loadCoreBenchmarks } from "../src/lib/skill/benchmarks";
import { buildPdf } from "../src/lib/pdf/build-deck";

// Sem rede: loaders caem para fallback (determinístico).
globalThis.fetch = (async () => ({ ok: false, status: 404, text: async () => "" })) as typeof fetch;

const { method } = await loadMethod();
const { items: benchmarks } = await loadCoreBenchmarks();

function makeDeck(summary: Record<string, unknown> | null): unknown {
  return {
    token: "smoke",
    companyName: "Empresa Exemplo, SA",
    businessType: "B2B SaaS",
    location: "Lisboa",
    customMessage: "smoke test",
    auditTier: "diagnostic",
    pricing: { diagnostico: 2500, sprint: 6000, retainer: 3500 },
    prompts: ["Melhor CRM para PME em Portugal?", "Alternativas para faturação?"],
    competitors: ["Concorrente A", "Concorrente B"],
    audit: summary ? { summary } : null,
    auditRuns: [],
    benchmarks,
    method,
    sinalScan: null,
    synthesized: null,
  };
}

// Cada caso é um formato de dados que a rota do PDF pode receber em produção.
const cases: Array<[string, Record<string, unknown> | null]> = [
  ["sem audit (proposta nova)", null],
  ["summary SEM top_competitors (audit esparso → o crash do download)", { citation_rate: 0, share_of_voice: 0, avg_position: null }],
  ["summary completo", { citation_rate: 0.12, share_of_voice: 0.2, avg_position: 3, top_competitors: ["Rival A", "Rival B"] }],
];

let ok = true;
for (const [name, summary] of cases) {
  try {
    const buf = await buildPdf(makeDeck(summary) as never);
    if (!buf.length) throw new Error("PDF vazio");
    console.log(`✓ ${name} → ${buf.length} bytes`);
  } catch (err) {
    ok = false;
    console.error(`✗ ${name} → ${(err as Error).message}`);
  }
}

if (!ok) {
  console.error("\n❌ smoke-deck falhou");
  process.exit(1);
}
console.log("\n✅ smoke-deck passou — buildPdf gera em todos os formatos de dados");
