-- =============================================================================
-- Proprietário da iniciativa visível no acompanhamento e atribuível no cadastro.
-- Idempotente: pode ser reexecutada.
-- =============================================================================

-- A view do dashboard não expunha o dono. Colunas novas entram ao final para
-- não quebrar o prefixo de CREATE OR REPLACE VIEW.
create or replace view public.v_projects_dashboard as
select
  p.id, p.title, p.stage, p.theme, p.directorate,
  a.name as area_name,
  p.uses_ai, p.uses_n8n,
  p.hours_saved_month,
  p.score_final, p.scoring_source, p.legacy_priority,
  p.last_activity_at,
  (current_date - p.last_activity_at::date) as dias_sem_atualizacao,
  case
    when p.stage in ('concluido', 'cancelado') then 'done'
    when (current_date - p.last_activity_at::date) <= 30 then 'ok'
    when (current_date - p.last_activity_at::date) >  90 then 'crit'
    else 'warn'
  end as sinal,
  ((current_date - p.last_activity_at::date) > 14
   and p.stage not in ('concluido', 'cancelado')) as alerta_14_dias,
  p.health, p.health_note, p.health_updated_at,
  p.tool_tags, p.implementation_cost,
  p.dev_started_at, p.concluded_at,
  p.description,
  p.cost_saved_month,
  p.owner_id,
  pr.full_name as owner_name
from public.projects p
left join public.areas a on a.id = p.area_id
left join public.profiles pr on pr.id = p.owner_id
where p.archived_at is null;

comment on column public.v_projects_dashboard.owner_id is
  'FK de projects.owner_id (profiles.id). Usado no filtro de proprietário.';
comment on column public.v_projects_dashboard.owner_name is
  'Nome de exibição do proprietário (profiles.full_name).';

-- Cadastro em nome de outra pessoa: qualquer participante+ informa o
-- owner_id (o valor continua sendo profiles.id). Antes só admin podia.
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
  for insert to authenticated
  with check (public.has_role_at_least('participante'));

-- Quem já podia editar (dono ou gerencial+) pode transferir a propriedade.
-- USING olha a linha atual; WITH CHECK a linha nova — sem isso, o dono
-- não conseguia gravar um owner_id diferente do próprio.
drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
  for update to authenticated
  using (owner_id = auth.uid() or public.has_role_at_least('gerencial'))
  with check (public.has_role_at_least('participante'));
