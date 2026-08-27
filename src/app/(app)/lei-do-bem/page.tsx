import { createClient } from '@/lib/supabase/server';
import { requireGerencial } from '@/lib/auth';
import { Empty } from '@/components/ui/Card';
import { LeiDoBemQuadro, type LinhaLeiDoBem, type LogStatusLeiDoBem } from '@/components/lei-do-bem/LeiDoBemQuadro';
import type { PessoaOpcao } from '@/lib/pessoas';

export const metadata = { title: 'Lei do Bem — Pulso' };
export const dynamic = 'force-dynamic';

export default async function LeiDoBemPage() {
  await requireGerencial();
  const supabase = createClient();

  const [{ data: linhas }, { data: pessoas }, { data: logs }] = await Promise.all([
    supabase.from('v_lei_do_bem').select('*').order('updated_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').eq('active', true).order('full_name'),
    supabase.from('lei_do_bem_status_log').select('id, avaliacao_id, de, para, created_at, changed_by').order('created_at', { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Lei do Bem</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-g60">
          Pré-análise de enquadramento na Lei 11.196/2005. A triagem preliminar
          sinaliza potencial técnico — não substitui validação técnica, fiscal,
          contábil e documental, e nenhuma classificação bloqueia a iniciativa.
        </p>
      </header>

      {(linhas ?? []).length === 0 ? (
        <Empty titulo="Nenhuma iniciativa passou pela triagem Lei do Bem ainda. No cadastro, marque que ela pode se enquadrar." />
      ) : (
        <LeiDoBemQuadro
          linhas={(linhas ?? []) as LinhaLeiDoBem[]}
          pessoas={(pessoas ?? []) as PessoaOpcao[]}
          logs={(logs ?? []) as LogStatusLeiDoBem[]}
          podeAuditar
        />
      )}
    </div>
  );
}
