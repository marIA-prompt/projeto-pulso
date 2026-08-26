'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { hasRoleAtLeast } from '@/lib/types';
import {
  LEI_DO_BEM_PRIORIDADES,
  LEI_DO_BEM_STATUS,
  type LeiDoBemStatus,
} from '@/lib/lei-do-bem';

export type EstadoAuditoria = { ok?: boolean; erro?: string };

const Auditoria = z.object({
  status: z.enum(LEI_DO_BEM_STATUS),
  responsavel_auditoria_id: z.string().uuid().nullable(),
  parecer: z.string().max(10000),
  prioridade: z.enum(LEI_DO_BEM_PRIORIDADES).nullable(),
  enviar_clickup: z.boolean(),
});

async function exigirAuditoria() {
  const perfil = await requireUser();
  if (!hasRoleAtLeast(perfil.role, 'gerencial')) return null;
  return perfil;
}

export async function atualizarAuditoria(
  id: string,
  dados: z.infer<typeof Auditoria>,
): Promise<EstadoAuditoria> {
  if (!await exigirAuditoria()) {
    return { erro: 'Seu perfil pode acompanhar, mas não editar a auditoria.' };
  }
  const parsed = Auditoria.safeParse(dados);
  if (!parsed.success) return { erro: 'Revise os campos da auditoria.' };

  const supabase = createClient();
  const { error, count } = await supabase
    .from('lei_do_bem_avaliacoes')
    .update(parsed.data, { count: 'exact' })
    .eq('id', id);

  if (error || !count) return { erro: 'Não foi possível salvar a avaliação.' };
  revalidatePath('/lei-do-bem');
  return { ok: true };
}

export async function moverStatusLeiDoBem(
  id: string,
  status: LeiDoBemStatus,
): Promise<EstadoAuditoria> {
  if (!await exigirAuditoria()) {
    return { erro: 'Seu perfil pode acompanhar, mas não alterar o status.' };
  }
  if (!LEI_DO_BEM_STATUS.includes(status)) return { erro: 'Status inválido.' };

  const supabase = createClient();
  const { error, count } = await supabase
    .from('lei_do_bem_avaliacoes')
    .update({ status }, { count: 'exact' })
    .eq('id', id);

  if (error || !count) return { erro: 'Não foi possível alterar o status.' };
  revalidatePath('/lei-do-bem');
  return { ok: true };
}
