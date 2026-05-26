-- =====================================================
-- destaque.ai Deck Builder · migration 009 — synthesis via Max
-- =====================================================
-- Adiciona flag `deck_synthesis_pending` para sinalizar à Routine
-- `synthesize-pending-decks` (a correr no Claude Code Max do operador)
-- que esta proposta precisa de síntese.
--
-- Fluxo:
--   1. Audit completa → run-audit.ts marca pending = true
--   2. Routine no Claude Code Web (Max subscription, zero custo API)
--      polls Supabase a cada hora, processa cada pending
--   3. Routine escreve deck_blocks via Supabase REST e seta pending = false
--
-- O endpoint POST /api/audit/[id]/synthesize fica disponível como
-- fallback manual (ainda chama API), mas o fluxo default é Max.

alter table public.proposals
  add column if not exists deck_synthesis_pending boolean default false;

create index if not exists idx_proposals_synthesis_pending
  on public.proposals(deck_synthesis_pending)
  where deck_synthesis_pending = true;
