import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { Kpis } from '@/components/dashboard/Kpis';
import { Acompanhamento } from '@/components/dashboard/Acompanhamento';
import { RankingColaboradores } from '@/components/dashboard/RankingColaboradores';
import { Empty } from '@/components/ui/Card';
import { dataLonga } from '@/lib/format';
import { nomeProprietario } from '@/lib/pessoas';
import { montarRankings, type PessoaRanking, type PresencaRanking, type ProjetoRanking } from '@/lib/ranking';
import type { DashboardRow, PortfolioKpis, AttendanceKpi, ExperienceLevel, Stage } from '@/lib/types';

export const metadata = { title: 'Acompanhamento — Pulso' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  await requireUser();
  const supabase = createClient();

  // Server Component busca os dados agregados sob RLS; o filtro/gráfico
  // roda no cliente sobre o conjunto já autorizado (decisão D2).
  const [
    { data: rows },
    { data: kpis },
    { data: encontros },
    { data: donos },
    { data: pessoasHub },
    presencaRes,
  ] = await Promise.all([
    supabase.from('v_projects_dashboard').select('*').order('dias_sem_atualizacao', { ascending: false }),
    supabase.from('v_portfolio_kpis').select('*').single(),
    supabase.from('v_attendance_kpis').select('*').order('scheduled_at', { ascending: false }).limit(1),
    supabase.from('projects')
      .select('id, owner_id, created_at, stage, concluded_at, last_activity_at, is_legacy_import, tool_tags, hours_saved_month, profiles!owner_id(full_name)')
      .is('archived_at', null),
    supabase.from('profiles')
      .select('id, full_name, nickname, avatar_url, experience_level, languages, automations, available, bio, contact, areas(name)')
      .eq('active', true),
    supabase.from('v_presenca_recente').select('user_id, presentes_3m, convites_3m'),
  ]);

  const donoPorId = new Map(
    (donos ?? []).map((d) => {
      const perfil = d.profiles as unknown as { full_name: string | null } | { full_name: string | null }[] | null;
      const p = Array.isArray(perfil) ? perfil[0] : perfil;
      return [d.id as string, {
        owner_id: (d.owner_id as string | null) ?? null,
        owner_name: nomeProprietario(d.owner_id as string | null, p),
        created_at: (d.created_at as string | null) ?? null,
      }];
    }),
  );

  const lista = ((rows ?? []) as DashboardRow[]).map((r) => {
    const extra = donoPorId.get(r.id);
    return {
      ...r,
      owner_id: extra?.owner_id ?? r.owner_id ?? null,
      owner_name: extra?.owner_name ?? r.owner_name ?? 'Sem proprietário',
      created_at: extra?.created_at ?? r.created_at ?? null,
    };
  });
  const indicadores = (kpis ?? {
    total_iniciativas: 0, concluidas: 0, ativas: 0,
    horas_mes_devolvidas: 0, horas_mes_portfolio_total: 0,
    areas_com_iniciativa: 0, com_uso_de_ia: 0,
  }) as PortfolioKpis;
  const ultimoEncontro = (encontros?.[0] ?? null) as AttendanceKpi | null;

  const pessoasRank: PessoaRanking[] = (pessoasHub ?? []).map((p) => {
    const area = p.areas as unknown as { name: string } | { name: string }[] | null;
    const a = Array.isArray(area) ? area[0] : area;
    return {
      id: p.id as string,
      full_name: (p.full_name as string | null) ?? null,
      nickname: (p.nickname as string | null) ?? null,
      avatar_url: (p.avatar_url as string | null) ?? null,
      experience_level: (p.experience_level as ExperienceLevel | null) ?? null,
      languages: (p.languages as string[] | null) ?? [],
      automations: (p.automations as string[] | null) ?? [],
      available: (p.available as boolean | null) ?? false,
      bio: (p.bio as string | null) ?? null,
      contact: (p.contact as string | null) ?? null,
      area_name: a?.name ?? null,
    };
  });
  const projetosRank: ProjetoRanking[] = (donos ?? []).map((d) => ({
    id: d.id as string,
    owner_id: (d.owner_id as string | null) ?? null,
    stage: d.stage as Stage,
    concluded_at: (d.concluded_at as string | null) ?? null,
    last_activity_at: (d.last_activity_at as string) ?? new Date(0).toISOString(),
    is_legacy_import: (d.is_legacy_import as boolean | null) ?? false,
    tool_tags: (d.tool_tags as string[] | null) ?? [],
    hours_saved_month: d.hours_saved_month == null ? null : Number(d.hours_saved_month),
  }));
  const presencasRank: PresencaRanking[] = presencaRes.error
    ? []
    : ((presencaRes.data ?? []) as PresencaRanking[]).map((p) => ({
      user_id: p.user_id,
      presentes_3m: Number(p.presentes_3m) || 0,
      convites_3m: Number(p.convites_3m) || 0,
    }));
  const rankings = montarRankings(pessoasRank, projetosRank, presencasRank, new Date());

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

      {searchParams.erro === 'sem-permissao' && (
        <p role="alert" className="rounded-s border border-[var(--sig-warn)] bg-[var(--sig-warn-bg)] p-3 text-sm text-[var(--sig-warn)]">
          Você não tem permissão para acessar essa área.
        </p>
      )}

      <noscript>
        <p className="rounded-s border border-[var(--sig-warn)] bg-[var(--sig-warn-bg)] p-3 text-sm text-[var(--sig-warn)]">
          Os filtros e gráficos precisam de JavaScript. Os indicadores abaixo continuam legíveis sem ele.
        </p>
      </noscript>

      <Kpis kpis={indicadores} frequencia={ultimoEncontro} />

      <RankingColaboradores rankings={rankings} />

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
