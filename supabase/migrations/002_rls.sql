-- =====================================================
-- destaque.ai Deck Builder · migration 002 — RLS
-- =====================================================

alter table prospects enable row level security;
alter table proposals enable row level security;
alter table proposal_events enable row level security;
alter table audit_runs enable row level security;

-- Admin autenticado tem acesso total
create policy "admin_all_prospects" on prospects
  for all using (auth.role() = 'authenticated');

create policy "admin_all_proposals" on proposals
  for all using (auth.role() = 'authenticated');

create policy "admin_all_events" on proposal_events
  for all using (auth.role() = 'authenticated');

create policy "admin_all_audit_runs" on audit_runs
  for all using (auth.role() = 'authenticated');

-- Excepções públicas
create policy "public_insert_events" on proposal_events
  for insert with check (true);

create policy "public_select_proposals_by_token" on proposals
  for select using (deleted_at is null);

create policy "public_select_prospects_via_proposal" on prospects
  for select using (
    exists (
      select 1 from proposals
      where proposals.prospect_id = prospects.id
        and proposals.deleted_at is null
    )
  );

create policy "public_select_audit_runs_via_proposal" on audit_runs
  for select using (
    exists (
      select 1 from proposals
      where proposals.id = audit_runs.proposal_id
        and proposals.deleted_at is null
    )
  );
