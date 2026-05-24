-- destaque.ai Deck Builder · migration 005 — engines v2 (7 motores)
--
-- Estende o CHECK constraint da coluna `engine` em audit_responses para
-- aceitar 3 motores adicionais: mistral, grok, deepseek. A migration 001
-- criou o CHECK como `audit_runs_engine_check`; a migration 004 renomeou
-- a tabela mas o Postgres não renomeia constraints automaticamente, por
-- isso o nome antigo ainda pode estar em uso.

alter table audit_responses
  drop constraint if exists audit_runs_engine_check;
alter table audit_responses
  drop constraint if exists audit_responses_engine_check;
alter table audit_responses
  add constraint audit_responses_engine_check
  check (engine in ('chatgpt','claude','gemini','perplexity',
                    'mistral','grok','deepseek'));
