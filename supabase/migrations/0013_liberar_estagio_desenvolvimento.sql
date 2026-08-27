-- =============================================================================
-- Estágio Em Desenvolvimento deixa de exigir a Matriz de 4 eixos.
-- A Matriz saiu do cadastro; o trigger recusava insert/update nesse estágio
-- e a aplicação engolia o erro como "Não foi possível salvar as alterações."
-- Idempotente.
-- =============================================================================

create or replace function public.enforce_stage_gate()
returns trigger language plpgsql as $$
begin
  return new;
end $$;

comment on function public.enforce_stage_gate() is
  'Pass-through. O gate Backlog → Em Desenvolvimento (score ≥ 3,0) foi '
  'desligado porque a Matriz de 4 eixos não é mais preenchida no cadastro.';
