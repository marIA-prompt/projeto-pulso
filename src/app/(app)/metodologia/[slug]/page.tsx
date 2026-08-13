import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { ContentPage } from '@/components/ContentPage';
import { clsx } from '@/lib/clsx';

const ABAS = [
  { slug: 'metodologia-grupo', label: 'Metodologia do Grupo' },
  { slug: 'metodologia-executiva', label: 'Metodologia Executiva' },
];

export default async function MetodologiaPage({ params }: { params: { slug: string } }) {
  await requireUser();
  if (!ABAS.some((a) => a.slug === params.slug)) notFound();

  const supabase = createClient();
  const { data } = await supabase
    .from('content_pages').select('title, body_md').eq('slug', params.slug).single();
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <nav aria-label="Documentos de metodologia" className="flex flex-wrap gap-2">
        {ABAS.map((a) => (
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
