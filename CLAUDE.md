# CLAUDE.md — destaque-ai-deck-builder

> **Quem deve ler isto:** qualquer sessão Claude (Code, web, desktop, agent) que abra este repo. Lê em primeiro lugar — define a posição deste repo no ecossistema destaque.ai e o que NÃO está aqui.

---

## A visão central (uma frase)

A **skill `geo-seo-aeo-master` é o cérebro único da destaque.ai**. Este repo (deck-builder) é o **executor operacional** que consome o cérebro via fetch em runtime — não duplica conhecimento, não hardcoda tom, não decide metodologia. Quando muda a skill, muda o que sai daqui no próximo audit, sem deployment.

## Os 3 repos do ecossistema

```
┌────────────────────────────────────────────────────────────────────┐
│  geo-seo-aeo-master  (PUBLIC)              ← cérebro, método SINAL │
│  https://github.com/dudumendonca84/geo-seo-aeo-master              │
│                                                                     │
│  • SKILL.md — princípios, identidade, workflow audit               │
│  • references/                                                     │
│    ├── prompts.md     (categorias canónicas + distribuição tier)   │
│    ├── models.md      (Deck Builder API mappings per tier)         │
│    ├── frameworks.md  (RAG, schema, E-E-A-T, llms.txt, crawlers)   │
│    ├── metrics.md     (citation vs mention, SoV, PAWC)             │
│    ├── benchmarks.md  (estudos com números, flagged stats)         │
│    └── tools.md       (vendor landscape com gaps honestos)         │
│  • daily-agent/       (cron 08:00 UTC — news-feed evolutivo)       │
│  • routines/          (self-audit semanal — eat own dog food)      │
│  • INTERFACES.md      (cross-repo contracts: paths + parse rules)  │
│  • methodology-changelog.md (audit trail da evolução SINAL)        │
└──────────────────────────┬─────────────────────────────────────────┘
                           │ raw GitHub URL fetch, cache 1h, fallback
                           ▼
┌────────────────────────────────────────────────────────────────────┐
│  destaque-ai-deck-builder  (this repo)      ← EXECUTOR             │
│  https://github.com/dudumendonca84/destaque-ai-deck-builder        │
│                                                                     │
│  Next.js 16 + Supabase + Vercel. Admin app em admin.destaque.ai,   │
│  deck público em destaque.ai/proposta/[token].                     │
│                                                                     │
│  Consome:                                                          │
│  • prompts.md §1-3 → system prompt de generate-audit-prompts.ts    │
│  • models.md ## Deck Builder API mappings → model ID per (engine,  │
│    tier)                                                           │
│  Não hardcoda metodologia. TS owns engine SET; MD owns CONFIG.     │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  destaque-ai-ops  (PRIVATE)                 ← arquivo + learnings  │
│  https://github.com/dudumendonca84/destaque-ai-ops                 │
│                                                                     │
│  • clients/[X]/          confidencial — dados crus do cliente      │
│  • learnings/            anonimizado — patterns publicáveis        │
│  • proposals/            snapshot imutável das propostas enviadas  │
│  • templates/            templates SINAL para audit e proposta     │
└────────────────────────────────────────────────────────────────────┘
```

## Privacy boundaries (não negociável)

Três camadas. Dados nunca atravessam para cima sem anonimização explícita:

1. **`destaque-ai-ops/clients/[X]/`** — dados identificáveis. CONFIDENCIAL. Nunca entram em learnings/ nem na public skill.
2. **`destaque-ai-ops/learnings/`** — patterns anonimizados extraídos do nível 1. Tudo aqui tem de ser publicável tal como está.
3. **`geo-seo-aeo-master/skills/.../references/`** — agregados públicos. Uma Routine `synthesis-weekly` (futura) lê o nível 2 e propõe updates aqui.

## A skill auto-alimenta-se (três loops independentes)

A skill **não é estática**. Evolui sozinha. Quando este repo faz fetch da skill amanhã, o conteúdo pode ser diferente do de hoje — *é feature, não bug*.

### Loop 1 — Field intelligence (diário)
`daily-agent/daily-prompt.md` corre 08:00 UTC. Monitoriza papers (arXiv cs.IR/cs.CL), vendor primary docs (Google Search Central, OpenAI/Anthropic/Perplexity bots docs), industry primary research (BrightEdge, Ahrefs, Profound, Semrush), Reddit r/SEO/r/portugal, AnswerThePublic. Updates a `news-feed.md`; absorve findings duráveis para `references/` antes de truncar.

### Loop 2 — Self-audit (semanal)
`routines/destaque-ai-self-audit-weekly.md` corre segundas 09:00 Lisboa. Usa o catálogo `prompts.md §4` como test suite contra os motores do SINAL, mede share-of-voice do destaque.ai vs concorrentes, escreve `destaque-ai-self/audit-baseline.md` + `improvements-backlog.md` + `audit-history.md`. **Eating own dog food**: a destaque.ai aplica SINAL a si própria toda a semana.

### Loop 3 — Learning from real work (futuro)
`destaque-ai-ops/learnings/` recolhe patterns anonimizados dos engagements reais. Uma Routine `synthesis-weekly` futura (ainda por configurar) lerá esta camada e proporá updates a `references/` ou `prompts.md §4`. Trazendo a inteligência operacional para o cérebro público.

**Implicação para sessões Claude**: a versão da skill que vês agora é um snapshot. Se algo te parece inconsistente entre dois ficheiros (ex: `references/models.md` vs `daily-agent/news-feed.md`), o news-feed tem precedência por estar mais fresco — e a contradição deve trigger uma proposed-update à `references/`.

## O método tem nome: SINAL

**SINAL** — *Sistema Integrado destaque.ai de Notabilidade em AI search e LLMs*. Proprietário, evolutivo, aplicado a B2B SaaS em Portugal com PT-PT contextual relevance. Sintetiza Princeton GEO (Aggarwal et al. KDD 2024) + arXiv follow-ups + vendor primary docs (Google, OpenAI, Anthropic, Perplexity, Microsoft) + industry primary research (BrightEdge, Ahrefs, Profound, Semrush, Pew, Seer, NetElixir) + Schema App / WordLift / Kalicube tradition + 3HASH audit format.

- **8 dimensões** (technical · content · entity · authority · UX · measurement · positioning · operational excellence)
- **12 categorias scorecard**
- **16 secções audit workflow**
- **4 horizontes action plan** (semana 1-2 / 3-6 / 7-12 / 90+ dias)

Detalhes completos em `geo-seo-aeo-master/skills/geo-seo-aeo-master/SKILL.md`. Quando precisares de raciocinar sobre o método, fetch o ficheiro — não inventes a partir do que está aqui.

## Princípios editoriais (propagam-se a tudo o que sai daqui)

Vêm da skill. Aplicam-se a prompts gerados, copy de email, custom_message da proposta, slide content do deck público, error messages client-facing:

1. **Sober tone, Economist register.** Nunca *game-changer*, *revolutionary*, *10x*, *leverage*, *unlock*, *the future is here*.
2. **Numbers over adjectives.** "TTFB 173-225 ms (mediana 5 corridas, Maio 2026)" não "rápido".
3. **PT-PT por defeito** para body e client-facing prose. EN preservado apenas para identificadores técnicos (`hreflang`, `gpt-5`, `Schema.org/Course`, `sameAs`), tool names, paper titles.
4. **Honest about uncertainty.** "Vendor data, treat as directional." "PT-PT-specific evidence is thin."
5. **No emoji** em audits, propostas, decks.
6. **Action-oriented.** Audits e propostas terminam sempre com 4-horizon plan, effort estimated.
7. **No fabricated benchmarks.** Se não existe estudo público, dizê-lo.

System prompts internos entre componentes Claude (engine→engine, gerador→parser) podem ser EN — é technical/dev-facing. Tudo que o cliente lê é PT-PT.

## Onde a skill é consumida neste repo (Steps 9 + 10)

Cross-repo contract canónico em `geo-seo-aeo-master/INTERFACES.md`. Resumido:

### Step 9 — generate-audit-prompts (`src/lib/llm/prompts/generate-audit-prompts.ts`)
- Fetch `references/prompts.md` via raw URL
- Slice `## 1. Princípios` até `## 4. Catálogo destaque.ai` (exclusive)
- Prepend ao SYSTEM da chamada Claude
- Distribuição por tier de `references/prompts.md §3`:
  - `free`: 5 prompts (1 por categoria)
  - `diagnostic`: 30 prompts (8 generic + 8 direct_comparison + 6 local + 4 feature + 4 price)
- Fallback: hardcoded em `src/lib/skill/prompts.ts` (`FALLBACK_PROMPTS_MD`)

### Step 10 — audit engine (`src/lib/llm/run-audit.ts`)
- Fetch `references/models.md`
- Parse bloco `## Deck Builder API mappings` (tabela `| Deck engine | Vendor | production | cost_optimized |`)
- Resolver por `audit_tier`:
  - `free` → coluna `cost_optimized` (lead-gen, unit economics)
  - `diagnostic` / `premium` → coluna `production` (paid deliverable, fidelity)
- Injectar `model id` em cada engine client wrapper
- Fallback: hardcoded em `src/lib/skill/models.ts` (`FALLBACK_MAPPINGS`)

### Engines actuais (TS owns SET)

`chatgpt`, `claude`, `gemini`, `grok`, `deepseek`, `mistral` — 6 motores. Adicionar um motor (ex: `perplexity`, `copilot`, `meta`) = code change neste repo (novo cliente + env var + switch case + `ENGINES`). Mudar a versão de modelo de um motor existente = apenas commit no skill.

Engines que apareçam em `models.md` mas não estejam no `ENGINES` deste repo são **ignoradas silenciosamente** — não cria erros.

### Loader contract

`src/lib/skill/loader.ts` é o ponto único de fetch. Cache em memória 1h. Sempre que falhar (404, parse error, rede down, repo privado), o caller usa o fallback hardcoded — o audit **nunca** bloqueia por causa da skill estar inacessível.

## Convenções não-óbvias deste repo

- **Migrations**: SQL em `supabase/migrations/NNN_*.sql`. Não correm automaticamente — aplicam-se manualmente no SQL Editor do Supabase. Histórico:
  - 001 init · 002 RLS · 003 RLS lockdown · 004 rebuild `audit_runs` · 005 `audit_tier`
- **Audit runs**: 1 row por `(prompt × engine)` na tabela `audit_runs`. Cada row é gravada à medida que termina, para progresso ao vivo no `AuditRunner`.
- **Mock fallback**: cada engine client tem fallback para mock determinístico via `mock-audit.ts` se a API key faltar OU a chamada falhar. Audit nunca bloqueia.
- **AUDIT_CONCURRENCY**: env var (default 5; recomendado 8 em produção). Worker pool limita chamadas LLM simultâneas ao longo de todos os `(prompt × engine)`.
- **URL validators**: `flexibleUrl` em `src/lib/validators.ts` aceita domínio cru (`destaque.ai`) — adiciona `https://` automaticamente.

## Divergências conscientes vs outras propostas no ecossistema

Outras sessões podem ter proposto:
- **7 motores incluindo Perplexity** → este repo mantém 6 (sem Perplexity), decisão explícita do founder. Pode ser revertido com PR (cliente + env var + ENGINES).
- **Schema split `audit_runs` (batch JSONB) + `audit_responses` (per row)** → este repo mantém `audit_runs` monolítico (1 row por response). Nomenclatura menos pura mas funcional. Migration de split seria 006+.

Documentadas para não causar confusão. Se uma sessão tiver instrução explícita para alinhar, fazer migration + PR coordenado.

## O que NÃO está implementado (e onde vive a decisão)

Steps futuros conforme roadmap do founder:

| Step | Descrição | Onde mora a decisão |
|---|---|---|
| 11 | Scan técnico do site do prospect | Adiado v2 — não bloquear MVP |
| 12 | Geração do deck por Claude carregando skill inteira | Próximo PR grande |
| 13 | Renderização dinâmica do deck a partir de `deck_blocks` | Depois de 12 |
| 15 | Admin UI publicar/snapshot + commit em ops | Depois de 13 |
| 17 | TrackerPreview (componente recorrente do Visibility Tracker) | Paralelo a 13 |
| Future | Routine `synthesis-weekly` (ops/learnings → skill/references) | Configurada noutra sessão |

Quando uma sessão futura abrir um destes, este CLAUDE.md continua válido — só adiciona detalhe ao executor, não muda o cérebro.

## Para uma nova sessão Claude

**Ordem de leitura recomendada:**

1. Este `CLAUDE.md`
2. `geo-seo-aeo-master/INTERFACES.md` (contracts entre repos, fetch via MCP)
3. `geo-seo-aeo-master/skills/geo-seo-aeo-master/SKILL.md` (método SINAL completo)
4. `geo-seo-aeo-master/skills/geo-seo-aeo-master/references/prompts.md` ou `models.md` (consoante o que vais tocar)
5. `README.md` deste repo (setup técnico)

**Regras de ouro:**

- Não duplicar conhecimento da skill em código TypeScript. Se precisares de saber "qual é o tom destaque.ai" ou "que prompt category é X", fetch o ficheiro.
- Não hardcoda model IDs em código novo. Usa `resolveModel()` ou os defaults de `src/lib/llm/models.ts` como fallback.
- Não escrevas em PT-PT à toa — quando o copy é client-facing, sim. Quando é dev-facing (comentários, error de stack), pode ser EN.
- Antes de mudar contracts (URLs fetched, slice anchors, table headers parsed), abre `INTERFACES.md` da skill — o que tu mudas aqui pode partir o consumer/producer side.
- Se a skill estiver inacessível, **o audit ainda corre** com fallbacks. Não é razão para bloquear.

---

**Última actualização:** 25 May 2026 (sessão que ligou Step 9 + Step 10 à skill via raw URL fetch, audit_tier column, modelos por tier).
