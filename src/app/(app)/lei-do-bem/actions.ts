'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { hasRoleAtLeast } from '@/lib/types';

const STATUS = ['backlog', 'em_avaliacao_interna', 'enquadrado', 'nao_enquadrado'] as const;
const PRIORIDADES = ['baixa', 'media', 'alta'] as const;

export async function atualizarAuditoriaLeiDoBem(id: string, form: FormData) {
  const perfil = await requireUser();
  if (!hasRoleAtLeast(perfil.role, 'gerencial')) return { erro: 'Seu perfil não pode editar a auditoria Lei do Bem.' };
  const status = String(form.get('status'));
  const prioridade = String(form.get('prioridade'));
  if (!STATUS.includes(status as (typeof STATUS)[number])) return { erro: 'Status inválido.' };
  if (prioridade && !PRIORIDADES.includes(prioridade as (typeof PRIORIDADES)[number])) return { erro: 'Prioridade inválida.' };
  const responsavel = String(form.get('responsavel_auditoria_id') ?? '');
  const supabase = createClient();
  const { error } = await supabase.from('lei_do_bem_avaliacoes').update({
    status,
    responsavel_auditoria_id: responsavel || null,
    parecer: String(form.get('parecer') ?? '').trim() || null,
    prioridade: prioridade || null,
    enviar_clickup: form.get('enviar_clickup') === 'on',
  }).eq('id', id);
  if (error) return { erro: 'Não foi possível atualizar a auditoria.' };
  revalidatePath('/lei-do-bem');
  return { ok: true };
}

export async function moverLeiDoBem(id: string, status: string) {
  const perfil = await requireUser();
  if (!hasRoleAtLeast(perfil.role, 'gerencial')) return { erro: 'Seu perfil não pode editar a auditoria Lei do Bem.' };
  if (!STATUS.includes(status as (typeof STATUS)[number])) return { erro: 'Status inválido.' };
  const supabase = createClient();
  const { error } = await supabase.from('lei_do_bem_avaliacoes').update({ status }).eq('id', id);
  if (error) return { erro: 'Não foi possível mover a iniciativa.' };
  revalidatePath('/lei-do-bem');
  return { ok: true };
}
