'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { hasRoleAtLeast } from '@/lib/types';
import {
  LEI_DO_BEM_PRIORIDADES,
  LEI_DO_BEM_STATUS,
} from '@/lib/lei-do-bem';

export type EstadoAuditoria = { ok?: boolean; erro?: string };

const Auditoria = z.object({
  status: z.enum(LEI_DO_BEM_STATUS),
  responsavel_auditoria_id: z.string().uuid().nullable(),
  parecer: z.string().nullable(),
  prioridade: z.enum(LEI_DO_BEM_PRIORIDADES).nullable(),
  enviar_clickup: z.boolean(),
  descricao_projeto: z.string().nullable(),
  elemento_tecnologico_novo: z.string().nullable(),
  barreira_desafio_tecnologico: z.string().nullable(),
  metodologia_metodos: z.string().nullable(),
  descritivo_complementar: z.string().nullable(),
});

export async function atualizarAuditoriaLeiDoBem(
  id: string,
  _prev: EstadoAuditoria,
  form: FormData,
): Promise<EstadoAuditoria> {
  const perfil = await requireUser();
  if (!hasRoleAtLeast(perfil.role, 'gerencial')) {
    return { erro: 'Só gerencial ou administrador edita a auditoria da Lei do Bem.' };
  }

  const vazio = (v: FormDataEntryValue | null) => (v === '' || v == null ? null : v);
  const parsed = Auditoria.safeParse({
    status: form.get('status'),
    responsavel_auditoria_id: vazio(form.get('responsavel_auditoria_id')),
    parecer: vazio(form.get('parecer')),
    prioridade: vazio(form.get('prioridade')),
    enviar_clickup: form.get('enviar_clickup') === 'on' || form.get('enviar_clickup') === 'true',
    descricao_projeto: vazio(form.get('descricao_projeto')),
    elemento_tecnologico_novo: vazio(form.get('elemento_tecnologico_novo')),
    barreira_desafio_tecnologico: vazio(form.get('barreira_desafio_tecnologico')),
    metodologia_metodos: vazio(form.get('metodologia_metodos')),
    descritivo_complementar: vazio(form.get('descritivo_complementar')),
  });
  if (!parsed.success) return { erro: parsed.error.issues[0].message };

  const supabase = createClient();
  const { error, count } = await supabase
    .from('lei_do_bem_avaliacoes')
    .update(parsed.data, { count: 'exact' })
    .eq('id', id);

  if (error) return { erro: 'Não foi possível salvar o parecer da auditoria.' };
  if (!count) return { erro: 'Não foi possível atualizar esta avaliação.' };

  revalidatePath('/lei-do-bem');
  return { ok: true };
}

export async function moverStatusLeiDoBem(
  id: string,
  novoStatus: string,
): Promise<EstadoAuditoria> {
  const perfil = await requireUser();
  if (!hasRoleAtLeast(perfil.role, 'gerencial')) {
    return { erro: 'Só gerencial ou administrador altera o status da auditoria.' };
  }
  if (!LEI_DO_BEM_STATUS.includes(novoStatus as (typeof LEI_DO_BEM_STATUS)[number])) {
    return { erro: 'Status inválido.' };
  }

  const supabase = createClient();
  const { error, count } = await supabase
    .from('lei_do_bem_avaliacoes')
    .update({ status: novoStatus }, { count: 'exact' })
    .eq('id', id);

  if (error) return { erro: 'Não foi possível mover esta iniciativa.' };
  if (!count) return { erro: 'Não foi possível atualizar o status.' };

  revalidatePath('/lei-do-bem');
  return { ok: true };
}
