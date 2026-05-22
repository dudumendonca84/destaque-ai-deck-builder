-- =====================================================
-- destaque.ai Deck Builder · migration 004 — audit_runs v2
-- =====================================================
-- Reconcilia o modelo do PR #1 com a visão v2:
--  * a `audit_runs` original guarda uma linha por (prompt × motor): é um
--    log de respostas → renomeada para `audit_responses`.
--  * a nova `audit_runs` é o lote de auditoria (uma linha por proposta),
--    com o array de prompts gerados em JSONB.

-- Tier da proposta: 'free' = auditoria gratuita (5 prompts),
-- 'diagnostic' = diagnóstico pago (30 prompts).
alter table proposals
  add column audit_tier text not null default 'free'
  check (audit_tier in ('free', 'diagnostic'));

-- Renomeia o log de respostas e os objectos dependentes (o índice da PK
-- não é renomeado automaticamente e colidiria com a nova `audit_runs`).
alter table audit_runs rename to audit_responses;
alter index audit_runs_pkey rename to audit_responses_pkey;
alter index idx_runs_proposal rename to idx_audit_responses_proposal;

drop policy if exists "admin_all_audit_runs" on audit_responses;
create policy "admin_all_audit_responses" on audit_responses
  for all using (auth.role() = 'authenticated');

-- Nova `audit_runs` — lote de auditoria, uma linha por proposta.
-- prompts: [{ id, text, category, intent, generated_by_model, generated_at }]
create table audit_runs (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid unique references proposals(id) on delete cascade,
  created_at timestamptz default now(),
  prompts jsonb
);

-- Liga cada resposta ao lote a que pertence.
alter table audit_responses
  add column audit_run_id uuid references audit_runs(id) on delete cascade;

-- RLS — nova tabela fechada, espelha 003_rls_lockdown: só admin autenticado.
alter table audit_runs enable row level security;

create policy "admin_all_audit_runs" on audit_runs
  for all using (auth.role() = 'authenticated');
