-- =============================================================================
-- Ranking de colaboradores (dashboard)
--
-- A RLS de attendance só libera a própria linha (ou admin). O consolidado
-- de presença dos últimos 3 meses precisa aparecer no ranking do time, então
-- esta view NÃO usa security_invoker — o mesmo padrão de v_attendance_kpis.
-- Expõe só contagem por pessoa, nunca o encontro a encontro.
-- Idempotente: pode ser reexecutada.
-- =============================================================================

create or replace view public.v_presenca_recente as
select
  a.user_id,
  count(*) filter (where a.status = 'present') as presentes_3m,
  count(*) as convites_3m
from public.attendance a
join public.meetings m on m.id = a.meeting_id
where m.scheduled_at >= (now() - interval '3 months')
  and m.scheduled_at <= now()
group by a.user_id;

comment on view public.v_presenca_recente is
  'Presença agregada nos encontros dos últimos 3 meses, para o índice de colaboração. '
  'Sem security_invoker de propósito: a RLS de attendance esconde o consolidado do time. '
  'Não expõe qual encontro cada pessoa confirmou.';

grant select on public.v_presenca_recente to authenticated;
