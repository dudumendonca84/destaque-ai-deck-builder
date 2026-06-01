import { claudeJson, hasAnthropicKey } from "./anthropic";
import { loadSkillFile } from "@/lib/skill/loader";
import { DIMENSION_KEYS, type Dimension } from "@/lib/skill/dimensions";
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

// Re-export para compat com slides que importam `Dimension` daqui via
// ActionItem.dimension. A definição canónica vive em `@/lib/skill/dimensions`.
export type { Dimension };

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
  /** Markdown 1 frase — target de excelência 3HASH-grade desta acção. */
  benchmark_md?: string;
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
    /** Markdown 1 frase — "tu: X · 3HASH-grade: Y" com números. */
    benchmark_md?: string;
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
  /** Concorrentes classificados (Routine separa peer de vendor de hallucinated). */
  competitor_profiles?: Array<{
    name: string;
    classification: "peer_consultancy" | "vendor_platform" | "adjacent" | "hallucinated";
    positioning_md?: string;
    mention_count?: number;
    real_engine_mentions?: number;
  }>;
  /** Markdown — leitura honesta do landscape competitivo. */
  competitive_landscape_md?: string;
  projection_6m: {
    citation_rate_baseline: number;
    citation_rate_target: number;
    methodology_note_md?: string;
    methodology_note?: string;
    /** Estimativa de pipeline at risk em € por mês. Routine usa benchmarks
     * industry quando o prospect não dá LTV/funnel/TAQ. Omitido quando
     * faltam dados completamente — slide Potential degrada graciosamente. */
    monthly_eur_estimate?: {
      low: number;
      high: number;
      assumptions_md: string;
      confidence: "low" | "medium" | "high";
    };
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

// Alias para clareza no SCHEMA — DIMENSION_KEYS é a fonte única.
const DIMENSION_ENUM = DIMENSION_KEYS;

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
    competitor_profiles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          classification: {
            type: "string",
            enum: ["peer_consultancy", "vendor_platform", "adjacent", "hallucinated"],
          },
          positioning_md: { type: "string" },
          mention_count: { type: "number" },
        },
        required: ["name", "classification"],
      },
    },
    competitive_landscape_md: { type: "string" },
  },
  required: [
    "executive_reading",
    "critical_findings",
    "action_plan",
    "projection_6m",
    "faq",
    "competitor_profiles",
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
- 8 dimensões SINAL: ${DIMENSION_KEYS.join(", ")}. **Action plan tem de cobrir múltiplas dimensões**, não apenas technical. Inclui obrigatoriamente: schema/llms.txt/robots (technical); Wikidata/Wikipedia/sameAs (entity); Tier-1 PT media outreach OU podcast pitching (authority); presença Reddit/GitHub/comunidades que os motores citam (social); \`Person\` schema com bios e credenciais E-E-A-T (authority_on_site).
- 4 horizontes: H1 (semana 1-2, quick wins), H2 (semana 3-8, foundation), H3 (mês 2-6, compounding), ongoing (manutenção).
- Cada acção: title, why (mecanismo), effort estimate, impact típico, dimension (uma das 8), source (citação ao mapping ou estudo quando aplicável).`;
}

function buildUserPrompt(input: SynthesizeInput): string {
  const audit = input.audit;
  const scan = input.sinalScan;

  // Agrega TODOS os nomes mencionados nas respostas (sem passar pelo filtro
  // Claude). Conta por engine para o synthesize-deck ter contexto bruto e
  // poder classificar mesmo nomes que o filtro descartaria como "SEO only".
  const allMentions = new Map<string, number>();
  for (const run of input.auditRuns) {
    const mentions = run.competitors_mentioned ?? [];
    for (const m of mentions) {
      allMentions.set(m, (allMentions.get(m) ?? 0) + 1);
    }
  }
  const rawMentions = [...allMentions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([name, count]) => `${name} (${count}×)`)
    .join(", ");

  const auditSection = audit
    ? `## Resultados do audit em 6 motores LLM
- Citation rate global: ${(audit.summary.citation_rate * 100).toFixed(0)}%
- Share of voice: ${(audit.summary.share_of_voice * 100).toFixed(0)}% (intra-resposta)
- Posição média: ${audit.summary.avg_position ?? "—"}
- Top competitors (filtrados por relevância GEO): ${audit.summary.top_competitors?.join(", ") || "nenhum"}
- Todas as marcas mencionadas nas respostas (RAW, sem filtro): ${rawMentions || "nenhuma"}

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
5. **faq**: 3-5 perguntas que o prospecto provavelmente fará (preço, prazo, riscos, garantias, ownership). Respostas curtas e honestas.
6. **competitor_profiles**: lista TODOS os nomes da secção "Todas as marcas mencionadas nas respostas (RAW)" acima — não filtres. Para cada nome, classifica:
   - "peer_consultancy" — agência, consultora ou freelancer que oferece serviços relacionados (SEO clássico, GEO, AEO, marketing digital, conteúdo) e é potencial concorrente directo. **NO MERCADO PT, agências SEO clássicas COMO UniK SEO, Flowup, Infinidata, ou freelancers conhecidos contam aqui** mesmo sem GEO/AEO declarado, porque um decisor PT põe-nas na mesma shortlist.
   - "vendor_platform" — plataforma SaaS que se VENDE ao cliente (Profound, AthenaHQ, Otterly, Peec AI, Semrush, Ahrefs, BrightEdge, Conductor, Kalicube, Searchmetrics). O cliente compra-as; não concorrem com a consultoria.
   - "adjacent" — empresas de áreas próximas mas não directamente competitivas (ex.: agência de PR puro, design studio).
   - "hallucinated" — nomes que claramente não existem ou são genéricos demais ("Agência GEO", "Consultora IA").
   Inclui mention_count quando relevante. positioning_md (opcional, 1 frase) descreve o que oferecem. Sê AGRESSIVO em classificar como peer_consultancy — o slide Villain do deck precisa de mostrar 3 nomes reais. Se a lista RAW estiver vazia, devolve [].
7. **competitive_landscape_md** (opcional): 1-2 parágrafos PT-PT honestos sobre o que vês no landscape — quem domina o orgânico, quem está a fazer GEO, quem está só em SEO clássico, quem não existe.`;
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
