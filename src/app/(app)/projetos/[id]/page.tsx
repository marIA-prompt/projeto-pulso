import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { ProjetoForm } from '@/components/ProjetoForm';
import { atualizarProjeto } from '../actions';
import { dataLonga } from '@/lib/format';
import { hasRoleAtLeast } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EditarProjetoPage({ params }: { params: { id: string } }) {
  const perfil = await requireUser();
  const supabase = createClient();

  const [{ data: projeto }, { data: areas }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('areas').select('id, name').eq('is_real_area', true).order('name'),
  ]);

  if (!projeto) notFound();

  const podeEditar = projeto.owner_id === perfil.id || hasRoleAtLeast(perfil.role, 'gerencial');
  const acao = atualizarProjeto.bind(null, params.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">Atualizar iniciativa</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{projeto.title}</h1>
          <p className="num mt-2 text-sm text-g50">
            Última atualização: {dataLonga(projeto.last_activity_at)}
          </p>
        </div>
        <Link
          href="/projetos"
          aria-label="Fechar e voltar para Iniciativas"
          title="Fechar"
          className="shrink-0 rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g60 hover:bg-g20"
        >
          ✕ Fechar
        </Link>
      </header>

      {podeEditar ? (
        <ProjetoForm
          action={acao}
          areas={areas ?? []}
          valores={projeto}
          rotulo="Atualizar"
          cancelHref="/projetos"
        />
      ) : (
        <div className="card space-y-3 p-6">
          <p className="text-sm text-g60">
            Você pode acompanhar esta iniciativa, mas só o dono ou um administrador edita.
          </p>
          {projeto.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-g80">{projeto.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
