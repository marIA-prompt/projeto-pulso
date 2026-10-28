-- =============================================================================
-- Relatório mensal por diretoria (W6)
--
-- As coleções abaixo são as diretorias que recebem o relatório. A área
-- operacional continua em public.areas; diretoria_id diz a qual coleção ela
-- pertence. Iniciativa sem vínculo ainda pode cair na diretoria pelo texto
-- livre de projects.directorate, se o nome bater.
--
-- Mapeamento de propósito conservador: só entra área cujo nome já diz a
-- coleção. O que ficou de fora aparece no relatório "Sem diretoria vinculada"
-- em vez de ir para a diretoria errada.
-- =============================================================================

create table if not exists public.diretorias (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null unique,
  sort_order  integer not null,
  created_at  timestamptz not null default now()
);

comment on table public.diretorias is
  'Coleções do relatório mensal (W6). Uma diretoria, um relatório.';

alter table public.areas
  add column if not exists diretoria_id uuid references public.diretorias(id);

comment on column public.areas.diretoria_id is
  'Diretoria que recebe o relatório mensal desta área. Nulo = ainda sem coleção.';

create index if not exists areas_diretoria_idx on public.areas (diretoria_id);

insert into public.diretorias (slug, name, sort_order) values
  ('diretora-vendas-varejo-expansao', 'Área Diretora de Vendas Varejo Expansão', 10),
  ('vendas-varejo-expansao',          'Área Vendas Varejo Expansão', 20),
  ('dados-infraestrutura',            'Área Dados e Infraestrutura', 30),
  ('operacoes-atendimento',           'Área Operações e Atendimento', 40),
  ('consignado',                      'Área Consignado', 50),
  ('tecnologia-informacao',           'Área Tecnologia da Informação', 60),
  ('pos-vendas-private-label',        'Área Pós Vendas Private Label', 70),
  ('controladoria',                   'Área Controladoria', 80),
  ('credito-cobranca',                'Área Crédito / Cobrança', 90),
  ('comercial-pj',                    'Área Comercial PJ', 100),
  ('adquirencia-marketplace',         'Área Adquirência e Marketplace', 110),
  ('tesouraria-captacao',             'Área Tesouraria e Captação', 120),
  ('processos',                       'Área Processos', 130),
  ('recursos-humanos',                'Área Recursos Humanos', 140)
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order;

-- Vendas varejo: Comercial PF é a ponta de pessoa física.
update public.areas a
set diretoria_id = d.id
from public.diretorias d
where d.slug = 'vendas-varejo-expansao'
  and a.name = 'Comercial PF';

update public.areas a
set diretoria_id = d.id
from public.diretorias d
where d.slug = 'operacoes-atendimento'
  and a.name in ('Operações', 'Atendimento');

update public.areas a
set diretoria_id = d.id
from public.diretorias d
where d.slug = 'consignado'
  and a.name = 'Consignado';

update public.areas a
set diretoria_id = d.id
from public.diretorias d
where d.slug = 'pos-vendas-private-label'
  and a.name in ('Pós Vendas - Private Label', 'Private Label');

update public.areas a
set diretoria_id = d.id
from public.diretorias d
where d.slug = 'controladoria'
  and a.name like 'Departamento Controladoria - %';

update public.areas a
set diretoria_id = d.id
from public.diretorias d
where d.slug = 'credito-cobranca'
  and a.name in ('Crédito PF', 'Crédito PJ', 'Cobrança');

update public.areas a
set diretoria_id = d.id
from public.diretorias d
where d.slug = 'comercial-pj'
  and a.name in ('Comercial PJ', 'Banco PJ');

-- Credenciamento é a adquirência; Marketplace entra na mesma coleção.
update public.areas a
set diretoria_id = d.id
from public.diretorias d
where d.slug = 'adquirencia-marketplace'
  and a.name in ('Marketplace', 'Credenciamento');

update public.areas a
set diretoria_id = d.id
from public.diretorias d
where d.slug = 'tesouraria-captacao'
  and a.name = 'Financeiro - Tesouraria';

update public.areas a
set diretoria_id = d.id
from public.diretorias d
where d.slug = 'recursos-humanos'
  and a.name in ('RH', 'DHO');

-- De fora, de propósito: Compliance, Compras, Fraudes, Frota, Jurídico,
-- Marketing, Portfólio Projetos Estratégicos, Produtos Financeiros, Seguros,
-- Financeiro / Contas a Receber e o placeholder "Não informado".
-- Também ficam sem área pré-ligada, até alguém cadastrar o vínculo:
-- Diretora de Vendas Varejo Expansão, Dados e Infraestrutura,
-- Tecnologia da Informação e Processos.

alter table public.diretorias enable row level security;

drop policy if exists diretorias_read on public.diretorias;
create policy diretorias_read on public.diretorias
  for select to authenticated using (true);

grant select on public.diretorias to authenticated;
