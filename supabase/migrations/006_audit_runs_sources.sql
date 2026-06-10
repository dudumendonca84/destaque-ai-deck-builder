-- =====================================================
-- destaque.ai Deck Builder · migration 006 — sources em audit_runs
-- =====================================================
-- Adiciona `sources` (jsonb) a `audit_runs`: as fontes (URLs/domínios) que
-- cada motor citou quando corre com web search ligado. Array de objectos
-- `{ url, title, domain }`; `null` em runs sem grounding (ex.: tier `free`
-- com web search desligado, ou motores não-grounded como deepseek/mistral).
--
-- Aditivo e idempotente. Aplicar manualmente no SQL Editor do Supabase.

alter table public.audit_runs
  add column if not exists sources jsonb;

comment on column public.audit_runs.sources is
  'Fontes citadas pelo motor em runs com web search (array de {url,title,domain}). Null sem grounding.';
