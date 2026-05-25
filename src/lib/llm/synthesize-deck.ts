import { claudeJson, hasAnthropicKey } from "./anthropic";
import { loadSkillFile } from "@/lib/skill/loader";
import type { AuditResults, AuditRun } from "@/lib/supabase/types";
import type { ScanResult } from "@/lib/scan/types";

/**
 * Step 12 — Deck synthesis via Claude lendo skill inteira + dados do
 * audit + scan + prospect. Output estruturado e persistido em
 * `proposals.deck_blocks` para render no deck.
 *
 * Princípio SINAL: o cérebro é a skill. O code prepara contexto e
 * persiste; é Claude com a skill que decide o que dizer e como.
 */

export type Dimension =
  | "technical"
  | "content"
  | "entity"
  | "authority"
  | "ux"
  | "measurement"
  | "positioning"
  | "operational";

export type ActionItem = {
  title: string;
  /** Markdown rico — 200-400 palavras com mecanismo + porquê + fonte. */
  why_md?: string;
  /** Compat antigo — versão curta. Routine moderna usa why_md. */
  why?: string;
  effort: string;
  /** Markdown rico — pode incluir fonte URL inline. */
  impact_md?: string;
  /** Compat antigo. */
  impact?: string;
  dimension: Dimension;
  /** Ancoragem ao finding/observação que motivou esta acção. */
  anchor?: string;
  /** URL de fonte primária (paper, vendor doc, etc.). */
  source_url?: string;
  /** Compat antigo. */
  source?: string;
};

export type SynthesizedDeck = {
  /** Markdown — 600-1000 palavras de leitura editorial. */
  executive_reading_md?: string;
  /** Compat antigo. */
  executive_reading?: string;
  critical_findings: Array<{
    title: string;
    why_md?: string;
    why?: string;
    dimension: Dimension;
    anchor?: string;
  }>;
  action_plan: {
    h1: ActionItem[];
    h2: ActionItem[];
    h3: ActionItem[];
    ongoing: ActionItem[];
  };
  /** Markdown — research adicional ao vivo (Wikipedia, PR PT, podcasts). */
  research_additional_md?: string;
  projection_6m: {
    citation_rate_baseline: number;
    citation_rate_target: number;
    methodology_note_md?: string;
    methodology_note?: string;
  };
  faq: Array<{ q: string; a_md?: string; a?: string }>;
  /** Markdown — auto-crítica do output pela Routine. */
  self_critique_md?: string;
};

export type SynthesizeInput = {
  brandName: string;
  businessType: string | null;
  location: string | null;
  targetAudience: string | null;
  competitors: string[];
  audit: AuditResults | null;
  auditRuns: AuditRun[];
  sinalScan: ScanResult | null;
};

const DIMENSION_ENUM: Dimension[] = [
  "technical",
  "content",
  "entity",
  "authority",
  "ux",
  "measurement",
  "positioning",
  "operational",
];

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    executive_reading: { type: "string" },
    critical_findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          why: { type: "string" },
          dimension: { type: "string", enum: DIMENSION_ENUM },
        },
        required: ["title", "why", "dimension"],
      },
    },
    action_plan: {
      type: "object",
      additionalProperties: false,
      properties: {
        h1: { type: "array", items: { $ref: "#/$defs/action" } },
        h2: { type: "array", items: { $ref: "#/$defs/action" } },
        h3: { type: "array", items: { $ref: "#/$defs/action" } },
        ongoing: { type: "array", items: { $ref: "#/$defs/action" } },
      },
      required: ["h1", "h2", "h3", "ongoing"],
    },
    projection_6m: {
      type: "object",
      additionalProperties: false,
      properties: {
        citation_rate_baseline: { type: "number" },
        citation_rate_target: { type: "number" },
        methodology_note: { type: "string" },
      },
      required: ["citation_rate_baseline", "citation_rate_target", "methodology_note"],
    },
    faq: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          q: { type: "string" },
          a: { type: "string" },
        },
        required: ["q", "a"],
      },
    },
  },
  required: [
    "executive_reading",
    "critical_findings",
    "action_plan",
    "projection_6m",
    "faq",
  ],
  $defs: {
    action: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        why: { type: "string" },
        effort: { type: "string" },
        impact: { type: "string" },
        dimension: { type: "string", enum: DIMENSION_ENUM },
        source: { type: "string" },
      },
      required: ["title", "why", "effort", "impact", "dimension"],
    },
  },
};

function buildSystem(skill: {
  core: string;
  metrics: string;
  benchmarks: string;
  gapMapping: string;
  news: string;
}): string {
  return `Estás a operar o método SINAL (Sistema Integrado destaque.ai de Notabilidade em AI search e LLMs) da destaque.ai para sintetizar um deck-proposta personalizado.

# Identidade e princípios (extraídos do SKILL.md)
${skill.core}

# Métricas — definições canónicas
${skill.metrics}

# Benchmarks — números defensáveis com fonte
${skill.benchmarks}

# Mapping de gaps para acções (use estes patterns quando se aplicarem)
${skill.gapMapping}

# News-feed — estado da arte últimos 24-48h (use só se directamente relevante)
${skill.news}

# Regras editoriais não-negociáveis
- PT-PT body. EN preservado para identificadores técnicos (gpt-5, Schema.org, sameAs, hreflang, etc.).
- Sober tone (Economist register). Nunca "game-changer", "revolutionary", "10x", "leverage", "unlock", "the future is here".
- Numbers over adjectives. Cita fonte quando há (URL ou ano + estudo).
- No fabricated benchmarks. Se não há fonte, omite.
- Honest about uncertainty. "Vendor data, treat as directional" quando se aplica.
- 8 dimensões SINAL: technical, content, entity, authority, ux, measurement, positioning, operational. **Action plan tem de cobrir múltiplas dimensões**, não apenas technical. Inclui obrigatoriamente: schema/llms.txt/robots (technical); Wikidata/Wikipedia/sameAs (entity); Tier-1 PT media outreach OU podcast pitching (authority).
- 4 horizontes: H1 (semana 1-2, quick wins), H2 (semana 3-8, foundation), H3 (mês 2-6, compounding), ongoing (manutenção).
- Cada acção: title, why (mecanismo), effort estimate, impact típico, dimension (uma das 8), source (citação ao mapping ou estudo quando aplicável).`;
}

function buildUserPrompt(input: SynthesizeInput): string {
  const audit = input.audit;
  const scan = input.sinalScan;

  const auditSection = audit
    ? `## Resultados do audit em 6 motores LLM
- Citation rate global: ${(audit.summary.citation_rate * 100).toFixed(0)}%
- Share of voice: ${(audit.summary.share_of_voice * 100).toFixed(0)}% (intra-resposta)
- Posição média: ${audit.summary.avg_position ?? "—"}
- Top competitors (filtrados por relevância GEO): ${audit.summary.top_competitors.join(", ") || "nenhum"}

Por motor:
${Object.entries(audit.by_engine)
  .map(
    ([engine, s]) =>
      `- ${engine}: CR ${(s.citation_rate * 100).toFixed(0)}%, SoV ${(s.share_of_voice * 100).toFixed(0)}%, pos ${s.avg_position ?? "—"}`,
  )
  .join("\n")}`
    : "## Audit ainda não correu";

  const scanSection = scan
    ? `## SINAL scan do site
- Score global: ${scan.score}/100
- Findings críticos: ${scan.critical_findings.length}
- Verificações por confirmar manualmente: ${scan.unknown_count}

Top findings (critical + warning):
${scan.dimensions
  .flatMap((d) => d.findings)
  .filter((f) => f.severity === "critical" || f.severity === "warning")
  .slice(0, 10)
  .map((f) => `- [${f.dimension}/${f.severity}] ${f.title}: ${f.why_it_matters}`)
  .join("\n")}`
    : "## Sem SINAL scan disponível";

  return `# Prospecto
- Empresa: ${input.brandName}
- Negócio: ${input.businessType ?? "não especificado"}
- Localização: ${input.location ?? "não especificada"}
- Público-alvo: ${input.targetAudience ?? "não especificado"}
- Concorrentes declarados: ${input.competitors.join(", ") || "não especificados"}

${auditSection}

${scanSection}

# Tarefa
Gera o conteúdo personalizado do deck-proposta para esta empresa, em JSON estrito conforme o schema. Não inventes dados — se algo não tem fonte ou não está nos inputs, omite. Aplica princípios SINAL: sober, sourced, action-oriented, cross-dimensional.

Specifically:
1. **executive_reading**: 2-3 parágrafos de leitura editorial sobre onde a marca está, o que isto significa para o segmento, e o ângulo a atacar. PT-PT, sem hype, com 1-2 números do audit ou benchmarks.
2. **critical_findings**: 3-5 findings críticos cross-dimensional. Cada um: title (curto), why (porquê importa, com mecanismo), dimension.
3. **action_plan**: 4 horizontes (H1/H2/H3/ongoing). Cada horizonte tem 3-5 acções. Mistura obrigatoriamente dimensões — H1 não é só "fix schema"; inclui Wikidata/sameAs (entity), Tier-1 PT outreach OU podcast pitching (authority). Cita fonte do gap_action_mapping quando aplica.
4. **projection_6m**: baseline = citation_rate actual. Target conservador (max 0.4 OR baseline + 0.2, o que for maior). methodology_note com disclaimer sigmoidal + honestidade.
5. **faq**: 3-5 perguntas que o prospecto provavelmente fará (preço, prazo, riscos, garantias, ownership). Respostas curtas e honestas.`;
}

const SKILL_FILES = {
  core: "SKILL.md",
  metrics: "references/metrics.md",
  benchmarks: "references/benchmarks.md",
  gapMapping: "references/gap_action_mapping.md",
  news: "daily-agent/news-feed.md",
};

async function loadSynthesisContext(): Promise<{
  core: string;
  metrics: string;
  benchmarks: string;
  gapMapping: string;
  news: string;
}> {
  // Fetch all skill files in parallel. Empty fallback per file —
  // synthesis ainda consegue produzir output minimal com o que tiver.
  const [core, metrics, benchmarks, gapMapping, news] = await Promise.all([
    loadSkillFile({ path: SKILL_FILES.core, fallback: "" }),
    loadSkillFile({ path: SKILL_FILES.metrics, fallback: "" }),
    loadSkillFile({ path: SKILL_FILES.benchmarks, fallback: "" }),
    loadSkillFile({ path: SKILL_FILES.gapMapping, fallback: "" }),
    loadSkillFile({ path: SKILL_FILES.news, fallback: "" }),
  ]);
  return {
    core: core.body,
    metrics: metrics.body,
    benchmarks: benchmarks.body,
    gapMapping: gapMapping.body,
    news: news.body,
  };
}

function fallbackSynthesis(input: SynthesizeInput): SynthesizedDeck {
  const cr = input.audit?.summary.citation_rate ?? 0;
  return {
    executive_reading: `Para ${input.brandName}, o ponto de partida é uma taxa de citação de ${(cr * 100).toFixed(0)}% nos motores de IA testados. O segmento mostra elevada concentração em poucos players citados — há espaço para construir presença. As acções abaixo seguem o método SINAL e cobrem as 8 dimensões.`,
    critical_findings: [],
    action_plan: {
      h1: [
        {
          title: "Schema.org Organization completo",
          why: "Substrato de entity recognition para AI Overviews e LLMs.",
          effort: "30 min - 4h",
          impact: "Direct entity disambiguation lift.",
          dimension: "entity",
        },
      ],
      h2: [],
      h3: [],
      ongoing: [],
    },
    projection_6m: {
      citation_rate_baseline: cr,
      citation_rate_target: Math.max(0.3, cr + 0.2),
      methodology_note:
        "Projecção sigmoidal baseada em padrões observados. Não é garantia de outcome.",
    },
    faq: [],
  };
}

export async function synthesizeDeck(
  input: SynthesizeInput,
): Promise<{ deck: SynthesizedDeck; source: "claude" | "fallback" }> {
  if (!hasAnthropicKey()) {
    return { deck: fallbackSynthesis(input), source: "fallback" };
  }

  try {
    const skill = await loadSynthesisContext();
    const system = buildSystem(skill);
    const prompt = buildUserPrompt(input);

    const { data } = await claudeJson<SynthesizedDeck>({
      system,
      prompt,
      schema: SCHEMA,
      maxTokens: 6000,
    });

    // Validação mínima — Claude pode devolver action_plan vazio em
    // certos cases. Trade-off: aceita o output como vier; o caller
    // renderiza graciosamente.
    return { deck: data, source: "claude" };
  } catch {
    return { deck: fallbackSynthesis(input), source: "fallback" };
  }
}
