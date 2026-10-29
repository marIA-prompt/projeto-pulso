-- =============================================================================
-- Pulsenff — match de soluções observável no Supabase.
--
-- A decisão (tem iniciativa parecida ou não) é código da aplicação. Esta
-- tabela só guarda o que foi perguntado e a prévia da resposta, para a
-- Gerência de IA abrir o Table Editor e ler a fila sem outro sistema.
-- Idempotente.
-- =============================================================================

create table if not exists public.pulsenff_consultas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id),
  problema     text not null,
  resultado    text not null check (resultado in ('curto', 'sem_match', 'com_match')),
  varridas     integer not null default 0 check (varridas >= 0),
  encontrados  integer not null default 0 check (encontrados >= 0),
  matches      jsonb not null default '[]'::jsonb,
  previa       text not null,
  created_at   timestamptz not null default now()
);

comment on table public.pulsenff_consultas is
  'Cada varredura do Pulsenff. A coluna previa é a frase que a pessoa viu. matches lista as iniciativas parecidas.';

comment on column public.pulsenff_consultas.previa is
  'Prévia da resposta: títulos e afinidade, ou o convite para cadastrar e apresentar na próxima reunião.';

comment on column public.pulsenff_consultas.matches is
  'Até 5 objetos {project_id, title, stage, theme, area_name, owner_name, resumo, afinidade, termos}.';

create index if not exists pulsenff_consultas_recentes_idx
  on public.pulsenff_consultas (created_at desc);

create index if not exists pulsenff_consultas_user_idx
  on public.pulsenff_consultas (user_id, created_at desc);

alter table public.pulsenff_consultas enable row level security;

drop policy if exists pulsenff_consultas_read on public.pulsenff_consultas;
create policy pulsenff_consultas_read on public.pulsenff_consultas
  for select to authenticated
  using (user_id = auth.uid() or public.has_role_at_least('gerencial'));

drop policy if exists pulsenff_consultas_insert on public.pulsenff_consultas;
create policy pulsenff_consultas_insert on public.pulsenff_consultas
  for insert to authenticated
  with check (user_id = auth.uid());

grant select, insert on public.pulsenff_consultas to authenticated;

create or replace view public.v_pulsenff_consultas
with (security_invoker = true) as
select
  c.created_at,
  pr.full_name as quem,
  c.problema,
  c.resultado,
  c.previa,
  c.varridas,
  c.encontrados,
  c.matches,
  c.user_id,
  c.id
from public.pulsenff_consultas c
left join public.profiles pr on pr.id = c.user_id;

comment on view public.v_pulsenff_consultas is
  'Mesma fila do Pulsenff, com o nome de quem perguntou. security_invoker: cada um vê as suas; gerencial vê todas.';

grant select on public.v_pulsenff_consultas to authenticated;
