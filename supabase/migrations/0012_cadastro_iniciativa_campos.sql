-- =============================================================================
-- Cadastro de iniciativa: Objetivo e Contexto, ferramentas discriminadas
-- (IA tradicional / generativa / n8n / outros). Idempotente.
-- =============================================================================

alter table public.projects
  add column if not exists objetivo_contexto text,
  add column if not exists uses_ai_tradicional boolean,
  add column if not exists uses_ai_generativa boolean,
  add column if not exists uses_outros boolean;

comment on column public.projects.objetivo_contexto is
  'A que objetivo, necessidade ou oportunidade a iniciativa se liga, a situação atual e quem é afetado.';

comment on column public.projects.dev_hours is
  'Estimativa de tempo do desenvolvimento, em horas.';

comment on column public.projects.uses_ai_tradicional is
  'IA clássica / preditiva / regras — distinta da generativa.';

comment on column public.projects.uses_ai_generativa is
  'IA generativa (LLM, RAG, agentes).';

comment on column public.projects.uses_outros is
  'Usa outras ferramentas além de IA e n8n.';

-- O checkbox antigo era só "Usa IA". Conserva o sinal no novo recorte.
update public.projects
set uses_ai_tradicional = true
where uses_ai is true
  and coalesce(uses_ai_tradicional, false) is false
  and coalesce(uses_ai_generativa, false) is false;

-- Objetivo/contexto e tempo de desenvolvimento também renovam o semáforo.
create or replace function public.bump_last_activity()
returns trigger language plpgsql as $$
begin
  if (new.stage             is distinct from old.stage)
  or (new.description       is distinct from old.description)
  or (new.objetivo_contexto is distinct from old.objetivo_contexto)
  or (new.notes             is distinct from old.notes)
  or (new.links             is distinct from old.links)
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
