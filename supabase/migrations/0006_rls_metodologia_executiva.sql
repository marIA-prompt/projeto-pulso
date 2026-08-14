-- =============================================================================
-- Sistema Pulso — RLS: Metodologia Executiva restrita a gerencial+ (camada 3)
--
-- A restrição de acesso à Metodologia Executiva já existe na rota (camada de
-- aplicação: metodologia/[slug]/page.tsx redireciona quem não é gerencial+).
-- Esta migration adiciona a última camada — a RLS no Postgres — para que nem
-- via API direta um leitor/participante/editor consiga ler a página executiva.
--
-- Cuidado técnico: policies são PERMISSIVAS e combinadas por OR. A policy
-- content_write é FOR ALL (inclui SELECT), então NÃO basta restringir só a
-- content_read: as duas precisam concordar para o slug 'metodologia-executiva'.
-- Editor mantém leitura/escrita do Manifesto e da Metodologia do Grupo.
-- Idempotente: pode ser reexecutada.
-- =============================================================================

-- Leitura: qualquer conteúdo, MENOS a executiva (essa só gerencial+).
drop policy if exists content_read on public.content_pages;
create policy content_read on public.content_pages
  for select to authenticated
  using (
    slug <> 'metodologia-executiva'
    or public.has_role_at_least('gerencial')
  );

-- Escrita: editor+ como antes, MENOS a executiva (essa só gerencial+).
drop policy if exists content_write on public.content_pages;
create policy content_write on public.content_pages
  for all to authenticated
  using (
    public.has_role_at_least('editor')
    and (slug <> 'metodologia-executiva' or public.has_role_at_least('gerencial'))
  )
  with check (
    public.has_role_at_least('editor')
    and (slug <> 'metodologia-executiva' or public.has_role_at_least('gerencial'))
  );
