import { conteudoPainel } from './conteudo';
import type { MapasNormalizacao } from './schemas';

/** Colunas de `projects` permitidas pela arquitetura. Nada além disto. */
export const COLUNAS_PROJECTS = [
  'id',
  'title',
  'stage',
  'theme',
  'directorate',
  'area_id',
  'uses_ai',
  'uses_n8n',
  'hours_saved_month',
  'is_legacy_import',
  'archived_at',
  'created_at',
] as const;

export const SELECT_PROJECTS = COLUNAS_PROJECTS.join(', ');

export type IniciativaBruta = {
  id?: string | null;
  title: string;
  stage: string;
  theme?: string | null;
  directorate?: string | null;
  area_id?: string | null;
  uses_ai?: boolean | null;
  uses_n8n?: boolean | null;
  hours_saved_month?: number | null;
  is_legacy_import?: boolean | null;
  archived_at?: string | null;
  created_at?: string | null;
};

export type IniciativaNormalizada = {
  id: string | null;
  title: string;
  stage: string;
  theme: string;
  directorate: string;
  area_id: string | null;
  uses_ai: boolean;
  uses_n8n: boolean;
  hours_saved_month: number | null;
  is_legacy_import: boolean;
  created_at: string | null;
};

/** Aplica um mapa de apelidos. Chave ausente ou nula usa o apelido de `""`, se houver. */
export function aplicarApelido(
  valor: string | null | undefined,
  mapa: Record<string, string>,
): string {
  const chave = valor ?? '';
  if (Object.prototype.hasOwnProperty.call(mapa, chave)) return mapa[chave];
  return chave;
}

export function normalizarIniciativa(
  bruta: IniciativaBruta,
  mapas: MapasNormalizacao,
): IniciativaNormalizada {
  return {
    id: bruta.id ?? null,
    title: bruta.title,
    stage: bruta.stage,
    theme: aplicarApelido(bruta.theme, mapas.tema),
    directorate: aplicarApelido(bruta.directorate, mapas.diretoria),
    area_id: bruta.area_id ?? null,
    uses_ai: bruta.uses_ai === true,
    uses_n8n: bruta.uses_n8n === true,
    hours_saved_month: bruta.hours_saved_month ?? null,
    is_legacy_import: bruta.is_legacy_import === true,
    created_at: bruta.created_at ?? null,
  };
}

export function normalizarIniciativas(
  brutas: IniciativaBruta[],
  mapas: MapasNormalizacao,
): IniciativaNormalizada[] {
  return brutas.map((b) => normalizarIniciativa(b, mapas));
}

/**
 * Leitura só no servidor. O import do cliente é dinâmico para os testes
 * unitários não carregarem `next/headers`.
 */
export async function lerIniciativas(
  mapas: MapasNormalizacao = conteudoPainel.normalizacao,
): Promise<IniciativaNormalizada[]> {
  const { createClient } = await import('../supabase/server');
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .select(SELECT_PROJECTS)
    .is('archived_at', null);

  if (error) {
    throw new Error(`Não foi possível ler as iniciativas: ${error.message}`);
  }

  const vivas = ((data ?? []) as unknown as IniciativaBruta[]).filter((r) => r.archived_at == null);
  return normalizarIniciativas(vivas, mapas);
}
