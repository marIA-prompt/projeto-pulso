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
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{projeto.title}</h1>
        <p className="num mt-2 text-sm text-g50">
          Última atualização: {dataLonga(projeto.last_activity_at)}
        </p>
      </header>

      {podeEditar ? (
        <ProjetoForm
          action={acao}
          areas={areas ?? []}
          valores={projeto}
          rotulo="Salvar alterações"
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
