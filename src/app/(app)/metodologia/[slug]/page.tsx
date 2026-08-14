import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { ContentPage } from '@/components/ContentPage';
import { clsx } from '@/lib/clsx';
import { hasRoleAtLeast } from '@/lib/types';

const ABAS = [
  { slug: 'metodologia-grupo', label: 'Metodologia do Grupo', min: 'leitor' as const },
  { slug: 'metodologia-executiva', label: 'Metodologia Executiva', min: 'gerencial' as const },
];

export default async function MetodologiaPage({ params }: { params: { slug: string } }) {
  const perfil = await requireUser();
  const aba = ABAS.find((a) => a.slug === params.slug);
  if (!aba) notFound();

  // A Metodologia Executiva é dirigida à camada gerencial/executiva — só
  // gerencial e administrador acessam. Demais papéis voltam à do Grupo.
  if (!hasRoleAtLeast(perfil.role, aba.min)) {
    redirect('/metodologia/metodologia-grupo?erro=sem-permissao');
  }

  const abasVisiveis = ABAS.filter((a) => hasRoleAtLeast(perfil.role, a.min));

  const supabase = createClient();
  const { data } = await supabase
    .from('content_pages').select('title, body_md').eq('slug', params.slug).single();
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <nav aria-label="Documentos de metodologia" className="flex flex-wrap gap-2">
        {abasVisiveis.map((a) => (
          <Link
            key={a.slug}
            href={`/metodologia/${a.slug}`}
            aria-current={a.slug === params.slug ? 'page' : undefined}
            className={clsx(
              'rounded-s px-3 py-1.5 text-sm font-medium',
              a.slug === params.slug
                ? 'bg-[var(--navy)] text-white'
                : 'border border-g40 text-g60 hover:bg-g20',
            )}
          >
            {a.label}
          </Link>
        ))}
      </nav>
      <ContentPage titulo={data.title} corpo={data.body_md} />
    </div>
  );
}
