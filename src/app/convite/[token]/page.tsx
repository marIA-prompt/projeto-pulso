import { createAdminClient } from '@/lib/supabase/admin';
import { hashToken } from '@/lib/invite-token';
import { AceiteForm } from './AceiteForm';
import { ROLE_LABEL, type Role } from '@/lib/types';

export const metadata = { title: 'Aceitar convite — Pulso' };
export const dynamic = 'force-dynamic';

export default async function ConvitePage({ params }: { params: { token: string } }) {
  const admin = createAdminClient();

  const { data: convite } = await admin
    .from('invitations')
    .select('email, role, status, expires_at')
    .eq('token_hash', hashToken(params.token))
    .maybeSingle();

  const valido =
    convite && convite.status === 'pending' && new Date(convite.expires_at) > new Date();

  if (!valido) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <div className="card max-w-sm p-6 text-center">
          <h1 className="text-xl font-bold">Convite indisponível</h1>
          <p className="mt-3 text-sm leading-relaxed text-g60">
            Este link já foi usado, expirou ou foi cancelado. Peça um novo convite
            a um administrador do Pulso.
          </p>
        </div>
      </main>
    );
  }

  const { data: areas } = await admin
    .from('areas').select('id, name').eq('is_real_area', true).order('name');

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--g10)] px-4 py-12">
      <div className="w-full max-w-md">
        <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">Bem-vindo ao</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Pulso</h1>
        <p className="mt-3 text-sm leading-relaxed text-g60">
          Convite para <strong className="text-g90">{convite.email}</strong>
          {convite.role !== 'participante' && ` — perfil de ${ROLE_LABEL[convite.role as Role]}`}. Defina sua senha
          para concluir o cadastro.
        </p>
        <AceiteForm token={params.token} areas={areas ?? []} />
      </div>
    </main>
  );
}
