import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { hasRoleAtLeast } from '@/lib/types';
import { ProjetoForm } from '@/components/ProjetoForm';
import { criarProjeto } from '../actions';

export const metadata = { title: 'Nova iniciativa — Pulso' };

export default async function NovoProjetoPage() {
  const perfil = await requireUser();
  // Leitor é somente leitura: não abre a tela de cadastro.
  if (!hasRoleAtLeast(perfil.role, 'participante')) redirect('/projetos');

  const supabase = createClient();
  const { data: areas } = await supabase
    .from('areas').select('id, name').eq('is_real_area', true).order('name');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastrar iniciativa</h1>
          <p className="mt-2 text-sm leading-relaxed text-g60">
            Descreva o problema antes da solução — é assim que outras áreas descobrem
            que têm a mesma dor.
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
      <ProjetoForm action={criarProjeto} areas={areas ?? []} rotulo="Cadastrar iniciativa" cancelHref="/projetos" />
    </div>
  );
}
