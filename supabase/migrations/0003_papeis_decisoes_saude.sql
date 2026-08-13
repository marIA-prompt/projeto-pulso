-- =============================================================================
-- Sistema Pulso — Papéis em 5 níveis, Decisões Executivas e Saúde da Iniciativa
--
-- Parte desta migration reaproveita o script SQL anexado pelo usuário
-- ("PULSO — Schema do Supabase para Relatoria Executiva"). O que foi
-- aproveitado, o que foi corrigido e por quê está documentado abaixo, no
-- mesmo espírito da auditoria original (docs/AUDITORIA.md) e do
-- docs/DECISOES.md (D1–D4).
--
-- APROVEITADO do script anexado:
--   • A tabela de decisões executivas — resolve a pendência E4 já registrada
--     em docs/metodologia-executiva.md: o Report Executivo Quinzenal (W4)
--     não tinha de onde tirar "decisões pendentes" e "status das decisões
--     anteriores".
--   • A ideia de estados de saúde além do pipeline (em_risco, impedido,
--     estacionado) — vira a coluna `health`, ver nota abaixo sobre por que
--     não virou estágio.
--   • Custo de implementação, ferramentas como lista e marcos de tempo de
--     desenvolvimento/conclusão — viram `implementation_cost`, `tool_tags`,
--     `dev_started_at`, `concluded_at`.
--
-- CORRIGIDO em relação ao script anexado (e por quê):
--   1. `area VARCHAR(100)` livre → reintroduz o problema A3 da auditoria
--      (39 grafias diferentes de setor). Mantido `area_id` com FK para
--      `public.areas`, já canonicalizada.
--   2. `responsavel VARCHAR(150)` livre → quebra a regra "membro edita só
--      as próprias iniciativas" (não dá para comparar texto livre com
--      auth.uid()). `projects.owner_id` já é FK; para `decisions`, a
--      responsabilidade é às vezes de uma pessoa e às vezes de um papel
--      coletivo ("Diretoria TI", "Compliance" — exemplos do próprio script
--      anexado), então a tabela nova aceita as duas formas.
--   3. `status` único misturando estágio do pipeline com bloqueio
--      ('em_risco', 'impedido', 'estacionado' no mesmo enum de
--      'concluido'/'cancelado') → uma iniciativa em desenvolvimento que
--      fica bloqueada não deveria "sair" do pipeline, só sinalizar saúde.
--      Por isso `stage` (pipeline) e `health` (saúde) viraram colunas
--      independentes — o mesmo raciocínio do C1 original, estendido.
--   4. `score_priorizacao DECIMAL(3,2) DEFAULT 0` → um score que nasce
--      zerado classifica tudo como Backlog silenciosamente, sem distinguir
--      "não avaliada" de "avaliada e baixa". Mantida a decomposição em
--      4 eixos nula (C2) já validada.
--   5. `RLS ... USING (auth.jwt() ->> 'user_role' = 'admin')` → papel em
--      claim de JWT é o antipadrão que a decisão D4 já rejeitou: não é o
--      Postgres que audita esse valor, é o client. Toda checagem de papel
--      aqui continua batendo em `public.profiles`, nunca em `auth.jwt()`.
--   6. Os 5 INSERTs de exemplo do script anexado não entraram nesta
--      migration: misturariam iniciativas fictícias com o portfólio real
--      de 161 (e os totais 1.994,7h / 31 áreas já reconciliados na
--      auditoria deixariam de bater). Se quiser dados de exemplo, o lugar
--      certo é um seed de desenvolvimento separado, fora de supabase/migrations.
--
-- NOVO nesta migration, motivado pelo HTML da prévia (que já mostra 5
-- papéis em Admin → Participantes): o `user_role` deixa de ser binário
-- (member/admin) e passa a ter 5 níveis. A tabela abaixo é a régua usada
-- nas policies — pensada em cima do RACI da Metodologia Executiva §3:
--
--   nível | papel          | pensado para (RACI)              | pode
--   ------|----------------|-----------------------------------|---------------------------------
--   1     | leitor         | observador externo / Sponsor      | só ler
--   2     | participante   | Dono de Iniciativa (papel-base)   | + suas iniciativas, sua presença
--   3     | editor         | Escriba / Curador(a) de Ideias    | + publicar Manifesto/Metodologia
--   4     | gerencial      | Líder de Programa / PMO           | + qualquer iniciativa, encontros, decisões
--   5     | administrador  | Governança                        | + convites, papéis, tudo
--
-- PENDÊNCIA REAL desta migration: o app Next.js já gerado (src/lib/types.ts,
-- src/lib/auth.ts, as Server Actions de admin, o Nav.tsx) ainda fala só
-- 'member'/'admin'. Sem atualizar esse código, criar convite ou alterar
-- papel pela interface vai falhar contra este novo schema. Ver o fim desta
-- resposta para o que falta lá.
-- =============================================================================


-- =============================================================================
-- 1. PAPÉIS EM 5 NÍVEIS
-- =============================================================================
-- ALTER TYPE ... ADD VALUE não pode ser usado na mesma transação em que o
-- valor novo é referenciado — é uma restrição conhecida do Postgres. Para
-- não depender de como o SQL Editor do Supabase agrupa as transações, o
-- tipo é recriado do zero (seguro dentro de uma única transação) e a coluna
-- é convertida com USING. O guard abaixo torna o bloco idempotente.
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'user_role' and e.enumlabel = 'leitor'
  ) then
    create type public.user_role_new as enum
      ('leitor', 'participante', 'editor', 'gerencial', 'administrador');

    alter table public.profiles alter column role drop default;
    alter table public.profiles alter column role type public.user_role_new
      using (case role::text when 'admin' then 'administrador' else 'participante' end)::public.user_role_new;
    alter table public.profiles alter column role set default 'participante'::public.user_role_new;

    alter table public.invitations alter column role drop default;
    alter table public.invitations alter column role type public.user_role_new
      using (case role::text when 'admin' then 'administrador' else 'participante' end)::public.user_role_new;
    alter table public.invitations alter column role set default 'participante'::public.user_role_new;

    drop type public.user_role;
    alter type public.user_role_new rename to user_role;
  end if;
end $$;

create or replace function public.role_rank(p_role public.user_role)
returns int language sql immutable as $$
  select case p_role
    when 'leitor'        then 1
    when 'participante'  then 2
    when 'editor'        then 3
    when 'gerencial'     then 4
    when 'administrador' then 5
  end;
$$;

create or replace function public.has_role_at_least(p_min public.user_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active
      and public.role_rank(role) >= public.role_rank(p_min)
  );
$$;

-- Redefinida (não recriada): quem já chama public.is_admin() nas policies
-- de 0001 passa a falar com os 5 níveis sem precisar tocar em cada policy.
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select public.has_role_at_least('administrador');
$$;

-- Lacuna de segurança da versão anterior: a policy profiles_self_update
-- deixa a própria pessoa fazer UPDATE na própria linha, e RLS não restringe
-- COLUNA — só linha. Sem este trigger, um participante podia se promover
-- direto via PATCH em profiles.role, contornando toda a Área Admin.
create or replace function public.prevent_self_role_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role or new.active is distinct from old.active then
      raise exception 'Apenas administradores alteram papel ou status de acesso.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.prevent_self_role_escalation();


-- =============================================================================
-- 2. SAÚDE DA INICIATIVA — independente do estágio do pipeline
-- =============================================================================
do $$ begin
  create type public.project_health as enum ('normal', 'em_risco', 'impedido', 'estacionado');
exception when duplicate_object then null; end $$;

alter table public.projects add column if not exists health public.project_health not null default 'normal';
alter table public.projects add column if not exists health_note text;
alter table public.projects add column if not exists health_updated_at timestamptz;

comment on column public.projects.health is
  'Autorreportado pelo dono, independente do estágio. Uma iniciativa em '
  'em_desenvolvimento que trava fica impedido SEM sair do pipeline — '
  'alimenta o Fórum de Desbloqueio (Metodologia do Grupo §3) sem se '
  'confundir com o semáforo de tempo (que mede falta de atualização).';

-- Ferramentas, custo de implementação e marcos de ciclo — do script anexado.
alter table public.projects add column if not exists tool_tags text[] not null default '{}';
alter table public.projects add column if not exists implementation_cost numeric(12,2);
alter table public.projects add column if not exists dev_started_at timestamptz;
alter table public.projects add column if not exists concluded_at timestamptz;

comment on column public.projects.implementation_cost is
  'Custo único para construir a iniciativa — distinto de cost_saved_month '
  '(economia recorrente). Os dois juntos permitem o ROI ≥ 3x da '
  'Metodologia Executiva §6, hoje fora do dashboard por falta de amostra '
  '(ver docs/AUDITORIA.md, item F2).';

-- Reportar saúde é atividade substantiva: reabre o relógio do semáforo,
-- do mesmo jeito que editar descrição ou pontuar um eixo já fazia.
create or replace function public.bump_last_activity()
returns trigger language plpgsql as $$
begin
  if (new.stage             is distinct from old.stage)
  or (new.description       is distinct from old.description)
  or (new.notes             is distinct from old.notes)
  or (new.links              is distinct from old.links)
  or (new.target_date       is distinct from old.target_date)
  or (new.hours_saved_month is distinct from old.hours_saved_month)
  or (new.score_impacto     is distinct from old.score_impacto)
  or (new.score_viabilidade is distinct from old.score_viabilidade)
  or (new.score_alinhamento is distinct from old.score_alinhamento)
  or (new.score_urgencia    is distinct from old.score_urgencia)
  or (new.health             is distinct from old.health)
  or (new.health_note        is distinct from old.health_note)
  then
    new.last_activity_at := now();
  end if;
  if new.health is distinct from old.health then
    new.health_updated_at := now();
  end if;
  return new;
end $$;

-- Marcos de tempo de ciclo (Metodologia Executiva §6: "tempo médio de
-- ciclo ≤ 30/90 dias"). Só grava a PRIMEIRA vez que a iniciativa entra em
-- cada estágio — reabrir e fechar de novo não deve reescrever a métrica.
create or replace function public.track_stage_milestones()
returns trigger language plpgsql as $$
begin
  if new.stage = 'em_desenvolvimento' and old.stage is distinct from 'em_desenvolvimento'
     and new.dev_started_at is null then
    new.dev_started_at := now();
  end if;
  if new.stage = 'concluido' and old.stage is distinct from 'concluido'
     and new.concluded_at is null then
    new.concluded_at := now();
  end if;
  return new;
end $$;

drop trigger if exists projects_stage_milestones on public.projects;
create trigger projects_stage_milestones before update on public.projects
  for each row execute function public.track_stage_milestones();

-- Gate da Metodologia Executiva §9.1 (Backlog → Em Desenvolvimento exige
-- score ≥ 3,0), hoje só validado na Server Action do Next.js. Isto é a
-- segunda camada — o banco recusa mesmo que a validação da aplicação
-- tenha um bug ou seja contornada por uma edição direta.
--
-- Nota técnica: score_final é GENERATED ... STORED, e uma coluna gerada
-- ainda NÃO está calculada quando um gatilho BEFORE roda — por isso o
-- score é recalculado aqui manualmente, com os mesmos pesos da coluna
-- gerada e de src/lib/scoring.ts. Mudou o peso em um lugar, muda nos três.
--
-- Isenção obrigatória: as 161 iniciativas herdadas (is_legacy_import) já
-- nascem em 'em_desenvolvimento' sem os 4 eixos pontuados — é a leitura
-- deliberada do C2 (scoring_source = 'nao_pontuado'). Sem a isenção, a
-- carga inicial do portfólio quebraria por inteiro.
create or replace function public.enforce_stage_gate()
returns trigger language plpgsql as $$
declare
  v_score numeric;
begin
  if new.stage = 'em_desenvolvimento' and coalesce(new.is_legacy_import, false) = false then
    if new.score_impacto is null or new.score_viabilidade is null
       or new.score_alinhamento is null or new.score_urgencia is null then
      raise exception 'Pontue os 4 eixos da Matriz de Priorização antes de mover para Em Desenvolvimento.';
    end if;
    v_score := round(
      new.score_impacto * 0.35 + new.score_viabilidade * 0.25 +
      new.score_alinhamento * 0.25 + new.score_urgencia * 0.15, 2);
    if v_score < 3.0 then
      raise exception 'Score %.2f está abaixo do mínimo de 3,0 exigido pelo gate da Metodologia Executiva.', v_score;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists projects_stage_gate on public.projects;
create trigger projects_stage_gate before insert or update on public.projects
  for each row execute function public.enforce_stage_gate();


-- =============================================================================
-- 3. DECISÕES EXECUTIVAS — do script anexado, com FK em vez de texto livre
-- =============================================================================
do $$ begin
  create type public.decision_status as enum ('pendente', 'em_andamento', 'concluida', 'cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.decision_impact as enum ('alto', 'medio', 'baixo');
exception when duplicate_object then null; end $$;

create table if not exists public.decisions (
  id               uuid primary key default gen_random_uuid(),
  description      text not null,

  -- O script anexado usava só texto livre ('Diretoria TI', 'Compliance').
  -- Mantido como fallback: no RACI da Metodologia Executiva (§3), a
  -- responsabilidade às vezes é de uma pessoa cadastrada, às vezes de um
  -- papel coletivo que não tem — e não deveria ter — uma linha em profiles.
  responsible_id    uuid references public.profiles(id),
  responsible_label text,

  due_date         date,
  status           public.decision_status not null default 'pendente',
  impact           public.decision_impact not null default 'medio',

  project_id       uuid references public.projects(id) on delete set null,
  context          text,

  created_by       uuid references public.profiles(id) default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  resolved_at      timestamptz,

  constraint decisions_responsible_check
    check (responsible_id is not null or responsible_label is not null)
);

comment on table public.decisions is
  'Alimenta os blocos "Decisões pendentes" e "Status das decisões '
  'anteriores" do Report Executivo Quinzenal (W4) — pendência registrada '
  'em docs/metodologia-executiva.md desde a auditoria original (E4).';

create index if not exists decisions_status_idx on public.decisions (status);
create index if not exists decisions_due_idx    on public.decisions (due_date);
create index if not exists decisions_project_idx on public.decisions (project_id);

drop trigger if exists decisions_touch on public.decisions;
create trigger decisions_touch before update on public.decisions
  for each row execute function public.touch_updated_at();

create or replace function public.close_decision()
returns trigger language plpgsql as $$
begin
  if new.status in ('concluida', 'cancelada') and old.status not in ('concluida', 'cancelada') then
    new.resolved_at := now();
  end if;
  if new.status not in ('concluida', 'cancelada') then
    new.resolved_at := null;
  end if;
  return new;
end $$;

drop trigger if exists decisions_close on public.decisions;
create trigger decisions_close before update on public.decisions
  for each row execute function public.close_decision();

alter table public.decisions enable row level security;

-- Leitura para todos: "transparência gera confiança" (Manifesto, crença 6)
-- vale para decisões executivas tanto quanto para o resto do portfólio.
drop policy if exists decisions_read on public.decisions;
create policy decisions_read on public.decisions
  for select to authenticated using (true);

-- Escrita a partir de gerencial: é o nível mapeado ao Líder de Programa,
-- que registra decisões segundo o RACI da Metodologia Executiva §3.
drop policy if exists decisions_write on public.decisions;
create policy decisions_write on public.decisions
  for all to authenticated
  using (public.has_role_at_least('gerencial'))
  with check (public.has_role_at_least('gerencial'));


-- =============================================================================
-- 4. POLICIES QUE MUDAM DE LIMIAR (as que só chamam is_admin() já herdam
--    o novo comportamento pela redefinição da função — não precisam mudar)
-- =============================================================================

-- Manifesto/Metodologia: "editor" é literalmente o papel pensado para
-- publicar conteúdo (mapeado ao Escriba / Curador(a) de Ideias).
drop policy if exists content_admin_write on public.content_pages;
drop policy if exists content_write on public.content_pages;
create policy content_write on public.content_pages
  for all to authenticated
  using (public.has_role_at_least('editor'))
  with check (public.has_role_at_least('editor'));

-- Cadastrar iniciativa exige participante+ — leitor só acompanha.
-- Admin pode inserir em nome de outra pessoa (import, correção).
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
  for insert to authenticated
  with check (
    (owner_id = auth.uid() and public.has_role_at_least('participante'))
    or public.is_admin()
  );

-- Editar qualquer iniciativa passa a ser gerencial+, não só admin —
-- mapeado ao Líder de Programa/PMO, que acompanha o portfólio inteiro.
drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
  for update to authenticated
  using (owner_id = auth.uid() or public.has_role_at_least('gerencial'))
  with check (owner_id = auth.uid() or public.has_role_at_least('gerencial'));

-- Criar encontro sobe de admin-only para gerencial+ (Líder de Programa
-- "facilita a reunião" — Metodologia Executiva §3).
drop policy if exists meetings_admin_write on public.meetings;
drop policy if exists meetings_write on public.meetings;
create policy meetings_write on public.meetings
  for all to authenticated
  using (public.has_role_at_least('gerencial'))
  with check (public.has_role_at_least('gerencial'));

-- Confirmar presença continua self-serve, mas exige participante+:
-- leitor é observador externo, não faz parte da lista de frequência do
-- Grupo (Metodologia do Grupo §10 mede presença "da base cadastrada").
drop policy if exists attendance_self_write on public.attendance;
create policy attendance_self_write on public.attendance
  for all to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (
    (user_id = auth.uid() and public.has_role_at_least('participante'))
    or public.is_admin()
  );

-- Convites: gerencial pode convidar, mas só até o nível "editor" — mintar
-- um novo gerencial ou administrador continua exclusivo de administrador.
-- Sem este teto, um gerencial poderia se autorreplicar via convite.
drop policy if exists invitations_admin on public.invitations;
drop policy if exists invitations_write on public.invitations;
create policy invitations_write on public.invitations
  for all to authenticated
  using (public.has_role_at_least('gerencial'))
  with check (
    public.is_admin()
    or (public.has_role_at_least('gerencial') and public.role_rank(role) <= public.role_rank('editor'))
  );


-- =============================================================================
-- 5. VIEWS
-- =============================================================================

-- Mesma view de 0001, com as colunas novas acrescentadas ao final —
-- CREATE OR REPLACE VIEW exige manter o prefixo de colunas existente.
create or replace view public.v_projects_dashboard as
select
  p.id, p.title, p.stage, p.theme, p.directorate,
  a.name as area_name,
  p.uses_ai, p.uses_n8n,
  p.hours_saved_month,
  p.score_final, p.scoring_source, p.legacy_priority,
  p.last_activity_at,
  (current_date - p.last_activity_at::date) as dias_sem_atualizacao,
  case
    when p.stage in ('concluido', 'cancelado') then 'done'
    when (current_date - p.last_activity_at::date) <= 30 then 'ok'
    when (current_date - p.last_activity_at::date) >  90 then 'crit'
    else 'warn'
  end as sinal,
  ((current_date - p.last_activity_at::date) > 14
   and p.stage not in ('concluido', 'cancelado')) as alerta_14_dias,
  p.health, p.health_note, p.health_updated_at,
  p.tool_tags, p.implementation_cost,
  p.dev_started_at, p.concluded_at
from public.projects p
left join public.areas a on a.id = p.area_id
where p.archived_at is null;

-- Fila do Fórum de Desbloqueio: bloqueio autorreportado, não o semáforo
-- de tempo (que já existe na view acima). São duas filas com origem
-- diferente e podem não coincidir — uma iniciativa pode estar 'impedido'
-- e ainda assim ter sido atualizada ontem.
create or replace view public.v_health_alerts as
select p.id, p.title, p.health, p.health_note, p.health_updated_at,
       a.name as area_name, p.owner_id
from public.projects p
left join public.areas a on a.id = p.area_id
where p.health <> 'normal' and p.archived_at is null;

-- Decisões pendentes — bloco 3 do Report Executivo Quinzenal (W4).
create or replace view public.v_decisions_pendentes as
select d.id, d.description, d.status, d.impact, d.due_date,
       coalesce(pr.full_name, d.responsible_label) as responsavel,
       pj.title as project_title
from public.decisions d
left join public.profiles pr on pr.id = d.responsible_id
left join public.projects pj on pj.id = d.project_id
where d.status in ('pendente', 'em_andamento')
order by d.due_date nulls last;

-- Tempo de ciclo real (Metodologia Executiva §6: meta ≤ 30d low-code /
-- ≤ 90d complexo). Só entram iniciativas com os dois marcos preenchidos —
-- sem isso, não dá para saber quanto tempo levou.
create or replace view public.v_cycle_time as
select p.id, p.title, p.area_id, a.name as area_name,
       p.dev_started_at, p.concluded_at,
       extract(day from p.concluded_at - p.dev_started_at)::int as dias_de_ciclo
from public.projects p
left join public.areas a on a.id = p.area_id
where p.dev_started_at is not null and p.concluded_at is not null;
