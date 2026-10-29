-- =============================================================================
-- Diretoria da iniciativa passa a ser a da área, no portfólio inteiro.
--
-- A 0019 já ligou areas.diretoria_id. O acompanhamento e o cadastro ainda
-- leem projects.directorate, e esse texto livre misturou nome de pessoa
-- (Bruno Capobianco, Adrielle Gritten…) com grafia antiga (CONTROLADORIA,
-- Dir. de Pessoas). Esta migration regrava o texto com o nome canônico da
-- diretoria da área.
--
-- A área operacional não muda de nome. O semáforo (last_activity_at) e o
-- updated_at não se movem: os triggers de atividade ficam desligados só
-- durante o UPDATE das iniciativas. Idempotente.
-- =============================================================================

insert into public.areas (name, is_real_area)
values ('TI', true)
on conflict (name) do nothing;

update public.areas a
set diretoria_id = d.id
from (
  values
    ('Comercial PF', 'adquirencia-marketplace'),
    ('Fraudes', 'tecnologia-informacao'),
    ('Crédito PF', 'credito-cobranca'),
    ('Credenciamento', 'adquirencia-marketplace'),
    ('Jurídico', 'recursos-humanos'),
    ('Compras, Manutenção e Zeladoria', 'recursos-humanos'),
    ('Private Label', 'vendas-varejo-expansao'),
    ('DHO', 'recursos-humanos'),
    ('RH', 'recursos-humanos'),
    ('Cobrança', 'credito-cobranca'),
    ('Seguros', 'seguros'),
    ('Pós Vendas - Private Label', 'pos-vendas-private-label'),
    ('Departamento Controladoria - Riscos', 'controladoria'),
    ('Produtos Financeiros', 'tesouraria-captacao'),
    ('Comercial PJ', 'comercial-pj'),
    ('Financeiro / Contas a Receber', 'controladoria'),
    ('Atendimento', 'operacoes-atendimento'),
    ('Departamento Controladoria - Controladoria', 'controladoria'),
    ('Operações', 'operacoes-atendimento'),
    ('Consignado', 'consignado'),
    ('Crédito PJ', 'credito-cobranca'),
    ('Portfólio Projetos Estratégicos', 'tecnologia-informacao'),
    ('Financeiro - Tesouraria', 'tesouraria-captacao'),
    ('Departamento Controladoria - Carteiras e Regulatórios', 'controladoria'),
    ('Banco PJ', 'comercial-pj'),
    ('Frota', 'recursos-humanos'),
    ('TI', 'tecnologia-informacao'),
    ('Departamento Controladoria - Fiscal', 'controladoria'),
    ('Marketplace', 'adquirencia-marketplace'),
    ('Marketing', 'adquirencia-marketplace'),
    ('Departamento Controladoria - Contabilidade', 'controladoria'),
    ('Compliance', 'recursos-humanos')
) as mapa(area_nome, slug)
join public.diretorias d on d.slug = mapa.slug
where a.name = mapa.area_nome
  and a.diretoria_id is distinct from d.id;

update public.areas a
set directorate = d.name
from public.diretorias d
where a.diretoria_id = d.id
  and a.directorate is distinct from d.name;

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

-- Área ligada manda. Sem área, o texto livre entra se for alias ou nome
-- antigo já conhecido pela diretoria.
update public.projects p
set directorate = src.nova
from (
  select
    p2.id,
    coalesce(
      d_area.name,
      (
        select d.name
        from public.diretorias d
        cross join lateral unnest(coalesce(d.aliases, '{}'::text[]) || array[d.name]) as alias
        where public.normalizar_diretoria(alias) = public.normalizar_diretoria(p2.directorate)
        order by d.sort_order
        limit 1
      ),
      (
        select d.name
        from public.area_aliases al
        join public.areas ac on ac.id = al.area_id
        join public.diretorias d on d.id = ac.diretoria_id
        where public.normalizar_diretoria(al.alias) = public.normalizar_diretoria(p2.directorate)
        order by d.sort_order
        limit 1
      )
    ) as nova
  from public.projects p2
  left join public.areas a on a.id = p2.area_id
  left join public.diretorias d_area on d_area.id = a.diretoria_id
) src
where p.id = src.id
  and src.nova is not null
  and p.directorate is distinct from src.nova;

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
