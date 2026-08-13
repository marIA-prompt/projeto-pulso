import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { ProjetoForm } from '@/components/ProjetoForm';
import { criarProjeto } from '../actions';

export const metadata = { title: 'Nova iniciativa — Pulso' };

export default async function NovoProjetoPage() {
  await requireUser();
  const supabase = createClient();
  const { data: areas } = await supabase
    .from('areas').select('id, name').eq('is_real_area', true).order('name');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Cadastrar iniciativa</h1>
        <p className="mt-2 text-sm leading-relaxed text-g60">
          Descreva o problema antes da solução — é assim que outras áreas descobrem
          que têm a mesma dor.
        </p>
      </header>
      <ProjetoForm action={criarProjeto} areas={areas ?? []} rotulo="Cadastrar iniciativa" />
    </div>
  );
}
