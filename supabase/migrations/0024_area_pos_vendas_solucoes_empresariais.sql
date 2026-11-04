-- Área operacional nova da coleção de Pós-Venda Private Label.
--
-- O nome falado da diretoria é "Área de Pós-Venda Private Label". No banco
-- essa coleção já existe como "Área Pós Vendas Private Label"
-- (slug pos-vendas-private-label). A área entra nela, sem criar outra diretoria.
-- Idempotente.

insert into public.areas (name, is_real_area)
values ('Pós vendas Soluções Empresariais', true)
on conflict (name) do nothing;

do $$
begin
  if not exists (
    select 1 from public.diretorias where slug = 'pos-vendas-private-label'
  ) then
    raise exception 'Diretoria pos-vendas-private-label não encontrada';
  end if;
end $$;

update public.areas a
set diretoria_id = d.id,
    directorate = d.name
from (
  values
    ('Pós vendas Soluções Empresariais', 'pos-vendas-private-label')
) as mapa(area_nome, slug)
join public.diretorias d on d.slug = mapa.slug
where a.name = mapa.area_nome
  and (
    a.diretoria_id is distinct from d.id
    or a.directorate is distinct from d.name
  );

-- Texto livre da iniciativa cai na mesma coleção, inclusive a grafia falada.
do $$
declare
  extra text[] := array[
    'Pós vendas Soluções Empresariais',
    'Área de Pós-Venda Private Label'
  ];
  atual text[];
  item text;
begin
  select coalesce(aliases, '{}') into atual
  from public.diretorias
  where slug = 'pos-vendas-private-label';

  if not found then
    return;
  end if;

  foreach item in array extra loop
    if not item = any (atual) then
      atual := atual || item;
    end if;
  end loop;

  update public.diretorias
  set aliases = atual
  where slug = 'pos-vendas-private-label'
    and aliases is distinct from atual;
end $$;
