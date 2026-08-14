-- =============================================================================
-- Sistema Pulso — Hub da Comunidade
--
-- Estende public.profiles com o perfil de comunidade (habilidades técnicas,
-- interesses, nível de experiência, projetos, apelido, foto) e cria o bucket
-- de avatares no Storage. O objetivo é permitir encontrar especialistas e
-- entusiastas por busca/filtro.
--
-- RLS: profiles já tem leitura para todos os autenticados (profiles_read) e
-- atualização da própria linha (profiles_self_update). O trigger
-- prevent_self_role_escalation continua bloqueando mudança de role/active por
-- não-admin, mas libera estas colunas novas — então cada pessoa edita o próprio
-- perfil do hub sem policy adicional.
-- Idempotente: pode ser reexecutada.
-- =============================================================================

-- 1. Nível de experiência
do $$ begin
  create type public.experience_level as enum
    ('iniciante', 'intermediario', 'avancado', 'especialista');
exception when duplicate_object then null; end $$;

-- 2. Colunas do perfil de comunidade em profiles
alter table public.profiles add column if not exists nickname         text;
alter table public.profiles add column if not exists avatar_url       text;
alter table public.profiles add column if not exists headline         text;
alter table public.profiles add column if not exists bio              text;
alter table public.profiles add column if not exists experience_level public.experience_level;
alter table public.profiles add column if not exists languages        text[] not null default '{}';
alter table public.profiles add column if not exists automations      text[] not null default '{}';
alter table public.profiles add column if not exists interests        text[] not null default '{}';
alter table public.profiles add column if not exists projects_done    text;
alter table public.profiles add column if not exists contact          text;
alter table public.profiles add column if not exists available        boolean not null default true;
alter table public.profiles add column if not exists hub_updated_at   timestamptz;

comment on column public.profiles.available is
  'Sinaliza que a pessoa está aberta a colaborar em novas iniciativas.';

-- Índices GIN para busca por habilidade/interesse
create index if not exists profiles_languages_idx   on public.profiles using gin (languages);
create index if not exists profiles_automations_idx on public.profiles using gin (automations);
create index if not exists profiles_interests_idx   on public.profiles using gin (interests);

-- 3. Bucket de avatares (Storage). Em produção o schema storage sempre existe;
--    o guard evita quebrar um eventual db reset local onde o storage sobe depois.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'storage' and table_name = 'objects'
  ) then
    insert into storage.buckets (id, name, public)
      values ('avatars', 'avatars', true)
      on conflict (id) do update set public = true;

    -- Leitura pública (bucket público). Escrita/edição só na própria pasta,
    -- cujo primeiro segmento do caminho é o auth.uid() da pessoa.
    drop policy if exists "avatars_public_read" on storage.objects;
    create policy "avatars_public_read" on storage.objects
      for select using (bucket_id = 'avatars');

    drop policy if exists "avatars_insert_own" on storage.objects;
    create policy "avatars_insert_own" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

    drop policy if exists "avatars_update_own" on storage.objects;
    create policy "avatars_update_own" on storage.objects
      for update to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

    drop policy if exists "avatars_delete_own" on storage.objects;
    create policy "avatars_delete_own" on storage.objects
      for delete to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
  else
    raise notice 'schema storage ausente: bucket avatars não criado nesta execução.';
  end if;
end $$;
