-- =============================================================================
-- Mês de início e data de conclusão prevista.
--
-- start_date já existia e não era preenchida no cadastro. Todas as
-- iniciativas recebem o mês da data de criação (created_at), no fuso de
-- São Paulo, gravado no dia 1.
--
-- O que era "data alvo" (target_date) passa a ser a data de conclusão
-- prevista. Os valores já gravados permanecem nessa coluna — não vão para
-- concluded_at, que é o marco real de quando o estágio virou Concluído.
--
-- A carga não reabre o semáforo nem reescreve updated_at.
-- Idempotente.
-- =============================================================================

comment on column public.projects.start_date is
  'Mês de início do projeto, gravado no dia 1. Carga inicial: mês de created_at em America/Sao_Paulo.';

comment on column public.projects.target_date is
  'Data de conclusão prevista. Antes rotulada como data alvo; os valores existentes permanecem aqui.';

-- Mudar o mês de início no cadastro renova o semáforo, como a data de conclusão.
create or replace function public.bump_last_activity()
returns trigger language plpgsql as $$
begin
  if (new.stage             is distinct from old.stage)
  or (new.description       is distinct from old.description)
  or (new.objetivo_contexto is distinct from old.objetivo_contexto)
  or (new.notes             is distinct from old.notes)
  or (new.links             is distinct from old.links)
  or (new.start_date        is distinct from old.start_date)
  or (new.target_date       is distinct from old.target_date)
  or (new.hours_saved_month is distinct from old.hours_saved_month)
  or (new.dev_hours         is distinct from old.dev_hours)
  or (new.score_impacto     is distinct from old.score_impacto)
  or (new.score_viabilidade is distinct from old.score_viabilidade)
  or (new.score_alinhamento is distinct from old.score_alinhamento)
  or (new.score_urgencia    is distinct from old.score_urgencia)
  or (new.health            is distinct from old.health)
  or (new.health_note       is distinct from old.health_note)
  then
    new.last_activity_at := now();
  end if;
  if new.health is distinct from old.health then
    new.health_updated_at := now();
  end if;
  return new;
end $$;

do $$
begin
  alter table public.projects disable trigger projects_touch;
exception when undefined_object then null;
end $$;

do $$
begin
  alter table public.projects disable trigger projects_bump_activity;
exception when undefined_object then null;
end $$;

update public.projects
set start_date = date_trunc('month', timezone('America/Sao_Paulo', created_at))::date
where created_at is not null
  and start_date is distinct from date_trunc('month', timezone('America/Sao_Paulo', created_at))::date;

do $$
begin
  alter table public.projects enable trigger projects_touch;
exception when undefined_object then null;
end $$;

do $$
begin
  alter table public.projects enable trigger projects_bump_activity;
exception when undefined_object then null;
end $$;
