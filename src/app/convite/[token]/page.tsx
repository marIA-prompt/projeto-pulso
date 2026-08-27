import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashesDoToken } from '@/lib/invite-token';
import { AceiteForm } from './AceiteForm';
import { ROLE_LABEL, type Role } from '@/lib/types';
import { TemaPublico } from '@/components/TemaToggle';

export const metadata = { title: 'Aceitar convite — Pulso' };
export const dynamic = 'force-dynamic';

function TelaIndisponivel({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--g10)] px-4">
      <TemaPublico />
      <div className="card max-w-sm p-6 text-center">
        <h1 className="text-xl font-bold">{titulo}</h1>
        <p className="mt-3 text-sm leading-relaxed text-g60">{texto}</p>
        <p className="mt-4 text-sm text-g60">
          Já tem conta?{' '}
          <Link href="/login" className="underline hover:text-g90">Entrar</Link>
          {' · '}
          <Link href="/cadastro" className="underline hover:text-g90">Criar conta</Link>
        </p>
      </div>
    </main>
  );
}

export default async function ConvitePage({ params }: { params: { token: string } }) {
  const admin = createAdminClient();

  const { data: convite } = await admin
    .from('invitations')
    .select('email, role, status, expires_at')
    .in('token_hash', hashesDoToken(params.token))
    .limit(1)
    .maybeSingle();

  if (!convite) {
    return (
      <TelaIndisponivel
        titulo="Convite indisponível"
        texto="Este link não é mais válido. Se um administrador gerou um link novo, o anterior deixa de funcionar — peça o link mais recente."
      />
    );
  }

  if (convite.status === 'accepted') {
    return (
      <TelaIndisponivel
        titulo="Convite já usado"
        texto="Este convite já foi aceito. Entre com o e-mail e a senha definidos no cadastro."
      />
    );
  }

  if (convite.status === 'revoked') {
    return (
      <TelaIndisponivel
        titulo="Convite cancelado"
        texto="Este convite foi cancelado. Peça um novo a um administrador do Pulso."
      />
    );
  }

  if (convite.status !== 'pending' || new Date(convite.expires_at) <= new Date()) {
    return (
      <TelaIndisponivel
        titulo="Convite expirado"
        texto="Este convite expirou. Peça um novo a um administrador do Pulso."
      />
    );
  }

  const { data: areas } = await admin
    .from('areas').select('id, name').eq('is_real_area', true).order('name');

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--g10)] px-4 py-12">
      <TemaPublico />
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
