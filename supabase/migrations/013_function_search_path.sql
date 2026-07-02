-- 013_function_search_path.sql
--
-- Hardening apontado pelo Supabase security linter (0011): as três funções
-- `public.*` deste repo não fixavam `search_path`, o que permite (em teoria)
-- hijack por objectos com o mesmo nome noutro schema. Todas usam apenas
-- referências qualificadas (auth.jwt(), public.current_email(), NEW.*), por
-- isso fixar o search_path a vazio é seguro e não muda comportamento.
--
-- Aplicar manualmente no SQL Editor do Supabase.

alter function public.trigger_set_updated_at() set search_path = '';
alter function public.current_email() set search_path = '';
alter function public.is_allowed_domain() set search_path = '';
