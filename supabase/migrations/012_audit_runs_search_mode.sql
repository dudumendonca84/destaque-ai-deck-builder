-- =====================================================
-- destaque.ai Deck Builder · migration 012 — search_mode em audit_runs
-- =====================================================
-- Eixo two-mode do SINAL: cada (prompt × engine) capaz de web search corre
-- em duas modalidades — `knowledge` (modelo raw, sem tools) e `augmented`
-- (web search nativo do vendor). Reportadas lado-a-lado, nunca blended.
--
-- Contrato canónico em:
--   geo-seo-aeo-master/skills/geo-seo-aeo-master/references/search_modes.md
--
-- Ortogonal à coluna `sources` (migration 011): uma row leva (engine, mode,
-- sources). Motores sem search nativo (deepseek, mistral) só produzem rows
-- knowledge. Default 'knowledge' faz backfill seguro às rows antigas — que
-- eram efectivamente knowledge antes do augmented existir.
--
-- Aditivo. Aplicar manualmente no SQL Editor.

alter table public.audit_runs
  add column if not exists search_mode text
    not null
    default 'knowledge'
    check (search_mode in ('knowledge', 'augmented'));

comment on column public.audit_runs.search_mode is
  'Audit mode per SINAL two-mode contract: knowledge (raw model) or augmented (native web search/grounding enabled). Ortogonal a sources.';

create index if not exists idx_audit_runs_proposal_mode
  on public.audit_runs(proposal_id, search_mode);
