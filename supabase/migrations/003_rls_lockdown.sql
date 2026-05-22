-- =====================================================
-- destaque.ai Deck Builder · migration 003 — RLS lockdown
-- =====================================================
-- A migration 002 expunha publicamente TODAS as propostas e prospects:
-- a política "public_select_proposals_by_token" não filtrava por token,
-- permitindo ao role `anon` (chave pública, presente no browser) ler a
-- tabela inteira via API REST do Supabase.
--
-- A partir daqui o `anon` não tem qualquer acesso. As páginas públicas
-- (/proposta/[token], download-pdf, track) passam a correr no servidor
-- com a service role, que ignora RLS, filtrando por token em código de
-- confiança. Só o admin autenticado mantém acesso via RLS.
--
-- Idempotente — pode correr mesmo que a 002 não tenha sido aplicada.

alter table prospects enable row level security;
alter table proposals enable row level security;
alter table proposal_events enable row level security;
alter table audit_runs enable row level security;

-- Remove todo o acesso público.
drop policy if exists "public_select_proposals_by_token" on proposals;
drop policy if exists "public_select_prospects_via_proposal" on prospects;
drop policy if exists "public_select_audit_runs_via_proposal" on audit_runs;
drop policy if exists "public_insert_events" on proposal_events;

-- Reafirma o acesso total para o admin autenticado (recriado para ser
-- idempotente caso a 002 não tenha corrido).
drop policy if exists "admin_all_prospects" on prospects;
drop policy if exists "admin_all_proposals" on proposals;
drop policy if exists "admin_all_events" on proposal_events;
drop policy if exists "admin_all_audit_runs" on audit_runs;

create policy "admin_all_prospects" on prospects
  for all using (auth.role() = 'authenticated');

create policy "admin_all_proposals" on proposals
  for all using (auth.role() = 'authenticated');

create policy "admin_all_events" on proposal_events
  for all using (auth.role() = 'authenticated');

create policy "admin_all_audit_runs" on audit_runs
  for all using (auth.role() = 'authenticated');
