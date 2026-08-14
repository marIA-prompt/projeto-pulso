import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { PerfilForm } from '../PerfilForm';

export const metadata = { title: 'Meu perfil — Comunidade Pulso' };
export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  const perfil = await requireUser();
  const supabase = createClient();

  const { data } = await supabase
    .from('profiles')
    .select('full_name, nickname, avatar_url, headline, bio, experience_level, languages, automations, interests, projects_done, contact, available')
    .eq('id', perfil.id)
    .single();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">Hub da Comunidade</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Meu perfil</h1>
          <p className="mt-2 text-sm leading-relaxed text-g60">
            Preencha suas habilidades para que a comunidade te encontre quando precisar de alguém com o seu perfil.
          </p>
        </div>
        <Link
          href="/comunidade"
          aria-label="Fechar e voltar para a Comunidade"
          className="shrink-0 rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g60 hover:bg-g20"
        >
          ✕ Fechar
        </Link>
      </header>

      <PerfilForm valores={data ?? {}} nomeCompleto={perfil.full_name} />
    </div>
  );
}
