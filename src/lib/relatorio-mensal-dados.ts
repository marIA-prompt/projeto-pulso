import type { SupabaseClient } from '@supabase/supabase-js';
import { nomeProprietario } from './pessoas';
import {
  montarRelatorioMensal,
  numeroOuNulo,
  type DiretoriaCatalogo,
  type IniciativaRelatorio,
  type PacoteRelatorio,
} from './relatorio-mensal';
import type { Stage } from './types';

export type CargaRelatorio =
  | { ok: true; pacote: PacoteRelatorio }
  | { ok: false; erro: string; detalhe?: string };

type AreaRow = { id: string; name: string; diretoria_id: string | null };
type DiretoriaRow = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  diretor_nome: string | null;
  diretor_email: string | null;
  emails_copia: string[] | null;
  aliases: string[] | null;
};
type PerfilJoin = { full_name: string | null } | { full_name: string | null }[] | null;

type ProjetoRow = {
  id: string;
  title: string;
  stage: Stage;
  directorate: string | null;
  area_id: string | null;
  owner_id: string | null;
  hours_saved_month: number | string | null;
  cost_saved_month: number | string | null;
  uses_ai: boolean | null;
  uses_ai_tradicional: boolean | null;
  uses_ai_generativa: boolean | null;
  created_at: string;
  last_activity_at: string;
  concluded_at: string | null;
  is_legacy_import: boolean | null;
  profiles: PerfilJoin;
};

function um<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export function paraIniciativa(
  row: ProjetoRow,
  area: { name: string; diretoria_id: string | null } | undefined,
): IniciativaRelatorio {
  return {
    id: row.id,
    title: row.title,
    stage: row.stage,
    area_name: area?.name ?? null,
    diretoria_id: area?.diretoria_id ?? null,
    directorate: row.directorate,
    owner_name: nomeProprietario(row.owner_id, um(row.profiles)),
    hours_saved_month: numeroOuNulo(row.hours_saved_month),
    cost_saved_month: numeroOuNulo(row.cost_saved_month),
    uses_ai: Boolean(row.uses_ai || row.uses_ai_tradicional || row.uses_ai_generativa),
    created_at: row.created_at,
    last_activity_at: row.last_activity_at,
    concluded_at: row.concluded_at,
    is_legacy_import: Boolean(row.is_legacy_import),
  };
}

export async function carregarRelatorioMensal(
  supabase: SupabaseClient,
  ano: number,
  mes: number,
  opts?: { agora?: Date; dashboardUrl?: string | null },
): Promise<CargaRelatorio> {
  const [dirs, areas, projetos] = await Promise.all([
    supabase.from('diretorias').select('id, slug, name, sort_order, diretor_nome, diretor_email, emails_copia, aliases').order('sort_order'),
    supabase.from('areas').select('id, name, diretoria_id'),
    supabase
      .from('projects')
      .select('id, title, stage, directorate, area_id, owner_id, hours_saved_month, cost_saved_month, uses_ai, uses_ai_tradicional, uses_ai_generativa, created_at, last_activity_at, concluded_at, is_legacy_import, profiles!owner_id(full_name)')
      .is('archived_at', null),
  ]);

  if (dirs.error) {
    const bruto = dirs.error.message.toLowerCase();
    const faltaCopia = bruto.includes('emails_copia');
    const faltaTabela = bruto.includes('does not exist')
      || bruto.includes('schema cache')
      || bruto.includes('could not find the table');
    return {
      ok: false,
      erro: faltaCopia
        ? 'Não foi possível ler as cópias. Aplique a migration 0020.'
        : faltaTabela
          ? 'Não foi possível ler as diretorias. Aplique as migrations 0017 e 0018.'
          : 'Não foi possível ler as diretorias.',
      detalhe: dirs.error.message,
    };
  }
  if (areas.error || projetos.error) {
    return {
      ok: false,
      erro: 'Não foi possível ler o portfólio para o relatório.',
      detalhe: areas.error?.message ?? projetos.error?.message,
    };
  }

  const porArea = new Map((areas.data as AreaRow[]).map((a) => [a.id, a]));
  const diretorias: DiretoriaCatalogo[] = (dirs.data as DiretoriaRow[]).map((d) => ({
    id: d.id,
    slug: d.slug,
    nome: d.name,
    ordem: d.sort_order,
    diretor_nome: d.diretor_nome,
    diretor_email: d.diretor_email,
    emails_copia: d.emails_copia ?? [],
    aliases: d.aliases ?? [],
  }));
  const iniciativas = ((projetos.data ?? []) as unknown as ProjetoRow[]).map((row) => (
    paraIniciativa(row, row.area_id ? porArea.get(row.area_id) : undefined)
  ));

  return {
    ok: true,
    pacote: montarRelatorioMensal({
      ano,
      mes,
      diretorias,
      iniciativas,
      agora: opts?.agora,
      dashboardUrl: opts?.dashboardUrl,
    }),
  };
}
