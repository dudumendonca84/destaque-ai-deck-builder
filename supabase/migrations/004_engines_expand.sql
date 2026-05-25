-- =====================================================
-- destaque.ai Deck Builder · migration 004 — engines: +grok +deepseek
-- =====================================================
-- Substitui Perplexity por Grok + DeepSeek na lista activa de motores.
-- Mantém 'perplexity' e adiciona 'mistral' no check para retro-compatibilidade
-- (audit_runs antigos não devem invalidar; mistral fica pronto se for activado).

alter table audit_runs drop constraint if exists audit_runs_engine_check;

alter table audit_runs
  add constraint audit_runs_engine_check
  check (engine in ('chatgpt','claude','gemini','perplexity','grok','deepseek','mistral'));
