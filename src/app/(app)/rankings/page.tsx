import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { requireGerencial } from '@/lib/auth';
import { Scorecard } from './Scorecard';
import { ymdPeriodoPadrao, type PessoaRanking, type PresencaEncontro, type PresencaRanking, type ProjetoRanking } from '@/lib/ranking';
import type { ExperienceLevel, Stage } from '@/lib/types';

export const metadata = { title: 'Rankings — Pulso' };
export const dynamic = 'force-dynamic';

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: { de?: string; ate?: string };
}) {
  await requireGerencial();
  const supabase = createClient();
  const padrao = ymdPeriodoPadrao();

  const [{ data: pessoasHub }, { data: donos }, encontrosRes] = await Promise.all([
    supabase.from('profiles')
      .select('id, full_name, nickname, avatar_url, experience_level, languages, automations, available, bio, contact, areas(name)')
      .eq('active', true),
    supabase.from('projects')
      .select('id, owner_id, stage, concluded_at, last_activity_at, is_legacy_import, tool_tags, hours_saved_month, uses_ai, uses_n8n, uses_ai_generativa, score_final, dev_hours')
      .is('archived_at', null),
    supabase.from('v_presenca_encontros').select('user_id, scheduled_at, status'),
  ]);

  const pessoas: PessoaRanking[] = (pessoasHub ?? []).map((p) => {
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
  const projetos: ProjetoRanking[] = (donos ?? []).map((d) => ({
    id: d.id as string,
    owner_id: (d.owner_id as string | null) ?? null,
    stage: d.stage as Stage,
    concluded_at: (d.concluded_at as string | null) ?? null,
    last_activity_at: (d.last_activity_at as string) ?? new Date(0).toISOString(),
    is_legacy_import: (d.is_legacy_import as boolean | null) ?? false,
    tool_tags: (d.tool_tags as string[] | null) ?? [],
    hours_saved_month: d.hours_saved_month == null ? null : Number(d.hours_saved_month),
    uses_ai: (d.uses_ai as boolean | null) ?? false,
    uses_n8n: (d.uses_n8n as boolean | null) ?? false,
    uses_ai_generativa: (d.uses_ai_generativa as boolean | null) ?? false,
    score_final: d.score_final == null ? null : Number(d.score_final),
    dev_hours: d.dev_hours == null ? null : Number(d.dev_hours),
  }));

  let presencas: Array<PresencaRanking | PresencaEncontro> = [];
  if (encontrosRes.error) {
    const recente = await supabase.from('v_presenca_recente').select('user_id, presentes_3m, convites_3m');
    if (!recente.error) {
      presencas = ((recente.data ?? []) as PresencaRanking[]).map((p) => ({
        user_id: p.user_id,
        presentes_3m: Number(p.presentes_3m) || 0,
        convites_3m: Number(p.convites_3m) || 0,
      }));
    }
  } else {
    presencas = ((encontrosRes.data ?? []) as PresencaEncontro[]).map((p) => ({
      user_id: p.user_id,
      scheduled_at: p.scheduled_at,
      status: p.status,
    }));
  }

  const de = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.de ?? '') ? searchParams.de! : padrao.de;
  const ate = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.ate ?? '') ? searchParams.ate! : padrao.ate;

  return (
    <div className="space-y-6">
      <header>
        <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">Placar do time</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Rankings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-g60">
          Scorecard gerencial das três categorias do Pulso: volume de entregas,
          conhecimento técnico e índice de ajuda entre pares. O recorte de datas
          atualiza o placar na hora.
        </p>
      </header>

      <noscript>
        <p className="rounded-s border border-[var(--sig-warn)] bg-[var(--sig-warn-bg)] p-3 text-sm text-[var(--sig-warn)]">
          O filtro de período e o placar interativo precisam de JavaScript.
        </p>
      </noscript>

      <Suspense fallback={<p className="text-sm text-g50">Montando o placar…</p>}>
        <Scorecard
          pessoas={pessoas}
          projetos={projetos}
          presencas={presencas}
          deInicial={de}
          ateInicial={ate}
        />
      </Suspense>
    </div>
  );
}
