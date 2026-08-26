-- Endurece a criação de avaliações Lei do Bem: participantes só podem criar
-- a avaliação da própria iniciativa e não podem preencher dados da auditoria.

create or replace function public.guard_lei_do_bem_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role_at_least('gerencial') then
    if tg_op = 'INSERT' and (
      new.status <> 'backlog'
      or new.responsavel_auditoria_id is not null
      or new.parecer is not null
      or new.prioridade is not null
      or new.enviar_clickup is distinct from false
      or new.clickup_sincronizado_em is not null
    ) then
      raise exception 'Apenas o perfil gerencial ou administrador pode iniciar dados de auditoria Lei do Bem.';
    end if;

    if tg_op = 'UPDATE' and (
      new.status is distinct from old.status
      or new.responsavel_auditoria_id is distinct from old.responsavel_auditoria_id
      or new.parecer is distinct from old.parecer
      or new.prioridade is distinct from old.prioridade
      or new.enviar_clickup is distinct from old.enviar_clickup
      or new.clickup_sincronizado_em is distinct from old.clickup_sincronizado_em
    ) then
      raise exception 'Apenas o perfil gerencial ou administrador pode alterar a auditoria Lei do Bem.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists lei_do_bem_guard_auditoria on public.lei_do_bem_avaliacoes;
create trigger lei_do_bem_guard_auditoria
  before insert or update on public.lei_do_bem_avaliacoes
  for each row execute function public.guard_lei_do_bem_auditoria();

drop policy if exists lei_do_bem_create on public.lei_do_bem_avaliacoes;
create policy lei_do_bem_create on public.lei_do_bem_avaliacoes
  for insert to authenticated
  with check (
    public.has_role_at_least('gerencial')
    or (
      public.has_role_at_least('participante')
      and exists (
        select 1
        from public.projects p
        where p.id = project_id and p.owner_id = auth.uid()
      )
    )
  );
