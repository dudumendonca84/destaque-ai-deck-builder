-- =====================================================
-- destaque.ai Deck Builder · migration 004 — engines: +grok +deepseek +mistral
-- =====================================================
-- Usa DO/EXECUTE para resolver o nome da constraint dinamicamente,
-- evitando o erro 42703 do parser PL/pgSQL ao referenciar colunas.

do $$
declare v_cname text;
begin
  select conname into v_cname
  from pg_constraint
  where conrelid = 'public.audit_runs'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%engine%'
  limit 1;

  if v_cname is not null then
    execute format('alter table public.audit_runs drop constraint %I', v_cname);
  end if;

  execute $q$
    alter table public.audit_runs
      add constraint audit_runs_engine_check
      check (engine in (
        'chatgpt', 'claude', 'gemini',
        'perplexity', 'grok', 'deepseek', 'mistral'
      ))
  $q$;
end $$;
