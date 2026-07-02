-- 014_rls_initplan.sql
--
-- Performance linter 0003 (auth_rls_initplan): as seis políticas `admin_all_*`
-- avaliavam `auth.role()` POR LINHA. Embrulhar em `(select ...)` transforma a
-- chamada num InitPlan avaliado uma vez por query — mesmo resultado, custo
-- O(1) em vez de O(linhas). Relevante sobretudo em `proposal_events` (cresce
-- com cada visualização de deck).
--
-- Já aplicada na base via MCP; ficheiro como registo/replay.

alter policy admin_all_prospects on public.prospects using ((select auth.role()) = 'authenticated');
alter policy admin_all_proposals on public.proposals using ((select auth.role()) = 'authenticated');
alter policy admin_all_events on public.proposal_events using ((select auth.role()) = 'authenticated');
alter policy admin_all_audit_responses on public.audit_responses using ((select auth.role()) = 'authenticated');
alter policy admin_all_audit_runs on public.audit_runs using ((select auth.role()) = 'authenticated');
alter policy admin_all_sinal_scans on public.sinal_scans using ((select auth.role()) = 'authenticated');
