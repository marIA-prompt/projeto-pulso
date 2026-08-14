-- =============================================================================
-- Sistema Pulso — Ajustes de produto (metodologia, acompanhamento)
-- Idempotente: pode ser reexecutada.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. METODOLOGIA EXECUTIVA — remover o callout de origem (texto em amarelo)
-- -----------------------------------------------------------------------------
-- O bloco de citação no topo ("Extraído do PDF oficial (páginas 1–12)...") era
-- uma nota de bastidor de geração do documento, não conteúdo para o leitor
-- executivo. Removido do corpo publicado.
update public.content_pages
   set body_md = regexp_replace(
         body_md,
         E'> Extraído do PDF oficial[\\s\\S]*?dele\\.\\n+',
         '',
         'g'
       ),
       updated_at = now()
 where slug = 'metodologia-executiva';

-- -----------------------------------------------------------------------------
-- 2. ACOMPANHAMENTO — expor o impacto financeiro estimado no dashboard
-- -----------------------------------------------------------------------------
-- cost_saved_month já existe em projects (economia recorrente em R$). A view
-- do dashboard ainda não o expunha; a coluna nova entra ao final para não
-- quebrar o contrato de CREATE OR REPLACE VIEW.
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
  p.cost_saved_month
from public.projects p
left join public.areas a on a.id = p.area_id
where p.archived_at is null;
