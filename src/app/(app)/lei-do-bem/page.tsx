import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { hasRoleAtLeast } from '@/lib/types';
import type { LdbAvaliacaoRow, LdbHistoricoRow } from '@/lib/leiDoBem';
import { LeiDoBemPainel } from './LeiDoBemPainel';

export const metadata = { title: 'Lei do Bem — Pulso' };
export const dynamic = 'force-dynamic';

type HistoricoLinha = LdbHistoricoRow & {
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

export default async function LeiDoBemPage() {
  const perfil = await requireUser();
  const supabase = createClient();

  const [{ data: avaliacoes }, { data: historico }, { data: pessoas }] = await Promise.all([
    supabase.from('v_lei_do_bem').select('*').order('updated_at', { ascending: false }),
    supabase
      .from('lei_do_bem_status_historico')
      .select('*, profiles!alterado_por(full_name)')
      .order('criado_em', { ascending: false }),
    supabase.from('profiles').select('id, full_name').eq('active', true).order('full_name'),
  ]);

  const historicoRows: LdbHistoricoRow[] = ((historico ?? []) as unknown as HistoricoLinha[]).map((h) => {
    const p = Array.isArray(h.profiles) ? (h.profiles[0] ?? null) : h.profiles;
    return {
      id: h.id,
      avaliacao_id: h.avaliacao_id,
      status_anterior: h.status_anterior,
      status_novo: h.status_novo,
      alterado_por: h.alterado_por,
      alterado_por_nome: p?.full_name ?? null,
      criado_em: h.criado_em,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">PD&I · Lei 11.196/2005</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Lei do Bem</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-g60">
          Iniciativas que passaram pela pré-análise de enquadramento. A{' '}
          <strong className="text-g80">classificação da triagem</strong> é calculada
          automaticamente no cadastro; o <strong className="text-g80">status</strong> é o estágio
          do processo de auditoria, controlado pelo time de PD&I. A triagem sinaliza — nunca
          bloqueia: até as de baixo potencial entram aqui para revisão humana.
        </p>
      </header>

      <LeiDoBemPainel
        avaliacoes={(avaliacoes ?? []) as unknown as LdbAvaliacaoRow[]}
        historico={historicoRows}
        pessoas={pessoas ?? []}
        podeAuditar={hasRoleAtLeast(perfil.role, 'gerencial')}
      />
    </div>
  );
}
