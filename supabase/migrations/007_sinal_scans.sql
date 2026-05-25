-- =====================================================
-- destaque.ai Deck Builder · migration 007 — SINAL scans
-- =====================================================
-- Persistência dos resultados do SINAL scan (Step 11): análise técnica,
-- entidade, autoridade do site do prospect.
--
-- 1 scan por proposta. Re-scan apaga e cria novo.

create table if not exists public.sinal_scans (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references public.proposals(id) on delete cascade,
  domain text not null,
  score integer,
  scan_results jsonb,
  critical_count integer default 0,
  unknown_count integer default 0,
  scanned_at timestamptz default now()
);

create index if not exists idx_sinal_scans_proposal on public.sinal_scans(proposal_id);
create unique index if not exists idx_sinal_scans_proposal_unique on public.sinal_scans(proposal_id);

alter table public.sinal_scans enable row level security;

drop policy if exists "admin_all_sinal_scans" on public.sinal_scans;
create policy "admin_all_sinal_scans" on public.sinal_scans
  for all using (auth.role() = 'authenticated');
