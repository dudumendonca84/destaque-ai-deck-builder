-- =====================================================
-- destaque.ai Deck Builder · migration 005 — audit_tier em proposals
-- =====================================================
-- Adiciona `audit_tier` à tabela `proposals` (`free` | `diagnostic` | `premium`).
-- O Deck Builder usa este valor para escolher a coluna em
-- `## Deck Builder API mappings` (cost_optimized para free, production
-- para diagnostic e premium). Default `free` para retro-compatibilidade.

alter table public.proposals
  add column if not exists audit_tier text not null default 'free'
    check (audit_tier in ('free', 'diagnostic', 'premium'));

create index if not exists idx_proposals_audit_tier on public.proposals(audit_tier);
