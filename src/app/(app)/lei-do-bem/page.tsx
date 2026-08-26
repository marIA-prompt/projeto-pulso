import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { LeiDoBemPainel } from './LeiDoBemPainel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Lei do Bem — Pulso' };

export default async function LeiDoBemPage() {
  const perfil = await requireUser();
  const supabase = createClient();
  const [{ data: avaliacoes }, { data: pessoas }] = await Promise.all([
    supabase.from('lei_do_bem_avaliacoes').select(`
      *, projects(title, directorate, areas(name)),
      responsavel:profiles!lei_do_bem_avaliacoes_responsavel_auditoria_id_fkey(full_name)
    `).order('updated_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').eq('active', true).order('full_name'),
  ]);
  const rows = (avaliacoes ?? []).map((a: Record<string, unknown>) => {
    const project = a.projects as { title?: string; directorate?: string | null; areas?: { name?: string | null } | null } | null;
    const responsavel = a.responsavel as { full_name?: string | null } | null;
    return {
      ...a,
      title: project?.title ?? 'Iniciativa sem título',
      directorate: project?.directorate ?? null,
      area_name: project?.areas?.name ?? null,
      responsavel_nome: responsavel?.full_name ?? null,
    };
  });

  return <div className="space-y-6">
    <header>
      <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">Pré-análise de PD&I</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">Lei do Bem</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-g60">Acompanhe a triagem preliminar e a auditoria das iniciativas. A classificação é um sinal técnico inicial e não substitui a validação fiscal, contábil e documental.</p>
    </header>
    <LeiDoBemPainel rows={rows as never} pessoas={pessoas ?? []} role={perfil.role} />
  </div>;
}
