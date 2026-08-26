-- Triagem e gestão da auditoria Lei do Bem.
-- A classificação replica o questionário validado pelo time de PD&I.

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
  triagem_indice_aderencia numeric(4,2)
    check (triagem_indice_aderencia between 0 and 1),
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

comment on table public.lei_do_bem_avaliacoes is
  'Pré-análise interna da Lei do Bem. A classificação é sinalização preliminar '
  'e nunca substitui validação técnica, fiscal, contábil e documental.';

create index if not exists lei_do_bem_status_idx
  on public.lei_do_bem_avaliacoes (status);
create index if not exists lei_do_bem_classificacao_idx
  on public.lei_do_bem_avaliacoes (triagem_classificacao);
create index if not exists lei_do_bem_responsavel_idx
  on public.lei_do_bem_avaliacoes (responsavel_auditoria_id);

create or replace function public.classificar_triagem_lei_do_bem()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_respostas public.lei_do_bem_resposta[];
  v_preenchidas integer;
  v_sim integer;
  v_parcialmente integer;
  v_indice numeric(4,2);
  v_tem_bloqueio boolean;
  v_sintese text;
begin
  v_respostas := array[
    new.triagem_01, new.triagem_02, new.triagem_03, new.triagem_04,
    new.triagem_05, new.triagem_06, new.triagem_07, new.triagem_08,
    new.triagem_09, new.triagem_10, new.triagem_11, new.triagem_12
  ];

  if tg_op = 'UPDATE' and v_respostas is not distinct from array[
    old.triagem_01, old.triagem_02, old.triagem_03, old.triagem_04,
    old.triagem_05, old.triagem_06, old.triagem_07, old.triagem_08,
    old.triagem_09, old.triagem_10, old.triagem_11, old.triagem_12
  ] then
    new.triagem_classificacao := old.triagem_classificacao;
    new.triagem_indice_aderencia := old.triagem_indice_aderencia;
    new.triagem_sintese := old.triagem_sintese;
    new.triagem_atualizada_em := old.triagem_atualizada_em;
    return new;
  end if;

  select count(*) filter (where resposta is not null),
         count(*) filter (where resposta = 'sim'),
         count(*) filter (where resposta = 'parcialmente')
    into v_preenchidas, v_sim, v_parcialmente
  from unnest(v_respostas) as resposta;

  new.triagem_atualizada_em := now();

  if v_preenchidas < 12 then
    new.triagem_classificacao := 'pendente';
    new.triagem_indice_aderencia := null;
    new.triagem_sintese := 'Preencha todas as respostas para gerar a síntese.';
    return new;
  end if;

  v_indice := round((v_sim * 2 + v_parcialmente) / 24.0, 2);
  new.triagem_indice_aderencia := v_indice;

  if 'nao_sei' = any(v_respostas) then
    new.triagem_classificacao := 'informacoes_insuficientes';
    new.triagem_sintese :=
      'Há respostas marcadas como Não sei. Esclareça esses itens antes de concluir a triagem.';
    return new;
  end if;

  v_tem_bloqueio :=
    new.triagem_03 = 'nao' or new.triagem_04 = 'nao'
    or new.triagem_05 = 'nao' or new.triagem_06 = 'nao'
    or new.triagem_09 = 'nao' or new.triagem_10 = 'nao'
    or new.triagem_11 = 'nao';

  if v_tem_bloqueio or v_indice < 0.5 then
    new.triagem_classificacao := 'baixo_potencial';
  elsif v_indice < 0.75 then
    new.triagem_classificacao := 'potencial_parcial';
  else
    new.triagem_classificacao := 'potencialmente_elegivel';
  end if;

  select string_agg(frase, ' ' order by numero)
    into v_sintese
  from (values
    (1, new.triagem_01, 'Objetivo estratégico, necessidade ou oportunidade não demonstrados.'),
    (2, new.triagem_02, 'Problema atual ou público afetado não definidos.'),
    (3, new.triagem_03, 'Desenvolvimento ou alteração relevante não demonstrados.'),
    (4, new.triagem_04, 'Novidade ou ganho técnico/tecnológico relevante não demonstrado.'),
    (5, new.triagem_05, 'Incerteza técnica não demonstrada.'),
    (6, new.triagem_06, 'Hipóteses, testes, protótipos, experimentos ou validações técnicas não previstos.'),
    (7, new.triagem_07, 'Planejamento, acompanhamento e documentação por etapas não previstos.'),
    (8, new.triagem_08, 'Reprodutibilidade, transferência ou reaproveitamento não demonstrados.'),
    (9, new.triagem_09, 'Desenvolvimento experimental não separado de implantação ou rotina.'),
    (10, new.triagem_10, 'Os desafios aparentam ser apenas de prazo, custo ou gestão.'),
    (11, new.triagem_11, 'O projeto aparenta limitar-se a solução pronta.'),
    (12, new.triagem_12, 'Registros de atividades, horas, testes, decisões e gastos não previstos.')
  ) as negativas(numero, resposta, frase)
  where resposta = 'nao';

  new.triagem_sintese := coalesce(
    v_sintese,
    'As respostas não indicam bloqueios críticos. A elegibilidade final ainda depende de validação técnica, fiscal, contábil e documental.'
  );
  return new;
end;
$$;

drop trigger if exists lei_do_bem_classificar on public.lei_do_bem_avaliacoes;
create trigger lei_do_bem_classificar
  before insert or update on public.lei_do_bem_avaliacoes
  for each row execute function public.classificar_triagem_lei_do_bem();

drop trigger if exists lei_do_bem_touch on public.lei_do_bem_avaliacoes;
create trigger lei_do_bem_touch
  before update on public.lei_do_bem_avaliacoes
  for each row execute function public.touch_updated_at();

-- Proprietários podem manter a triagem; somente gerencial+ altera a gestão
-- da auditoria. O serviço administrativo (auth.uid() nulo) continua apto a
-- operar cargas e a futura sincronização do ClickUp.
create or replace function public.proteger_gestao_lei_do_bem()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.has_role_at_least('gerencial')
     and (
       new.status is distinct from old.status
       or new.responsavel_auditoria_id is distinct from old.responsavel_auditoria_id
       or new.parecer is distinct from old.parecer
       or new.prioridade is distinct from old.prioridade
       or new.enviar_clickup is distinct from old.enviar_clickup
       or new.clickup_sincronizado_em is distinct from old.clickup_sincronizado_em
     ) then
    raise exception 'Apenas o time gerencial pode alterar a gestão da auditoria Lei do Bem.';
  end if;
  return new;
end;
$$;

drop trigger if exists lei_do_bem_proteger_gestao on public.lei_do_bem_avaliacoes;
create trigger lei_do_bem_proteger_gestao
  before update on public.lei_do_bem_avaliacoes
  for each row execute function public.proteger_gestao_lei_do_bem();

alter table public.lei_do_bem_avaliacoes enable row level security;

drop policy if exists lei_do_bem_read on public.lei_do_bem_avaliacoes;
create policy lei_do_bem_read on public.lei_do_bem_avaliacoes
  for select to authenticated using (true);

drop policy if exists lei_do_bem_insert on public.lei_do_bem_avaliacoes;
create policy lei_do_bem_insert on public.lei_do_bem_avaliacoes
  for insert to authenticated with check (
    public.has_role_at_least('gerencial')
    or exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.owner_id = auth.uid()
        and public.has_role_at_least('participante')
    )
  );

drop policy if exists lei_do_bem_update on public.lei_do_bem_avaliacoes;
create policy lei_do_bem_update on public.lei_do_bem_avaliacoes
  for update to authenticated
  using (
    public.has_role_at_least('gerencial')
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    public.has_role_at_least('gerencial')
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists lei_do_bem_delete on public.lei_do_bem_avaliacoes;
create policy lei_do_bem_delete on public.lei_do_bem_avaliacoes
  for delete to authenticated using (
    public.has_role_at_least('gerencial')
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

-- A Matriz de Priorização saiu do cadastro. Sem os quatro campos no fluxo,
-- o gate antigo tornaria impossível criar uma iniciativa diretamente em
-- desenvolvimento. Os scores legados permanecem para leitura histórica.
drop trigger if exists projects_stage_gate on public.projects;
