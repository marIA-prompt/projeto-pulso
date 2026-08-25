-- Convites não expiram por tempo: só o administrador cancela (status revoked).
-- expires_at deixa de ser obrigatório e perde o default de 7 dias.

alter table public.invitations
  alter column expires_at drop default;

alter table public.invitations
  alter column expires_at drop not null;

update public.invitations
  set expires_at = null
  where expires_at is not null;

comment on column public.invitations.expires_at is
  'Legado. Convites não expiram por data; cancelamento é só via status revoked pelo admin.';
