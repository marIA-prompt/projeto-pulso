-- =============================================================================
-- Remove de vez o gate da Matriz de Priorização no estágio Em Desenvolvimento.
-- A 0013 já tornava a função um no-op; o cadastro ainda falha se essa
-- migration não rodou em produção. Dropar o trigger elimina a recusa.
-- Idempotente.
-- =============================================================================

drop trigger if exists projects_stage_gate on public.projects;

drop function if exists public.enforce_stage_gate();
