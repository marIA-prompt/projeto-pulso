-- =============================================================================
-- Sistema Pulso — Lei do Bem: aba restrita a gerencial+
--
-- Idempotente. Cobre quem já aplicou a 0010 com SELECT aberto
-- (authenticated using true). A aba /lei-do-bem fica só para gerencial e
-- administrador; o dono da iniciativa continua lendo a própria linha no
-- cadastro/edição.
-- =============================================================================

drop policy if exists lei_do_bem_read on public.lei_do_bem_avaliacoes;
create policy lei_do_bem_read on public.lei_do_bem_avaliacoes
  for select to authenticated
  using (
    public.has_role_at_least('gerencial')
    or exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists lei_do_bem_log_read on public.lei_do_bem_status_log;
create policy lei_do_bem_log_read on public.lei_do_bem_status_log
  for select to authenticated
  using (public.has_role_at_least('gerencial'));

alter view public.v_lei_do_bem set (security_invoker = true);
