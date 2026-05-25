-- =====================================================
-- destaque.ai Deck Builder · migration 004 — rebuild audit_runs + 6 motores
-- =====================================================
-- A tabela `audit_runs` foi originalmente criada com um schema antigo
-- baseado em `prompts jsonb` (uma linha por audit, com tudo dentro de
-- JSON). O código actual espera o schema normalizado de 001_init.sql:
-- uma linha por (prompt × motor), com colunas tipadas.
--
-- Esta migration:
--  1. Apaga audit_runs (segura — tabela vazia)
--  2. Recria com o schema normalizado
--  3. Inclui os 6 motores activos no check (+ perplexity e mistral
--     para retro-compatibilidade)
--  4. Reaplica RLS (idempotente)

drop table if exists public.audit_runs cascade;

create table public.audit_runs (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references public.proposals(id) on delete cascade,
  created_at timestamptz default now(),
  prompt text not null,
  engine text not null check (engine in (
    'chatgpt', 'claude', 'gemini',
    'perplexity', 'grok', 'deepseek', 'mistral'
  )),
  response text,
  citations_found text[],
  brand_position integer,
  brand_present boolean default false,
  competitors_mentioned text[],
  sentiment_score numeric,
  tokens_used integer,
  cost_usd numeric(10, 6)
);

create index idx_runs_proposal on public.audit_runs(proposal_id);

alter table public.audit_runs enable row level security;

drop policy if exists "admin_all_audit_runs" on public.audit_runs;
create policy "admin_all_audit_runs" on public.audit_runs
  for all using (auth.role() = 'authenticated');
