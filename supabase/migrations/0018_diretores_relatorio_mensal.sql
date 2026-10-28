-- =============================================================================
-- Diretores do relatório mensal e a função que o n8n lê via API do Supabase.
--
-- Lista fechada com a diretoria. Jurídico e Compliance ficam dentro de RH.
-- "Área Diretora de Vendas Varejo Expansão" sai: não há diretor nessa coleção.
-- O e-mail fica nulo até alguém gravar — o fluxo n8n pula diretoria sem e-mail.
-- =============================================================================

alter table public.diretorias
  add column if not exists diretor_nome text,
  add column if not exists diretor_email text,
  add column if not exists aliases text[] not null default '{}';

comment on column public.diretorias.diretor_nome is
  'Quem recebe o relatório mensal desta coleção.';
comment on column public.diretorias.diretor_email is
  'Destino do e-mail W6. Nulo = o fluxo n8n não envia esta diretoria.';
comment on column public.diretorias.aliases is
  'Outros nomes que caem nesta coleção quando a iniciativa só tem texto livre.';

-- Mesma régua do TypeScript (normalizarDiretoria): sem acento, sem "área"/"de".
create or replace function public.normalizar_diretoria(nome text)
returns text
language sql
immutable
as $$
  select btrim(
    regexp_replace(
      regexp_replace(
        btrim(regexp_replace(
          translate(
            lower(coalesce(nome, '')),
            'áàâãäéèêëíìîïóòôõöúùûüç',
            'aaaaaeeeeiiiiooooouuuuc'
          ),
          '[^a-z0-9]+', ' ', 'g'
        )),
        '^area ', ''
      ),
      '^de ', ''
    )
  );
$$;

update public.diretorias set name = 'Área Vendas Varejo Expansão', sort_order = 10,
  diretor_nome = 'Adriele', aliases = array['Vendas Varejo Expansão']
where slug = 'vendas-varejo-expansao';

update public.diretorias set name = 'Área Dados e Infraestrutura', sort_order = 20,
  diretor_nome = 'Alexandro Lima', aliases = array['Dados e Infraestrutura']
where slug = 'dados-infraestrutura';

update public.diretorias set name = 'Área Operações e Atendimento', sort_order = 30,
  diretor_nome = 'Bruno', aliases = array['Operações e Atendimento']
where slug = 'operacoes-atendimento';

update public.diretorias set name = 'Área Consignado', sort_order = 40,
  diretor_nome = 'Cristiano', aliases = array['Consignado']
where slug = 'consignado';

update public.diretorias set name = 'Área Tecnologia da Informação', sort_order = 50,
  diretor_nome = 'Everton', aliases = array['Tecnologia da Informação', 'TI']
where slug = 'tecnologia-informacao';

update public.diretorias set name = 'Área Pós Vendas Private Label', sort_order = 60,
  diretor_nome = 'Fernanda', aliases = array['Pós Vendas Private Label', 'Private Label']
where slug = 'pos-vendas-private-label';

update public.diretorias set name = 'Área Controladoria', sort_order = 70,
  diretor_nome = 'Jacqueline', aliases = array['Controladoria']
where slug = 'controladoria';

update public.diretorias set name = 'Área Crédito/Cobrança', sort_order = 80,
  diretor_nome = 'Genaro', aliases = array['Crédito / Cobrança', 'Crédito Cobrança']
where slug = 'credito-cobranca';

update public.diretorias set name = 'Área Comercial PJ', sort_order = 90,
  diretor_nome = 'Marcelino', aliases = array['Comercial PJ']
where slug = 'comercial-pj';

update public.diretorias set name = 'Área Adquirência e Marketplace', sort_order = 100,
  diretor_nome = 'Marco Senff', aliases = array['Adquirência e Marketplace']
where slug = 'adquirencia-marketplace';

update public.diretorias set name = 'Área de Tesouraria e Captação', sort_order = 110,
  diretor_nome = 'Mauricio Rodrigues',
  aliases = array['Tesouraria e Captação', 'Área Tesouraria e Captação', 'Tesouraria']
where slug = 'tesouraria-captacao';

update public.diretorias set name = 'Área de Processos', sort_order = 120,
  diretor_nome = 'Pollyana', aliases = array['Processos', 'Área Processos']
where slug = 'processos';

insert into public.diretorias (slug, name, sort_order, diretor_nome, aliases)
values (
  'seguros', 'Área de Seguros', 130, 'Bruna',
  array['Seguros']
)
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  diretor_nome = excluded.diretor_nome,
  aliases = excluded.aliases;

update public.diretorias set name = 'Área de RH', sort_order = 140,
  diretor_nome = 'Christian',
  aliases = array['RH', 'Recursos Humanos', 'Área Recursos Humanos']
where slug = 'recursos-humanos';

-- A coleção sem diretor não recebe e-mail.
update public.areas
set diretoria_id = null
where diretoria_id in (
  select id from public.diretorias where slug = 'diretora-vendas-varejo-expansao'
);
delete from public.diretorias where slug = 'diretora-vendas-varejo-expansao';

update public.areas a
set diretoria_id = d.id
from public.diretorias d
where d.slug = 'recursos-humanos'
  and a.name in ('RH', 'DHO', 'Jurídico', 'Compliance');

update public.areas a
set diretoria_id = d.id
from public.diretorias d
where d.slug = 'seguros'
  and a.name = 'Seguros';

-- Admin grava só o e-mail. O nome do diretor nasce nesta migration.
drop policy if exists diretorias_admin_update on public.diretorias;
create policy diretorias_admin_update on public.diretorias
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant update (diretor_email) on public.diretorias to authenticated;

-- Pacote que o n8n busca em POST /rest/v1/rpc/relatorio_mensal_envio.
-- p_ano/p_mes nulos = mês anterior em America/Sao_Paulo (o que fecha no dia 1).
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
    group by d.id, d.slug, d.name, d.sort_order, d.diretor_nome, d.diretor_email
  ) as item;

  return resultado;
end;
$$;

comment on function public.relatorio_mensal_envio(integer, integer) is
  'Relatório mensal por diretoria para o n8n. Service role via POST /rest/v1/rpc/relatorio_mensal_envio.';

revoke all on function public.relatorio_mensal_envio(integer, integer) from public;
revoke all on function public.relatorio_mensal_envio(integer, integer) from anon, authenticated;
grant execute on function public.relatorio_mensal_envio(integer, integer) to service_role;
