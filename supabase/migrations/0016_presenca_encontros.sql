-- =============================================================================
-- Presença por encontro (scorecard / Rankings)
--
-- O placar recorta o índice de colaboração pelo período escolhido. A view
-- agregada v_presenca_recente cobre só os últimos 3 meses; esta lista o
-- encontro a encontro (user + data + status) para o cliente filtrar.
-- Sem security_invoker: a RLS de attendance só libera a própria linha.
-- Não expõe título nem id do encontro.
-- Idempotente: pode ser reexecutada.
-- =============================================================================

create or replace view public.v_presenca_encontros as
select
  a.user_id,
  m.scheduled_at,
  a.status
from public.attendance a
join public.meetings m on m.id = a.meeting_id;

comment on view public.v_presenca_encontros is
  'Presença por encontro (user, data, status) para o scorecard recortar o período. '
  'Sem security_invoker de propósito: a RLS de attendance esconde o consolidado do time. '
  'Não expõe qual reunião era.';

grant select on public.v_presenca_encontros to authenticated;
