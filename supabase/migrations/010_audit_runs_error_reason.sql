-- =====================================================
-- destaque.ai Deck Builder · migration 010 — error_reason em audit_runs
-- =====================================================
-- Adiciona coluna `error_reason` para sinalizar runs onde o motor não
-- foi consultado (falta API key) ou falhou (erro de API). Estas rows
-- ficam com response/brand_present/* a NULL e são excluídas do cálculo
-- de citation_rate, share_of_voice e top_competitors.
--
-- Antes desta migration, falhas eram silenciosamente substituídas por
-- mocks determinísticos, o que inflacionava as métricas. A própria
-- Routine de síntese descobriu este bug ao auditar 80/180 respostas
-- reais (resto eram [Simulação · {engine}]).

alter table public.audit_runs
  add column if not exists error_reason text;

comment on column public.audit_runs.error_reason is
  'NULL = run com resposta real. Valor = motivo da falha (no_api_key, api_failed). Rows com error_reason não contam para aggregates.';

create index if not exists idx_audit_runs_error_reason
  on public.audit_runs(error_reason)
  where error_reason is not null;
