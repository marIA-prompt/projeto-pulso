-- Lei do Bem: dados técnicos separados da iniciativa e triagem preliminar.

do $$ begin
  create type public.lei_do_bem_status as enum (
    'backlog', 'em_avaliacao_interna', 'enquadrado', 'nao_enquadrado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lei_do_bem_resposta as enum ('sim', 'parcialmente', 'nao', 'nao_sei');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lei_do_bem_classificacao as enum (
    'pendente', 'informacoes_insuficientes', 'baixo_potencial',
    'potencial_parcial', 'potencialmente_elegivel'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lei_do_bem_prioridade as enum ('baixa', 'media', 'alta');
exception when duplicate_object then null; end $$;

create table if not exists public.lei_do_bem_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,

  objetivo_estrategico_okr text,
  contexto_problema text,
  o_que_sera_desenvolvido text,
  resultados_esperados text,
  como_sera_desenvolvido text,
  fora_do_escopo text,
  desafios_riscos text,

  descricao_projeto text,
  elemento_tecnologico_novo text,
  barreira_desafio_tecnologico text,
  metodologia_metodos text,
  descritivo_complementar text,

  triagem_01 public.lei_do_bem_resposta,
  triagem_02 public.lei_do_bem_resposta,
  triagem_03 public.lei_do_bem_resposta,
  triagem_04 public.lei_do_bem_resposta,
  triagem_05 public.lei_do_bem_resposta,
  triagem_06 public.lei_do_bem_resposta,
  triagem_07 public.lei_do_bem_resposta,
  triagem_08 public.lei_do_bem_resposta,
  triagem_09 public.lei_do_bem_resposta,
  triagem_10 public.lei_do_bem_resposta,
  triagem_11 public.lei_do_bem_resposta,
  triagem_12 public.lei_do_bem_resposta,
  triagem_classificacao public.lei_do_bem_classificacao not null default 'pendente',
  triagem_indice_aderencia numeric(4,2),
  triagem_sintese text not null default 'Preencha todas as respostas para gerar a síntese.',
  triagem_atualizada_em timestamptz,

  status public.lei_do_bem_status not null default 'backlog',
  responsavel_auditoria_id uuid references public.profiles(id),
  parecer text,
  prioridade public.lei_do_bem_prioridade,
  enviar_clickup boolean not null default false,
  clickup_sincronizado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lei_do_bem_status_idx on public.lei_do_bem_avaliacoes(status);
create index if not exists lei_do_bem_classificacao_idx on public.lei_do_bem_avaliacoes(triagem_classificacao);
create index if not exists lei_do_bem_responsavel_idx on public.lei_do_bem_avaliacoes(responsavel_auditoria_id);

create or replace function public.calcular_triagem_lei_do_bem()
returns trigger language plpgsql as $$
declare
  respostas public.lei_do_bem_resposta[];
  v_respondidas integer;
  v_sim integer;
  v_parcial integer;
  v_indice numeric(4,2);
  v_tem_nao boolean;
  v_bloqueio boolean;
begin
  respostas := array[
    new.triagem_01, new.triagem_02, new.triagem_03, new.triagem_04,
    new.triagem_05, new.triagem_06, new.triagem_07, new.triagem_08,
    new.triagem_09, new.triagem_10, new.triagem_11, new.triagem_12
  ];
  v_respondidas := cardinality(array_remove(respostas, null));
  new.triagem_atualizada_em := now();

  if v_respondidas < 12 then
    new.triagem_classificacao := 'pendente';
    new.triagem_indice_aderencia := null;
    new.triagem_sintese := 'Preencha todas as respostas para gerar a síntese.';
    return new;
  end if;

  if 'nao_sei'::public.lei_do_bem_resposta = any(respostas) then
    new.triagem_classificacao := 'informacoes_insuficientes';
    new.triagem_indice_aderencia := null;
    new.triagem_sintese := 'Há respostas marcadas como Não sei. Esclareça esses itens antes de concluir a triagem.';
    return new;
  end if;

  v_sim := coalesce(cardinality(array_positions(respostas, 'sim'::public.lei_do_bem_resposta)), 0);
  v_parcial := coalesce(cardinality(array_positions(respostas, 'parcialmente'::public.lei_do_bem_resposta)), 0);
  v_indice := round((v_sim * 2 + v_parcial)::numeric / 24, 2);
  new.triagem_indice_aderencia := v_indice;
  v_bloqueio := new.triagem_03 = 'nao' or new.triagem_04 = 'nao'
    or new.triagem_05 = 'nao' or new.triagem_06 = 'nao'
    or new.triagem_09 = 'nao' or new.triagem_10 = 'nao' or new.triagem_11 = 'nao';
  v_tem_nao := 'nao'::public.lei_do_bem_resposta = any(respostas);

  new.triagem_classificacao := case
    when v_bloqueio or v_indice < .5 then 'baixo_potencial'
    when v_indice < .75 then 'potencial_parcial'
    else 'potencialmente_elegivel'
  end;

  if not v_tem_nao then
    new.triagem_sintese := 'As respostas não indicam bloqueios críticos. A elegibilidade final ainda depende de validação técnica, fiscal, contábil e documental.';
  else
    new.triagem_sintese := concat_ws(' ',
      case when new.triagem_01 = 'nao' then 'Objetivo estratégico, necessidade ou oportunidade não demonstrados.' end,
      case when new.triagem_02 = 'nao' then 'Problema atual ou público afetado não definidos.' end,
      case when new.triagem_03 = 'nao' then 'Desenvolvimento ou alteração relevante não demonstrados.' end,
      case when new.triagem_04 = 'nao' then 'Novidade ou ganho técnico-tecnológico não demonstrados.' end,
      case when new.triagem_05 = 'nao' then 'Incerteza técnica não demonstrada.' end,
      case when new.triagem_06 = 'nao' then 'Hipóteses, testes ou validações técnicas não demonstrados.' end,
      case when new.triagem_07 = 'nao' then 'Planejamento e documentação por etapas não demonstrados.' end,
      case when new.triagem_08 = 'nao' then 'Reprodutibilidade, transferência ou reaproveitamento não demonstrados.' end,
      case when new.triagem_09 = 'nao' then 'Desenvolvimento experimental não separado de atividades rotineiras.' end,
      case when new.triagem_10 = 'nao' then 'Desafios técnicos ou tecnológicos não demonstrados.' end,
      case when new.triagem_11 = 'nao' then 'O projeto aparenta limitar-se a solução pronta.' end,
      case when new.triagem_12 = 'nao' then 'Registros de atividades, horas, testes, decisões e gastos não demonstrados.' end
    );
  end if;
  return new;
end $$;

drop trigger if exists lei_do_bem_calcular_triagem on public.lei_do_bem_avaliacoes;
create trigger lei_do_bem_calcular_triagem
  before insert or update of triagem_01, triagem_02, triagem_03, triagem_04, triagem_05, triagem_06,
    triagem_07, triagem_08, triagem_09, triagem_10, triagem_11, triagem_12
  on public.lei_do_bem_avaliacoes
  for each row execute function public.calcular_triagem_lei_do_bem();

drop trigger if exists lei_do_bem_touch on public.lei_do_bem_avaliacoes;
create trigger lei_do_bem_touch before update on public.lei_do_bem_avaliacoes
  for each row execute function public.touch_updated_at();

create or replace function public.guard_lei_do_bem_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role_at_least('gerencial')
    and (
      new.status is distinct from old.status
      or new.responsavel_auditoria_id is distinct from old.responsavel_auditoria_id
      or new.parecer is distinct from old.parecer
      or new.prioridade is distinct from old.prioridade
      or new.enviar_clickup is distinct from old.enviar_clickup
      or new.clickup_sincronizado_em is distinct from old.clickup_sincronizado_em
    ) then
    raise exception 'Apenas o perfil gerencial ou administrador pode alterar a auditoria Lei do Bem.';
  end if;
  return new;
end $$;

drop trigger if exists lei_do_bem_guard_auditoria on public.lei_do_bem_avaliacoes;
create trigger lei_do_bem_guard_auditoria
  before update on public.lei_do_bem_avaliacoes
  for each row execute function public.guard_lei_do_bem_auditoria();

alter table public.lei_do_bem_avaliacoes enable row level security;
create policy lei_do_bem_read on public.lei_do_bem_avaliacoes
  for select to authenticated using (true);
create policy lei_do_bem_create on public.lei_do_bem_avaliacoes
  for insert to authenticated with check (public.has_role_at_least('participante'));
create policy lei_do_bem_owner_update on public.lei_do_bem_avaliacoes
  for update to authenticated
  using (
    public.has_role_at_least('gerencial')
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  )
  with check (
    public.has_role_at_least('gerencial')
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );
create policy lei_do_bem_owner_delete on public.lei_do_bem_avaliacoes
  for delete to authenticated
  using (
    public.has_role_at_least('gerencial')
    or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- A Matriz deixou de fazer parte do cadastro. O score legado fica preservado
-- para leituras históricas, mas não pode impedir a criação/movimentação atual.
create or replace function public.enforce_stage_gate()
returns trigger language plpgsql as $$
begin
  return new;
end $$;
