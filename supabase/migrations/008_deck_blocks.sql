-- =====================================================
-- destaque.ai Deck Builder · migration 008 — deck_blocks
-- =====================================================
-- Persistência do output do Step 12 (synthesize-deck.ts).
--
-- `deck_blocks` JSONB contém o conteúdo gerado por Claude lendo a
-- skill inteira + audit_results + sinal_scan + prospect data:
--   - executive_reading: 2-3 parágrafos sober (tom SINAL)
--   - critical_findings: top findings cross-dimensional
--   - action_plan: 4 horizontes personalizados (H1/H2/H3/ongoing)
--   - projection_6m: baseline + target com methodology note
--   - faq: 3-5 Q&A personalizadas
--
-- Persiste no momento da síntese. Pode ser re-gerado.

alter table public.proposals
  add column if not exists deck_blocks jsonb,
  add column if not exists deck_synthesized_at timestamptz,
  add column if not exists deck_synthesized_source text
    check (deck_synthesized_source in ('claude','fallback'));
