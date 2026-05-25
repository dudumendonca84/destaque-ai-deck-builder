-- =====================================================
-- destaque.ai Deck Builder · migration 006 — intent_stage + prompts_meta
-- =====================================================
-- Adiciona `intent_stage` a `audit_runs` para gap analysis por estágio
-- do funil (awareness/research/comparison/decision/post_decision).
-- Permite ao deck renderizar bloco "Onde estás visível, onde não".
--
-- Categorias canónicas SINAL (coordenadas com prompts.md):
--   awareness      — "o que é X?"
--   research       — "como funciona Y?"
--   comparison     — "X vs Y?"
--   decision       — "recomendam X?"
--   post_decision  — "X integra com W?"

alter table public.audit_runs
  add column if not exists intent_stage text
    check (intent_stage in ('awareness','research','comparison','decision','post_decision'));

create index if not exists idx_audit_runs_intent on public.audit_runs(intent_stage);

-- Metadados dos prompts gerados — guarda category + intent_stage por prompt.
-- Estrutura: [{text, category, intent_stage}, ...] (mesmo shape que
-- GeneratedPrompt em TS). O `custom_prompts text[]` continua a ser o
-- canonical list de prompts (compat); este JSONB é meta paralelo.
alter table public.proposals
  add column if not exists prompts_meta jsonb;
