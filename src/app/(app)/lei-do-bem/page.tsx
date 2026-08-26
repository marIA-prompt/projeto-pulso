import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { hasRoleAtLeast } from '@/lib/types';
import { LeiDoBemPainel, type AvaliacaoLeiDoBem } from './LeiDoBemPainel';

export const metadata = { title: 'Lei do Bem — Pulso' };
export const dynamic = 'force-dynamic';

export default async function LeiDoBemPage() {
  const perfil = await requireUser();
  const supabase = createClient();
  const [{ data }, { data: pessoas }] = await Promise.all([
    supabase
      .from('lei_do_bem_avaliacoes')
      .select('*, projects!inner(id, title, directorate, area_id, updated_at, areas(name)), responsavel:profiles!responsavel_auditoria_id(id, full_name)')
      .order('updated_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('active', true)
      .order('full_name'),
  ]);

  const avaliacoes = ((data ?? []) as unknown as AvaliacaoLeiDoBem[]).map((avaliacao) => ({
    ...avaliacao,
    projects: Array.isArray(avaliacao.projects) ? avaliacao.projects[0] : avaliacao.projects,
    responsavel: Array.isArray(avaliacao.responsavel) ? avaliacao.responsavel[0] ?? null : avaliacao.responsavel,
  }));

  return (
    <LeiDoBemPainel
      avaliacoes={avaliacoes}
      pessoas={pessoas ?? []}
      podeGerenciar={hasRoleAtLeast(perfil.role, 'gerencial')}
    />
  );
}
