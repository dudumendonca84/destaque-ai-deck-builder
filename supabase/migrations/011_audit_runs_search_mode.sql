-- =====================================================
-- destaque.ai Deck Builder · migration 011 — search_mode em audit_runs
-- =====================================================
-- Adiciona coluna `search_mode` para implementar o contrato SINAL de
-- two-mode audits: cada (prompt × engine) corre em duas modalidades —
-- knowledge (modelo puro, sem tools) e augmented (vendor's native
-- web-search / grounding feature). Reportadas lado-a-lado, nunca
-- blended.
--
-- Contrato canónico em:
--   geo-seo-aeo-master/skills/geo-seo-aeo-master/references/search_modes.md
--
-- Engines com augmented suportado (Jun 2026):
--   chatgpt (Responses API + web_search), claude (web_search_20250305),
--   gemini (googleSearch tool), grok (search_parameters).
-- Engines só knowledge: mistral, deepseek (sem search nativo).
--
-- Audits existentes (criados antes desta migration) backfill a
-- 'knowledge' via DEFAULT — eram chamadas raw sem tools.

alter table public.audit_runs
  add column if not exists search_mode text
    not null
    default 'knowledge'
    check (search_mode in ('knowledge', 'augmented'));

comment on column public.audit_runs.search_mode is
  'Audit mode per SINAL two-mode contract: knowledge (raw model) or augmented (native web-search/grounding enabled).';

create index if not exists idx_audit_runs_proposal_mode
  on public.audit_runs(proposal_id, search_mode);
