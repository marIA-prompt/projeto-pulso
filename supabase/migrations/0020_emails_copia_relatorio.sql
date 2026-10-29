-- Cópias opcionais do relatório mensal.
-- O n8n relê o Supabase no dia 1 e no disparo manual, então a cópia
-- precisa estar na coleção — não só no corpo do webhook.

alter table public.diretorias
  add column if not exists emails_copia text[] not null default '{}';

comment on column public.diretorias.emails_copia is
  'Endereços em cópia (CC) do e-mail W6. Vazio = ninguém em cópia.';

grant update (emails_copia) on public.diretorias to authenticated;

create or replace function public.relatorio_mensal_envio(
  p_ano integer default null,
  p_mes integer default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  agora timestamptz := now();
  ano integer;
  mes integer;
  inicio timestamptz;
  fim timestamptz;
  referencia timestamptz;
  rotulo text;
  resultado jsonb;
begin
  if p_ano is null or p_mes is null or p_mes < 1 or p_mes > 12 then
    ano := extract(year from (timezone('America/Sao_Paulo', agora) - interval '1 month'))::integer;
    mes := extract(month from (timezone('America/Sao_Paulo', agora) - interval '1 month'))::integer;
  else
    ano := p_ano;
    mes := p_mes;
  end if;

  inicio := make_timestamptz(ano, mes, 1, 0, 0, 0, 'America/Sao_Paulo');
  fim := inicio + interval '1 month';
  referencia := least(agora, fim - interval '1 millisecond');
  rotulo := (array[
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ])[mes] || ' de ' || ano::text;

  with periodo as (
    select inicio as inicio, fim as fim, referencia as referencia
  ),
  chaves as (
    select d.id, public.normalizar_diretoria(d.name) as chave
    from public.diretorias d
    union
    select d.id, public.normalizar_diretoria(alias) as chave
    from public.diretorias d
    cross join lateral unnest(d.aliases) as alias
  ),
  classificadas as (
    select
      p.title,
      p.stage::text as stage,
      a.name as area_name,
      case
        when p.owner_id is null then 'Sem proprietário'
        when nullif(btrim(pr.full_name), '') is null then 'Sem nome'
        else pr.full_name
      end as owner_name,
      p.hours_saved_month,
      p.cost_saved_month,
      p.created_at,
      p.last_activity_at,
      p.concluded_at,
      p.stage as stage_enum,
      coalesce(p.is_legacy_import, false) as legacy,
      (
        coalesce(p.uses_ai, false)
        or coalesce(p.uses_ai_tradicional, false)
        or coalesce(p.uses_ai_generativa, false)
      ) as usa_ia,
      coalesce(
        a.diretoria_id,
        (
          select c.id from chaves c
          where nullif(btrim(p.directorate), '') is not null
            and c.chave = public.normalizar_diretoria(p.directorate)
          limit 1
        )
      ) as diretoria_resolvida,
      (
        not coalesce(p.is_legacy_import, false)
        and p.created_at >= per.inicio
        and p.created_at < per.fim
      ) as criada,
      (
        p.last_activity_at >= per.inicio
        and p.last_activity_at < per.fim
        and not (p.created_at >= per.inicio and p.created_at < per.fim)
      ) as atualizada,
      (
        p.stage = 'concluido'
        and p.concluded_at >= per.inicio
        and p.concluded_at < per.fim
      ) as concluida_no_mes,
      (
        p.stage not in ('concluido', 'cancelado')
        and (
          (per.referencia at time zone 'America/Sao_Paulo')::date
          - (p.last_activity_at at time zone 'America/Sao_Paulo')::date
        ) > 14
      ) as alerta
    from public.projects p
    cross join periodo per
    left join public.areas a on a.id = p.area_id
    left join public.profiles pr on pr.id = p.owner_id
    where p.archived_at is null
  )
  select coalesce(jsonb_agg(item.obj order by item.sort_order), '[]'::jsonb)
    into resultado
  from (
    select
      d.sort_order,
      jsonb_build_object(
        'slug', d.slug,
        'nome', d.name,
        'diretor_nome', d.diretor_nome,
        'diretor_email', d.diretor_email,
        'emails_copia', to_jsonb(coalesce(d.emails_copia, '{}'::text[])),
        'copia', coalesce(array_to_string(d.emails_copia, ', '), ''),
        'rotulo', rotulo,
        'ano', ano,
        'mes', mes,
        'metricas', jsonb_build_object(
          'iniciativas', count(c.title),
          'ativas', count(c.title) filter (where c.stage_enum not in ('concluido', 'cancelado')),
          'concluidas', count(c.title) filter (where c.stage_enum = 'concluido'),
          'canceladas', count(c.title) filter (where c.stage_enum = 'cancelado'),
          'criadas_no_mes', count(c.title) filter (where c.criada),
          'atualizadas_no_mes', count(c.title) filter (where c.atualizada),
          'concluidas_no_mes', count(c.title) filter (where c.concluida_no_mes),
          'em_alerta', count(c.title) filter (where c.alerta),
          'com_ia', count(c.title) filter (where c.usa_ia),
          'com_horas', count(c.title) filter (where c.hours_saved_month is not null),
          'com_valor', count(c.title) filter (where c.cost_saved_month is not null)
        ),
        'ganhos', jsonb_build_object(
          'horas_devolvidas_mes', coalesce(round(sum(c.hours_saved_month) filter (where c.stage_enum = 'concluido'), 2), 0),
          'horas_portfolio', coalesce(round(sum(c.hours_saved_month), 2), 0),
          'horas_criadas', coalesce(round(sum(c.hours_saved_month) filter (where c.criada), 2), 0),
          'horas_atualizadas', coalesce(round(sum(c.hours_saved_month) filter (where c.atualizada), 2), 0),
          'horas_concluidas_no_mes', coalesce(round(sum(c.hours_saved_month) filter (where c.concluida_no_mes), 2), 0)
        ),
        'valor', jsonb_build_object(
          'mensal_realizado', coalesce(round(sum(c.cost_saved_month) filter (where c.stage_enum = 'concluido'), 2), 0),
          'anual_realizado', coalesce(round(sum(c.cost_saved_month) filter (where c.stage_enum = 'concluido') * 12, 2), 0),
          'mensal_criadas', coalesce(round(sum(c.cost_saved_month) filter (where c.criada), 2), 0),
          'mensal_atualizadas', coalesce(round(sum(c.cost_saved_month) filter (where c.atualizada), 2), 0),
          'mensal_movimento', coalesce(round(
            coalesce(sum(c.cost_saved_month) filter (where c.criada), 0)
            + coalesce(sum(c.cost_saved_month) filter (where c.atualizada), 0)
          , 2), 0),
          'mensal_concluidas_no_mes', coalesce(round(sum(c.cost_saved_month) filter (where c.concluida_no_mes), 2), 0)
        ),
        'criadas', coalesce((
          select jsonb_agg(jsonb_build_object(
            'title', x.title,
            'stage', x.stage,
            'area_name', x.area_name,
            'owner_name', x.owner_name,
            'hours_saved_month', x.hours_saved_month,
            'cost_saved_month', x.cost_saved_month,
            'created_at', x.created_at,
            'last_activity_at', x.last_activity_at
          ) order by x.created_at desc, x.title)
          from classificadas x
          where x.diretoria_resolvida = d.id and x.criada
        ), '[]'::jsonb),
        'atualizadas', coalesce((
          select jsonb_agg(jsonb_build_object(
            'title', x.title,
            'stage', x.stage,
            'area_name', x.area_name,
            'owner_name', x.owner_name,
            'hours_saved_month', x.hours_saved_month,
            'cost_saved_month', x.cost_saved_month,
            'created_at', x.created_at,
            'last_activity_at', x.last_activity_at
          ) order by x.last_activity_at desc, x.title)
          from classificadas x
          where x.diretoria_resolvida = d.id and x.atualizada
        ), '[]'::jsonb)
      ) as obj
    from public.diretorias d
    left join classificadas c on c.diretoria_resolvida = d.id
    group by d.id, d.slug, d.name, d.sort_order, d.diretor_nome, d.diretor_email, d.emails_copia
  ) as item;

  return resultado;
end;
$$;

comment on function public.relatorio_mensal_envio(integer, integer) is
  'Relatório mensal por diretoria para o n8n, com a cópia opcional. Service role via POST /rest/v1/rpc/relatorio_mensal_envio.';

revoke all on function public.relatorio_mensal_envio(integer, integer) from public;
revoke all on function public.relatorio_mensal_envio(integer, integer) from anon, authenticated;
grant execute on function public.relatorio_mensal_envio(integer, integer) to service_role;
