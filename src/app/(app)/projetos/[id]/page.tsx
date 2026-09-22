import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { ProjetoForm } from '@/components/ProjetoForm';
import { ProjetoLeitura } from '@/components/ProjetoLeitura';
import { atualizarProjeto } from '../actions';
import { dataLonga } from '@/lib/format';
import { hasRoleAtLeast } from '@/lib/types';
import { ehVisualizacaoCadastro, hrefVoltarCadastro } from '@/lib/lei-do-bem';

export const dynamic = 'force-dynamic';

export default async function EditarProjetoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { visualizar?: string; origem?: string };
}) {
  const perfil = await requireUser();
  const supabase = createClient();

  const [{ data: projeto }, { data: areas }, { data: pessoas }, { data: leiDoBem }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('areas').select('id, name').eq('is_real_area', true).order('name'),
    supabase.from('profiles').select('id, full_name').eq('active', true).order('full_name'),
    supabase.from('lei_do_bem_avaliacoes').select('*').eq('project_id', params.id).maybeSingle(),
  ]);

  if (!projeto) notFound();

  const visualizar = ehVisualizacaoCadastro(searchParams.visualizar);
  const origemLeiDoBem = searchParams.origem === 'lei-do-bem';
  const voltarHref = hrefVoltarCadastro(searchParams.origem);
  const podeEditar = !visualizar && (projeto.owner_id === perfil.id || hasRoleAtLeast(perfil.role, 'gerencial'));
  const acao = atualizarProjeto.bind(null, params.id);
  const areaNome = areas?.find((a) => a.id === projeto.area_id)?.name ?? null;
  const ownerNome = pessoas?.find((p) => p.id === projeto.owner_id)?.full_name?.trim() || 'Sem proprietário';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">
            {visualizar || !podeEditar ? 'Cadastro da iniciativa' : 'Atualizar iniciativa'}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{projeto.title}</h1>
          <p className="num mt-2 text-sm text-g50">
            Última atualização: {dataLonga(projeto.last_activity_at)}
          </p>
        </div>
        <Link
          href={voltarHref}
          aria-label={origemLeiDoBem ? 'Fechar e voltar para Lei do Bem' : 'Fechar e voltar para Iniciativas'}
          title="Fechar"
          className="shrink-0 rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g60 hover:bg-g20"
        >
          ✕ Fechar
        </Link>
      </header>

      {(visualizar || !podeEditar) && (
        <p role="status" className="rounded-s border-l-[3px] border-[var(--yellow)] bg-[var(--now-tint-bg)] px-4 py-3 text-sm leading-relaxed text-g90">
          {visualizar
            ? 'Cadastro em somente visualização. As informações originalmente registradas não podem ser alteradas por aqui.'
            : 'Você pode acompanhar esta iniciativa, mas só o dono ou um administrador edita.'}
        </p>
      )}

      {podeEditar ? (
        <ProjetoForm
          action={acao}
          areas={areas ?? []}
          pessoas={pessoas ?? []}
          valores={projeto}
          leiDoBem={leiDoBem}
          rotulo="Atualizar"
          cancelHref="/projetos"
        />
      ) : (
        <ProjetoLeitura
          projeto={projeto}
          areaNome={areaNome}
          ownerNome={ownerNome}
          leiDoBem={leiDoBem}
        />
      )}
    </div>
  );
}
