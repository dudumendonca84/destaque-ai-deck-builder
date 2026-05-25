-- =====================================================
-- destaque.ai Deck Builder · migration 009 — 9 motores
-- =====================================================
-- Garante que a check constraint de `audit_runs.engine` aceita os 9
-- motores activos (migration 004 já incluía-os mas vai-se manter
-- explicitamente sincronizada).

alter table public.audit_runs drop constraint if exists audit_runs_engine_check;

alter table public.audit_runs
  add constraint audit_runs_engine_check
  check (engine in (
    'chatgpt',
    'claude',
    'gemini',
    'grok',
    'deepseek',
    'mistral',
    'perplexity',
    'meta',
    'copilot'
  ));
