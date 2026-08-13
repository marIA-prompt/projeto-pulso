import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { Kpis } from '@/components/dashboard/Kpis';
import { Acompanhamento } from '@/components/dashboard/Acompanhamento';
import { Empty } from '@/components/ui/Card';
import { dataLonga } from '@/lib/format';
import type { DashboardRow, PortfolioKpis, AttendanceKpi } from '@/lib/types';

export const metadata = { title: 'Acompanhamento — Pulso' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  await requireUser();
  const supabase = createClient();

  // Server Component busca os dados agregados sob RLS; o filtro/gráfico
  // roda no cliente sobre o conjunto já autorizado (decisão D2).
  const [{ data: rows }, { data: kpis }, { data: encontros }] = await Promise.all([
    supabase.from('v_projects_dashboard').select('*').order('dias_sem_atualizacao', { ascending: false }),
    supabase.from('v_portfolio_kpis').select('*').single(),
    supabase.from('v_attendance_kpis').select('*').order('scheduled_at', { ascending: false }).limit(1),
  ]);

  const lista = (rows ?? []) as DashboardRow[];
  const indicadores = (kpis ?? {
    total_iniciativas: 0, concluidas: 0, ativas: 0,
    horas_mes_devolvidas: 0, horas_mes_portfolio_total: 0,
    areas_com_iniciativa: 0, com_uso_de_ia: 0,
  }) as PortfolioKpis;
  const ultimoEncontro = (encontros?.[0] ?? null) as AttendanceKpi | null;

  return (
    <div className="space-y-6">
      <header>
        <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">Pulso do portfólio</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Acompanhamento</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-g60">
          Posição de {dataLonga(new Date().toISOString())}. Tudo aqui é calculado na hora
          da consulta — nenhuma data de referência fica congelada.
        </p>
      </header>

      <noscript>
        <p className="rounded-s border border-[var(--sig-warn)] bg-[var(--sig-warn-bg)] p-3 text-sm text-[var(--sig-warn)]">
          Os filtros e gráficos precisam de JavaScript. Os indicadores abaixo continuam legíveis sem ele.
        </p>
      </noscript>

      <Kpis kpis={indicadores} frequencia={ultimoEncontro} />

      {lista.length === 0 ? (
        <Empty titulo="Nenhuma iniciativa cadastrada ainda. Assim que a primeira entrar, o painel ganha vida." />
      ) : (
        <Suspense fallback={<p className="text-sm text-g50">Carregando o portfólio…</p>}>
          <Acompanhamento rows={lista} />
        </Suspense>
      )}
    </div>
  );
}
