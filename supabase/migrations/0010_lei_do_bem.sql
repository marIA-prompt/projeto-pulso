-- =============================================================================
-- Sistema Pulso — Lei do Bem: captação e triagem preliminar
--
-- Tabela filha 1:1 de projects. A classificação da triagem (12 itens) replica
-- as fórmulas B27–B30 da planilha Triagem_Preliminar_Lei_do_Bem_Simples.
-- A mesma lógica vive em src/lib/lei-do-bem.ts — mudou aqui, muda lá.
--
-- Idempotente: pode ser reexecutada.
-- =============================================================================

-- =============================================================================
-- 1. ENUMS
-- =============================================================================

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
    'pendente',
    'informacoes_insuficientes',
    'baixo_potencial',
    'potencial_parcial',
    'potencialmente_elegivel'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lei_do_bem_prioridade as enum ('alta', 'media', 'baixa');
exception when duplicate_object then null; end $$;


-- =============================================================================
-- 2. TABELA DE AVALIAÇÕES (1:1 com projects)
-- =============================================================================

create table if not exists public.lei_do_bem_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,

  -- Grupo 1 — Cadastro do projeto (itens 4–10 do instrumento; 1–3 já estão
  -- em projects: título, owner_id, created_at).
  objetivo_estrategico_okr text,
  contexto_problema text,
  o_que_sera_desenvolvido text,
  resultados_esperados text,
  como_sera_desenvolvido text,
  fora_do_escopo text,
  desafios_riscos text,

  -- Grupo 2 — Avaliação técnica MCTI (Guia Prático, seção 6)
  descricao_projeto text,
  elemento_tecnologico_novo text,
  barreira_desafio_tecnologico text,
  metodologia_metodos text,
  descritivo_complementar text,

  -- Grupo 3 — Questionário de triagem preliminar (12 itens)
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

  triagem_classificacao public.lei_do_bem_classificacao,
  triagem_indice_aderencia numeric(4,2),
  triagem_sintese text,
  triagem_atualizada_em timestamptz,

  -- Gestão do processo de auditoria (tela B, papel gerencial+)
  status public.lei_do_bem_status not null default 'backlog',
  responsavel_auditoria_id uuid references public.profiles(id),
  parecer text,
  prioridade public.lei_do_bem_prioridade,
  enviar_clickup boolean not null default false,
  clickup_sincronizado_em timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (project_id)
);

comment on table public.lei_do_bem_avaliacoes is
  'Pré-análise de enquadramento na Lei do Bem (11.196/2005). Uma linha por '
  'iniciativa que optou pela triagem. A classificação é preliminar e nunca '
  'impede o cadastro nem a revisão humana — só sinaliza.';

comment on column public.lei_do_bem_avaliacoes.enviar_clickup is
  'Flag de intenção. A sincronização real (N8N/API ClickUp) é a 2ª parte; '
  'clickup_sincronizado_em permanece nulo até lá.';

create index if not exists lei_do_bem_status_idx
  on public.lei_do_bem_avaliacoes (status);
create index if not exists lei_do_bem_classificacao_idx
  on public.lei_do_bem_avaliacoes (triagem_classificacao);
create index if not exists lei_do_bem_responsavel_idx
  on public.lei_do_bem_avaliacoes (responsavel_auditoria_id);


-- =============================================================================
-- 3. HISTÓRICO DE STATUS
-- =============================================================================

create table if not exists public.lei_do_bem_status_log (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references public.lei_do_bem_avaliacoes(id) on delete cascade,
  de public.lei_do_bem_status,
  para public.lei_do_bem_status not null,
  changed_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now()
);

comment on table public.lei_do_bem_status_log is
  'Transições de status da auditoria Lei do Bem. Reavaliação (ex.: não '
  'enquadrado → em avaliação interna) é permitida; o parecer anterior fica '
  'na coluna parecer da avaliação e o histórico de status fica aqui.';

create index if not exists lei_do_bem_status_log_idx
  on public.lei_do_bem_status_log (avaliacao_id, created_at);


-- =============================================================================
-- 4. CLASSIFICAÇÃO AUTOMÁTICA (B27, B28, B29)
-- =============================================================================

create or replace function public.lei_do_bem_calcular_triagem()
returns trigger language plpgsql as $$
declare
  respostas public.lei_do_bem_resposta[];
  v_preenchidas int := 0;
  v_sims int := 0;
  v_parciais int := 0;
  v_tem_nao_sei boolean := false;
  v_tem_bloqueio boolean := false;
  v_tem_nao boolean := false;
  v_indice_bruto numeric;
  v_sintese text := '';
  i int;
  respostas_mudaram boolean := false;
  frases text[] := array[
    'Vínculo estratégico, necessidade ou oportunidade não evidenciado. ',
    'Problema atual e público afetado não estão claros. ',
    'Não há desenvolvimento ou alteração relevante de produto, processo, sistema, serviço ou funcionalidade. ',
    'Não há novidade ou ganho técnico/tecnológico relevante. ',
    'Incerteza técnica não demonstrada. ',
    'O desenvolvimento não exigirá hipóteses, testes, protótipos, experimentos ou validações técnicas. ',
    'O trabalho não será planejado, acompanhado e documentado por etapas. ',
    'O conhecimento ou resultado gerado não poderá ser reproduzido, transferido ou reaproveitado. ',
    'Não é possível separar o desenvolvimento experimental das atividades rotineiras. ',
    'Os desafios ou riscos não são técnicos/tecnológicos. ',
    'O projeto aparenta limitar-se a solução pronta. ',
    'Não haverá registros de atividades, horas, testes, decisões e gastos. '
  ];
  bloqueio int[] := array[3, 4, 5, 6, 9, 10, 11];
begin
  respostas := array[
    new.triagem_01, new.triagem_02, new.triagem_03, new.triagem_04,
    new.triagem_05, new.triagem_06, new.triagem_07, new.triagem_08,
    new.triagem_09, new.triagem_10, new.triagem_11, new.triagem_12
  ];

  if TG_OP = 'INSERT' then
    respostas_mudaram := true;
  else
    respostas_mudaram :=
         new.triagem_01 is distinct from old.triagem_01
      or new.triagem_02 is distinct from old.triagem_02
      or new.triagem_03 is distinct from old.triagem_03
      or new.triagem_04 is distinct from old.triagem_04
      or new.triagem_05 is distinct from old.triagem_05
      or new.triagem_06 is distinct from old.triagem_06
      or new.triagem_07 is distinct from old.triagem_07
      or new.triagem_08 is distinct from old.triagem_08
      or new.triagem_09 is distinct from old.triagem_09
      or new.triagem_10 is distinct from old.triagem_10
      or new.triagem_11 is distinct from old.triagem_11
      or new.triagem_12 is distinct from old.triagem_12;
  end if;

  if respostas_mudaram then
    new.triagem_atualizada_em := now();
  end if;

  for i in 1..12 loop
    if respostas[i] is not null then
      v_preenchidas := v_preenchidas + 1;
      if respostas[i] = 'sim' then v_sims := v_sims + 1; end if;
      if respostas[i] = 'parcialmente' then v_parciais := v_parciais + 1; end if;
      if respostas[i] = 'nao_sei' then v_tem_nao_sei := true; end if;
      if respostas[i] = 'nao' then
        v_tem_nao := true;
        if i = any (bloqueio) then v_tem_bloqueio := true; end if;
      end if;
    end if;
  end loop;

  if v_preenchidas < 12 then
    new.triagem_classificacao := 'pendente';
    new.triagem_indice_aderencia := null;
    new.triagem_sintese := 'Preencha todas as respostas para gerar a síntese.';
    return new;
  end if;

  v_indice_bruto := ((v_sims * 2) + v_parciais)::numeric / 24;
  new.triagem_indice_aderencia := round(v_indice_bruto, 2);

  if v_tem_nao_sei then
    new.triagem_classificacao := 'informacoes_insuficientes';
    new.triagem_sintese :=
      'Há respostas marcadas como Não sei. Esclareça esses itens antes de concluir a triagem.';
    return new;
  end if;

  if v_tem_bloqueio then
    new.triagem_classificacao := 'baixo_potencial';
  elsif v_indice_bruto >= 0.75 then
    new.triagem_classificacao := 'potencialmente_elegivel';
  elsif v_indice_bruto >= 0.5 then
    new.triagem_classificacao := 'potencial_parcial';
  else
    new.triagem_classificacao := 'baixo_potencial';
  end if;

  if not v_tem_nao then
    new.triagem_sintese :=
      'As respostas não indicam bloqueios críticos. A elegibilidade final ainda depende de validação técnica, fiscal, contábil e documental.';
  else
    for i in 1..12 loop
      if respostas[i] = 'nao' then
        v_sintese := v_sintese || frases[i];
      end if;
    end loop;
    new.triagem_sintese := btrim(v_sintese);
  end if;

  return new;
end $$;

drop trigger if exists lei_do_bem_triagem on public.lei_do_bem_avaliacoes;
create trigger lei_do_bem_triagem
  before insert or update on public.lei_do_bem_avaliacoes
  for each row execute function public.lei_do_bem_calcular_triagem();

drop trigger if exists lei_do_bem_touch on public.lei_do_bem_avaliacoes;
create trigger lei_do_bem_touch before update on public.lei_do_bem_avaliacoes
  for each row execute function public.touch_updated_at();


-- =============================================================================
-- 5. LOG DE STATUS + GUARDA DE CAMPOS DE AUDITORIA
-- =============================================================================

create or replace function public.lei_do_bem_log_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.lei_do_bem_status_log (avaliacao_id, de, para, changed_by)
    values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.lei_do_bem_status_log (avaliacao_id, de, para, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists lei_do_bem_status_log_tg on public.lei_do_bem_avaliacoes;
create trigger lei_do_bem_status_log_tg
  after insert or update of status on public.lei_do_bem_avaliacoes
  for each row execute function public.lei_do_bem_log_status();

-- Dono da iniciativa edita Grupos 1–3; só gerencial+ mexe em status, parecer,
-- responsável, prioridade e o toggle ClickUp. Recálculo silencioso da triagem
-- (mesmo depois de sair de backlog) é permitido — a planilha original era
-- preenchida uma vez, mas no Pulso o cadastro pode ser reaberto.
create or replace function public.lei_do_bem_guard_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'UPDATE' and not public.has_role_at_least('gerencial') then
    if new.status is distinct from old.status
    or new.responsavel_auditoria_id is distinct from old.responsavel_auditoria_id
    or new.parecer is distinct from old.parecer
    or new.prioridade is distinct from old.prioridade
    or new.enviar_clickup is distinct from old.enviar_clickup
    or new.clickup_sincronizado_em is distinct from old.clickup_sincronizado_em
    then
      raise exception 'Apenas gerencial ou administrador altera a auditoria da Lei do Bem.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists lei_do_bem_guard on public.lei_do_bem_avaliacoes;
create trigger lei_do_bem_guard
  before update on public.lei_do_bem_avaliacoes
  for each row execute function public.lei_do_bem_guard_auditoria();


-- =============================================================================
-- 6. RLS
-- =============================================================================

alter table public.lei_do_bem_avaliacoes enable row level security;
alter table public.lei_do_bem_status_log enable row level security;

drop policy if exists lei_do_bem_read on public.lei_do_bem_avaliacoes;
create policy lei_do_bem_read on public.lei_do_bem_avaliacoes
  for select to authenticated using (true);

-- Quem cadastra iniciativa (participante+) também grava a triagem, inclusive
-- quando o owner_id é outra pessoa — o mesmo teto de projects_insert (0009).
drop policy if exists lei_do_bem_insert on public.lei_do_bem_avaliacoes;
create policy lei_do_bem_insert on public.lei_do_bem_avaliacoes
  for insert to authenticated
  with check (public.has_role_at_least('participante'));

drop policy if exists lei_do_bem_update on public.lei_do_bem_avaliacoes;
create policy lei_do_bem_update on public.lei_do_bem_avaliacoes
  for update to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.has_role_at_least('gerencial'))
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.has_role_at_least('gerencial'))
    )
  );

drop policy if exists lei_do_bem_delete on public.lei_do_bem_avaliacoes;
create policy lei_do_bem_delete on public.lei_do_bem_avaliacoes
  for delete to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.has_role_at_least('gerencial'))
    )
  );

drop policy if exists lei_do_bem_log_read on public.lei_do_bem_status_log;
create policy lei_do_bem_log_read on public.lei_do_bem_status_log
  for select to authenticated using (true);


-- =============================================================================
-- 7. VIEW DE LISTAGEM
-- =============================================================================

create or replace view public.v_lei_do_bem as
select
  a.id,
  a.project_id,
  p.title,
  p.directorate,
  p.area_id,
  ar.name as area_name,
  p.owner_id,
  po.full_name as owner_name,
  a.status,
  a.triagem_classificacao,
  a.triagem_indice_aderencia,
  a.triagem_sintese,
  a.triagem_atualizada_em,
  a.responsavel_auditoria_id,
  ra.full_name as responsavel_auditoria_nome,
  ra.avatar_url as responsavel_auditoria_avatar,
  a.parecer,
  a.prioridade,
  a.enviar_clickup,
  a.clickup_sincronizado_em,
  a.objetivo_estrategico_okr,
  a.contexto_problema,
  a.o_que_sera_desenvolvido,
  a.resultados_esperados,
  a.como_sera_desenvolvido,
  a.fora_do_escopo,
  a.desafios_riscos,
  a.descricao_projeto,
  a.elemento_tecnologico_novo,
  a.barreira_desafio_tecnologico,
  a.metodologia_metodos,
  a.descritivo_complementar,
  a.triagem_01, a.triagem_02, a.triagem_03, a.triagem_04,
  a.triagem_05, a.triagem_06, a.triagem_07, a.triagem_08,
  a.triagem_09, a.triagem_10, a.triagem_11, a.triagem_12,
  a.created_at,
  a.updated_at
from public.lei_do_bem_avaliacoes a
join public.projects p on p.id = a.project_id
left join public.areas ar on ar.id = p.area_id
left join public.profiles po on po.id = p.owner_id
left join public.profiles ra on ra.id = a.responsavel_auditoria_id
where p.archived_at is null;

comment on view public.v_lei_do_bem is
  'Iniciativas que passaram pela pré-avaliação Lei do Bem. status = estágio '
  'da auditoria (manual); triagem_classificacao = resultado automático do '
  'questionário. São dimensões distintas — não misturar nos KPIs.';
