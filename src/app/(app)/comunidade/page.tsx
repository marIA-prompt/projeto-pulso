import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/ui/Card';
import type { HubProfile } from '@/lib/types';
import { Comunidade } from './Comunidade';

export const metadata = { title: 'Comunidade — Pulso' };
export const dynamic = 'force-dynamic';

export default async function ComunidadePage({
  searchParams,
}: { searchParams: { ok?: string } }) {
  const perfil = await requireUser();
  const supabase = createClient();

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, nickname, avatar_url, headline, bio, experience_level, languages, automations, interests, projects_done, contact, available, role, areas(name)')
    .eq('active', true)
    .order('full_name');

  const pessoas: HubProfile[] = (data ?? []).map((p) => {
    const area = p.areas as unknown as { name: string } | null;
    return {
      id: p.id,
      full_name: p.full_name,
      nickname: p.nickname,
      avatar_url: p.avatar_url,
      headline: p.headline,
      bio: p.bio,
      experience_level: p.experience_level,
      languages: p.languages ?? [],
      automations: p.automations ?? [],
      interests: p.interests ?? [],
      projects_done: p.projects_done,
      contact: p.contact,
      available: p.available ?? true,
      role: p.role,
      area_name: area?.name ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">Hub da Comunidade</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Comunidade</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-g60">
            Encontre especialistas e entusiastas do Pulso pelas habilidades, ferramentas e interesses.
            Precisa de alguém para tirar uma ideia do papel? Busque aqui — e mantenha o seu perfil atualizado.
          </p>
        </div>
        <Link href="/comunidade/perfil"><Button>Editar meu perfil</Button></Link>
      </header>

      {searchParams.ok === 'perfil' && (
        <p role="status" className="rounded-s bg-[var(--sig-ok-bg)] px-3 py-2 text-sm text-[var(--sig-ok)]">
          Perfil atualizado.
        </p>
      )}

      {pessoas.length === 0 ? (
        <Empty titulo="Nenhuma pessoa na comunidade ainda." />
      ) : (
        <Comunidade pessoas={pessoas} meuId={perfil.id} />
      )}
    </div>
  );
}
