-- =============================================================================
-- Sistema Pulso — Schema base
-- Resolve os pontos A2, A3, C1, C2, C3, F1 e F2 da auditoria de consistência.
-- Idempotente: pode ser reexecutada.
-- =============================================================================

create extension if not exists "pgcrypto";

-- =============================================================================
-- 1. ENUMS
-- =============================================================================

do $$ begin
  create type public.user_role as enum ('member','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invitation_status as enum ('pending','accepted','expired','revoked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('pending','present','absent');
exception when duplicate_object then null; end $$;

-- C1 — Pipeline de 7 estágios da metodologia + 'cancelado'.
-- O estágio 'cancelado' não está no pipeline linear, mas a Metodologia
-- Executiva (§9.1) define o gate "Qualquer estágio → Cancelado". Sem ele,
-- a taxa de conclusão (Concluídas / (Concluídas + Canceladas + Em andamento))
-- é incalculável.
do $$ begin
  create type public.project_stage as enum (
    'ideia','backlog','priorizacao','em_desenvolvimento',
    'em_teste','concluido','showcase','cancelado'
  );
exception when duplicate_object then null; end $$;

-- C2 — Origem do score. Distingue iniciativa pontuada na Matriz de 4 Eixos
-- das 161 herdadas, cujo score legado (5 a 65) é direcional e, segundo a
-- própria ressalva do CSV, não representa ROI validado.
do $$ begin
  create type public.scoring_source as enum ('matriz_4_eixos','legado','nao_pontuado');
exception when duplicate_object then null; end $$;


-- =============================================================================
-- 2. ÁREAS CANÔNICAS  (resolve A3)
-- =============================================================================
-- A base traz 39 grafias distintas de setor. O arquivo de referência já as
-- consolida em 32 — mas uma delas é o literal 'Não informado', que não é setor.
-- Aqui a canônica fica explícita e auditável, e `is_real_area` separa o
-- placeholder para que o KPI público deixe de contá-lo.

create table if not exists public.areas (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  directorate   text,
  is_real_area  boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.area_aliases (
  alias    text primary key,
  area_id  uuid not null references public.areas(id) on delete cascade
);

comment on table public.area_aliases is
  'De-para de grafias legadas → área canônica. Toda importação passa por aqui; '
  'string sem alias deve falhar a carga em vez de criar área nova silenciosamente.';

insert into public.areas (name, is_real_area) values
  ('Atendimento', true), ('Banco PJ', true), ('Cobrança', true),
  ('Comercial PF', true), ('Comercial PJ', true), ('Compliance', true),
  ('Compras, Manutenção e Zeladoria', true), ('Consignado', true),
  ('Credenciamento', true), ('Crédito PF', true), ('Crédito PJ', true),
  ('DHO', true), ('Departamento Controladoria - Carteiras e Regulatórios', true),
  ('Departamento Controladoria - Contabilidade', true),
  ('Departamento Controladoria - Controladoria', true),
  ('Departamento Controladoria - Fiscal', true),
  ('Departamento Controladoria - Riscos', true),
  ('Financeiro - Tesouraria', true), ('Financeiro / Contas a Receber', true),
  ('Fraudes', true), ('Frota', true), ('Jurídico', true), ('Marketing', true),
  ('Marketplace', true), ('Operações', true),
  ('Portfólio Projetos Estratégicos', true), ('Private Label', true),
  ('Produtos Financeiros', true), ('Pós Vendas - Private Label', true),
  ('RH', true), ('Seguros', true),
  ('Não informado', false)   -- <- placeholder, fora da contagem pública
on conflict (name) do nothing;

-- Aliases observados na base tratada (variações de caixa, acento e grafia).
insert into public.area_aliases (alias, area_id)
select v.alias, a.id from (values
  ('BANCO PJ','Banco PJ'),
  ('COMPLIANCE','Compliance'),
  ('Credito PJ','Crédito PJ'),
  ('Rh','RH'),
  ('FROTA','Frota'),
  ('COMPRAS, FROTA E ZELADORIA','Compras, Manutenção e Zeladoria'),
  ('Compras, Frota e Zeladoria','Compras, Manutenção e Zeladoria'),
  ('COMPRAS, MANUENÇÃO E ZELADORIA','Compras, Manutenção e Zeladoria'),
  ('MANUTENÇÃO/COMPRAS  E ZELADORIA','Compras, Manutenção e Zeladoria'),
  ('ZELADORIA E COMPRAS','Compras, Manutenção e Zeladoria'),
  ('Produtos Financeiros / Produtos Financeiros','Produtos Financeiros'),
  ('Produtos Financeiros / Consignado','Consignado')
) as v(alias, canon)
join public.areas a on a.name = v.canon
on conflict (alias) do nothing;


-- =============================================================================
-- 3. PERFIS, CONVITES, ENCONTROS, FREQUÊNCIAS
-- =============================================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  area_id     uuid references public.areas(id),
  role        public.user_role not null default 'member',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.invitations (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  role         public.user_role not null default 'member',
  invited_by   uuid references public.profiles(id),
  token_hash   text not null,
  status       public.invitation_status not null default 'pending',
  expires_at   timestamptz not null default (now() + interval '7 days'),
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);
create unique index if not exists invitations_email_pending_uidx
  on public.invitations (lower(email)) where status = 'pending';

create table if not exists public.meetings (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  scheduled_at  timestamptz not null,
  description   text,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

create table if not exists public.attendance (
  id            uuid primary key default gen_random_uuid(),
  meeting_id    uuid not null references public.meetings(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  status        public.attendance_status not null default 'pending',
  confirmed_at  timestamptz,
  note          text,
  unique (meeting_id, user_id)
);


-- =============================================================================
-- 4. PROJETOS / INICIATIVAS  (resolve C1, C2, C3)
-- =============================================================================

create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  owner_id      uuid references public.profiles(id),

  -- C1 — estágio canônico + rastro do status legado.
  stage         public.project_stage not null default 'ideia',
  legacy_status text,

  theme         text,
  area_id       uuid references public.areas(id),
  directorate   text,
  uses_ai       boolean,
  uses_n8n      boolean,
  tools         text,

  -- C2 — Matriz de 4 Eixos. Notas de 1 a 5, NULL enquanto não pontuado.
  -- As 161 iniciativas herdadas entram com os quatro eixos NULL: importar o
  -- score legado (5–65) direto classificaria 100% do portfólio como
  -- "Prioridade Alta", já que qualquer valor ≥ 5 supera o corte de 4,0.
  score_impacto      numeric(2,1) check (score_impacto      between 1 and 5),
  score_viabilidade  numeric(2,1) check (score_viabilidade  between 1 and 5),
  score_alinhamento  numeric(2,1) check (score_alinhamento  between 1 and 5),
  score_urgencia     numeric(2,1) check (score_urgencia     between 1 and 5),

  score_final numeric(3,2) generated always as (
    case
      when score_impacto is null or score_viabilidade is null
        or score_alinhamento is null or score_urgencia is null
      then null
      else round(
        score_impacto     * 0.35 +
        score_viabilidade * 0.25 +
        score_alinhamento * 0.25 +
        score_urgencia    * 0.15
      , 2)
    end
  ) stored,

  scoring_source   public.scoring_source not null default 'nao_pontuado',
  legacy_score     integer,   -- coluna "Score" do CSV (5 a 65) — direcional
  legacy_priority  text,      -- coluna "Potencial" (base / média / alta)

  hours_saved_month  numeric(10,2),
  cost_saved_month   numeric(12,2),
  dev_hours          numeric(10,2),

  start_date   date,
  target_date  date,
  links        text,
  notes        text,

  -- C3 — três marcos temporais distintos. O bug original nasce de tratar
  -- a data de registro como data de atualização.
  --   created_at       : quando a linha entrou no sistema (auditoria)
  --   updated_at       : qualquer escrita na linha (auditoria)
  --   last_activity_at : última atualização SUBSTANTIVA feita pelo dono.
  --                      É a única que alimenta o semáforo e o alerta de 14 dias.
  last_activity_at  timestamptz not null default now(),
  is_legacy_import  boolean not null default false,

  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on column public.projects.last_activity_at is
  'Semáforo e alerta de 14 dias medem ATUALIZAÇÃO, não idade do registro. '
  'Na carga inicial deve ser semeada com a data do go-live (ver §6), nunca '
  'com a data original de cadastro: as 161 iniciativas herdadas têm idade '
  'mediana de 259 dias e todas as 56 ativas abririam como críticas.';

comment on column public.projects.legacy_score is
  'Escala 5–65 herdada do portfólio. Direcional, não representa ROI validado '
  '(ressalva da própria base). Não usar nos cortes 4,0/3,0 da Matriz.';

create index if not exists projects_stage_idx        on public.projects (stage);
create index if not exists projects_area_idx         on public.projects (area_id);
create index if not exists projects_owner_idx        on public.projects (owner_id);
create index if not exists projects_activity_idx     on public.projects (last_activity_at);

create table if not exists public.content_pages (
  slug        text primary key,
  title       text not null,
  body_md     text not null,
  updated_by  uuid references public.profiles(id),
  updated_at  timestamptz not null default now()
);


-- =============================================================================
-- 5. FUNÇÕES E TRIGGERS
-- =============================================================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- C3 — só campos de conteúdo renovam o relógio do semáforo. Arquivar um
-- projeto ou o admin corrigir uma área não pode "zerar" o alerta.
create or replace function public.bump_last_activity()
returns trigger language plpgsql as $$
begin
  if (new.stage           is distinct from old.stage)
  or (new.description     is distinct from old.description)
  or (new.notes           is distinct from old.notes)
  or (new.links           is distinct from old.links)
  or (new.target_date     is distinct from old.target_date)
  or (new.hours_saved_month is distinct from old.hours_saved_month)
  or (new.score_impacto   is distinct from old.score_impacto)
  or (new.score_viabilidade is distinct from old.score_viabilidade)
  or (new.score_alinhamento is distinct from old.score_alinhamento)
  or (new.score_urgencia  is distinct from old.score_urgencia)
  then
    new.last_activity_at := now();
  end if;
  return new;
end $$;

drop trigger if exists projects_bump_activity on public.projects;
create trigger projects_bump_activity before update on public.projects
  for each row execute function public.bump_last_activity();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active
  );
$$;

-- C1 — de-para de status legado. Decisão registrada em docs/DECISOES.md:
-- 'Em acompanhamento' não existe no pipeline de 7 estágios. Mapeia para
-- 'em_teste' porque a Metodologia Executiva (§9.1) define a passagem
-- "Em Teste → Concluído" como "validação pelo usuário final + métricas
-- coletadas" — que é exatamente a fase em que essas 3 iniciativas estão.
create or replace function public.map_legacy_status(p_status text)
returns public.project_stage language sql immutable as $$
  select case lower(trim(p_status))
    when 'concluído'         then 'concluido'
    when 'concluido'         then 'concluido'
    when 'em andamento'      then 'em_desenvolvimento'
    when 'em acompanhamento' then 'em_teste'
    else 'backlog'
  end::public.project_stage;
$$;

-- F1 — a coluna Data traz 160 registros em ISO e 1 em formato norte-americano
-- (12/23/2025). Parser tolerante, usado só na carga inicial.
create or replace function public.parse_legacy_date(p_raw text)
returns date language plpgsql immutable as $$
begin
  if p_raw is null or btrim(p_raw) = '' then return null; end if;
  begin  return to_date(btrim(p_raw), 'YYYY-MM-DD');  exception when others then end;
  begin  return to_date(btrim(p_raw), 'MM/DD/YYYY');  exception when others then end;
  begin  return to_date(btrim(p_raw), 'DD/MM/YYYY');  exception when others then end;
  return null;
end $$;


-- =============================================================================
-- 6. CARGA INICIAL — parâmetro do semáforo  (C3)
-- =============================================================================
-- Executar UMA vez, no go-live, depois de importar as 161 iniciativas:
--
--   update public.projects
--      set last_activity_at = now(),
--          is_legacy_import = true
--    where is_legacy_import = true;
--
-- Sem isso o painel abre com 56 de 56 iniciativas ativas em vermelho
-- (idade mínima do acervo: 92 dias) e o alerta de 14 dias dispara para 100%
-- do portfólio — o indicador perde credibilidade na primeira semana.
-- O acervo passa a decair naturalmente a partir do go-live.


-- =============================================================================
-- 7. VIEWS AGREGADAS
-- =============================================================================

-- A2 — a definição de "horas devolvidas ao time" fica aqui, explícita.
-- Metodologia Executiva §6.1: "Σ horas/mês de todas as iniciativas concluídas".
-- Conferência com a base: 1.994,7h (só concluídas) — é a origem do 1.995h
-- publicado. Somando o portfólio inteiro daria 2.309,7h.
create or replace view public.v_portfolio_kpis as
select
  count(*)                                                  as total_iniciativas,
  count(*) filter (where stage = 'concluido')               as concluidas,
  count(*) filter (where stage not in ('concluido','cancelado')) as ativas,
  coalesce(sum(hours_saved_month) filter (where stage = 'concluido'), 0)
                                                            as horas_mes_devolvidas,
  coalesce(sum(hours_saved_month), 0)                       as horas_mes_portfolio_total,
  count(distinct area_id) filter (
    where area_id in (select id from public.areas where is_real_area)
  )                                                         as areas_com_iniciativa,
  count(*) filter (where uses_ai)                           as com_uso_de_ia
from public.projects
where archived_at is null;

comment on view public.v_portfolio_kpis is
  'horas_mes_devolvidas = apenas iniciativas concluídas (número publicado). '
  'horas_mes_portfolio_total existe para não confundir os dois recortes. '
  'areas_com_iniciativa exclui o placeholder "Não informado".';

-- Semáforo. Limites vêm da UI (sliders 30/90); aqui ficam os defaults.
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
    when p.stage in ('concluido','cancelado') then 'done'
    when (current_date - p.last_activity_at::date) <= 30 then 'ok'
    when (current_date - p.last_activity_at::date) >  90 then 'crit'
    else 'warn'
  end as sinal,
  ((current_date - p.last_activity_at::date) > 14
   and p.stage not in ('concluido','cancelado')) as alerta_14_dias
from public.projects p
left join public.areas a on a.id = p.area_id
where p.archived_at is null;

-- Frequências — KPIs que não existem no HTML de referência.
create or replace view public.v_attendance_kpis as
select
  m.id as meeting_id, m.title, m.scheduled_at,
  count(at.id)                                         as convidados,
  count(*) filter (where at.status <> 'pending')       as confirmaram,
  count(*) filter (where at.status = 'present')        as presentes,
  round(100.0 * count(*) filter (where at.status <> 'pending')
        / nullif(count(at.id), 0), 1)                  as taxa_confirmacao,
  round(100.0 * count(*) filter (where at.status = 'present')
        / nullif(count(at.id), 0), 1)                  as taxa_presenca
from public.meetings m
left join public.attendance at on at.meeting_id = m.id
group by m.id, m.title, m.scheduled_at;


-- =============================================================================
-- 8. RLS
-- =============================================================================

alter table public.profiles      enable row level security;
alter table public.invitations   enable row level security;
alter table public.meetings      enable row level security;
alter table public.attendance    enable row level security;
alter table public.projects      enable row level security;
alter table public.content_pages enable row level security;
alter table public.areas         enable row level security;
alter table public.area_aliases  enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists invitations_admin on public.invitations;
create policy invitations_admin on public.invitations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists meetings_read on public.meetings;
create policy meetings_read on public.meetings
  for select to authenticated using (true);

drop policy if exists meetings_admin_write on public.meetings;
create policy meetings_admin_write on public.meetings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists attendance_read on public.attendance;
create policy attendance_read on public.attendance
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists attendance_self_write on public.attendance;
create policy attendance_self_write on public.attendance
  for all to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects
  for select to authenticated using (true);

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
  for insert to authenticated with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- Sem exclusão física: arquivamento via archived_at. Nenhuma policy de DELETE.

drop policy if exists content_read on public.content_pages;
create policy content_read on public.content_pages
  for select to authenticated using (true);

drop policy if exists content_admin_write on public.content_pages;
create policy content_admin_write on public.content_pages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists areas_read on public.areas;
create policy areas_read on public.areas for select to authenticated using (true);

drop policy if exists area_aliases_read on public.area_aliases;
create policy area_aliases_read on public.area_aliases for select to authenticated using (true);
