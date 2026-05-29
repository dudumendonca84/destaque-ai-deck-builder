import { loadSkillFile, sliceMarkdown } from "./loader";

/**
 * Conjunto de prompt categories canónicas. Tem de bater certo com
 * `## 2. Categorias canónicas` em `references/prompts.md` da skill.
 * Coordenado via INTERFACES.md.
 */
export const PROMPT_CATEGORIES = [
  "generic_category",
  "direct_comparison",
  "local_recommendation",
  "feature_specific",
  "price_comparison",
] as const;
export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

/**
 * Intent stages — estágio do funil que cada prompt expressa.
 * Coordenado com SINAL v1.5 (methodology-changelog.md).
 */
export const INTENT_STAGES = [
  "awareness",
  "research",
  "comparison",
  "decision",
  "post_decision",
] as const;
export type IntentStage = (typeof INTENT_STAGES)[number];

export type AuditTier = "free" | "diagnostic" | "premium";

/**
 * Distribuição de prompts por tier. Bate certo com a tabela
 * `## 3. Distribuição por tier` em prompts.md.
 */
export const TIER_DISTRIBUTION: Record<AuditTier, Record<PromptCategory, number>> = {
  free: {
    generic_category: 1,
    direct_comparison: 1,
    local_recommendation: 1,
    feature_specific: 1,
    price_comparison: 1,
  },
  diagnostic: {
    generic_category: 8,
    direct_comparison: 8,
    local_recommendation: 6,
    feature_specific: 4,
    price_comparison: 4,
  },
  premium: {
    generic_category: 8,
    direct_comparison: 8,
    local_recommendation: 6,
    feature_specific: 4,
    price_comparison: 4,
  },
};

export function tierTotal(tier: AuditTier): number {
  return Object.values(TIER_DISTRIBUTION[tier]).reduce((a, b) => a + b, 0);
}

/**
 * Fallback hardcoded da §1-3 do prompts.md. Usado quando o fetch falha
 * (rede, GH down, repo privado, etc.). Reflicte o conteúdo conhecido à
 * data de last refresh do contracto (23 May 2026).
 */
const FALLBACK_PROMPTS_MD = `## 1. Princípios

- **Persona implícita**: cada prompt deve soar a decisor B2B real (CIO, CTO, CFO, Head of CX, VP Sales, Director de Operações, Procurement). Não nomeies a persona no texto — escreve como ela escreveria.
- **Contexto realista**: inclui tamanho da empresa, geografia (se relevante), vertical, restrições conhecidas. Prompts vagos produzem respostas vagas.
- **Intent claro**: cada prompt expressa um destes intents — research, comparison, validation, migration, pricing, integration, pain_point.
- **Nunca nomeies a marca do cliente**: queremos ver se aparece organicamente.
- **Português europeu (PT-PT)** por defeito; PT-BR só se o público-alvo for tipicamente brasileiro.
- **Varia a formulação**: evita quase-duplicados na mesma categoria.

## 2. Categorias canónicas

5 categorias: generic_category, direct_comparison, local_recommendation, feature_specific, price_comparison.

- generic_category: pergunta ampla sobre o tipo de serviço/produto, sem nomear empresas. Intents: research, pain_point.
- direct_comparison: confronta fornecedores nomeados entre si. Intents: comparison, validation, migration.
- local_recommendation: pede recomendações para uma geografia específica. Intents: research, validation.
- feature_specific: foca funcionalidade ou capacidade técnica concreta. Intents: integration, validation.
- price_comparison: pergunta sobre custos, planos, orçamento. Intents: pricing, comparison.

## 3. Distribuição por tier (Deck Builder)

- free: 5 prompts (1 por categoria).
- diagnostic: 30 prompts (8 generic + 8 direct_comparison + 6 local + 4 feature + 4 price).`;

/**
 * Carrega o slice §1-3 de `references/prompts.md` (do `## 1.` ao
 * `## 4.` exclusive). É o contrato com a skill — coordenado em
 * INTERFACES.md.
 */
export async function loadPromptDirectives(): Promise<{
  body: string;
  source: "skill" | "fallback";
}> {
  const result = await loadSkillFile({
    path: "references/prompts.md",
    fallback: FALLBACK_PROMPTS_MD,
  });
  if (result.source === "fallback") return result;
  const slice = sliceMarkdown(result.body, "## 1. Princípios", "## 4. Catálogo destaque.ai");
  return { body: slice, source: "skill" };
}

export type TierDistribution = Record<PromptCategory, number>;

/**
 * Parse a tabela de `## 3. Distribuição por tier` do prompts.md. As colunas
 * a seguir a "Total" correspondem, por ordem, a PROMPT_CATEGORIES — o
 * contrato §3 obriga a tabela e a constante TS a baterem certo. O header
 * (Tier/Total), o separador e tiers desconhecidos são ignorados; uma linha
 * com counts inválidos é descartada.
 */
function parseTierDistribution(body: string): Partial<Record<AuditTier, TierDistribution>> {
  const start = body.indexOf("## 3.");
  if (start < 0) return {};
  let section = body.slice(start + 4);
  const next = section.indexOf("\n## ");
  if (next >= 0) section = section.slice(0, next);

  const out: Partial<Record<AuditTier, TierDistribution>> = {};
  const knownTiers = new Set<string>(["free", "diagnostic", "premium"]);
  for (const raw of section.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("|")) continue;
    if (/^\|[\s\-:|]+\|$/.test(line)) continue; // separador
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim().replace(/`/g, "").toLowerCase());
    const tier = cells[0];
    if (!knownTiers.has(tier)) continue; // salta header e ruído
    const counts = cells.slice(2); // dropa [tier, total] → fica [generic..price]
    if (counts.length < PROMPT_CATEGORIES.length) continue;
    const dist = {} as TierDistribution;
    let ok = true;
    PROMPT_CATEGORIES.forEach((cat, i) => {
      const n = Number.parseInt(counts[i], 10);
      if (!Number.isFinite(n) || n < 0) ok = false;
      dist[cat] = n;
    });
    if (ok) out[tier as AuditTier] = dist;
  }
  return out;
}

/**
 * Distribuição de prompts por tier, viva da skill (§3 de prompts.md). É a
 * config que o gerador segue — a constante `TIER_DISTRIBUTION` passa a ser
 * só o fallback (fetch falhou, tabela ausente/inválida, ou free/diagnostic
 * em falta). `premium` espelha `diagnostic` quando ausente da tabela.
 */
export async function loadPromptConfig(): Promise<{
  distribution: Record<AuditTier, TierDistribution>;
  source: "skill" | "fallback";
}> {
  const result = await loadSkillFile({
    path: "references/prompts.md",
    fallback: FALLBACK_PROMPTS_MD,
  });
  if (result.source === "fallback") {
    return { distribution: TIER_DISTRIBUTION, source: "fallback" };
  }
  const parsed = parseTierDistribution(result.body);
  if (!parsed.free || !parsed.diagnostic) {
    return { distribution: TIER_DISTRIBUTION, source: "fallback" };
  }
  return {
    distribution: {
      free: parsed.free,
      diagnostic: parsed.diagnostic,
      premium: parsed.premium ?? parsed.diagnostic,
    },
    source: "skill",
  };
}
