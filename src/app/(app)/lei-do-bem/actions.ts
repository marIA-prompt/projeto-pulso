'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { hasRoleAtLeast } from '@/lib/types';
import { LDB_STATUSES, type LdbStatus } from '@/lib/leiDoBem';

export type EstadoAuditoria = { ok?: boolean; erro?: string };

const SEM_PERMISSAO =
  'Apenas papéis gerenciais (auditoria/PD&I) editam status, parecer, responsável, prioridade e o envio ao ClickUp.';

/** Muda o status da auditoria (drag-and-drop do kanban ou select do painel). */
export async function moverStatusLeiDoBem(
  avaliacaoId: string, novoStatus: string,
): Promise<EstadoAuditoria> {
  const perfil = await requireUser();
  if (!hasRoleAtLeast(perfil.role, 'gerencial')) return { erro: SEM_PERMISSAO };
  if (!LDB_STATUSES.includes(novoStatus as LdbStatus)) return { erro: 'Status inválido.' };

  const supabase = createClient();
  // O trigger do banco (lei_do_bem_guard_auditoria) é a segunda camada da
  // checagem de papel; o histórico de transição é gravado por trigger.
  const { error, count } = await supabase
    .from('lei_do_bem_avaliacoes')
    .update({ status: novoStatus }, { count: 'exact' })
    .eq('id', avaliacaoId);

  if (error) return { erro: 'Não foi possível mover a avaliação. Tente de novo.' };
  if (!count) return { erro: SEM_PERMISSAO };

  revalidatePath('/lei-do-bem');
  return { ok: true };
}

const Auditoria = z.object({
  status: z.enum(['backlog', 'em_avaliacao_interna', 'enquadrado', 'nao_enquadrado']),
  responsavel_auditoria_id: z.string().uuid().nullable().catch(null),
  parecer: z.string().transform((s) => s.trim() || null),
  prioridade: z.enum(['baixa', 'media', 'alta']).nullable().catch(null),
  enviar_clickup: z.boolean(),
});

/** Painel de gestão (§7.4): status, responsável, parecer, prioridade e o
 * flag "Enviar para o ClickUp". A automação de envio é a 2ª parte — aqui o
 * dado só fica consultável (enviar_clickup = true, clickup_sincronizado_em
 * nulo até existir a integração). */
export async function atualizarAuditoria(
  avaliacaoId: string, _prev: EstadoAuditoria, form: FormData,
): Promise<EstadoAuditoria> {
  const perfil = await requireUser();
  if (!hasRoleAtLeast(perfil.role, 'gerencial')) return { erro: SEM_PERMISSAO };

  const vazio = (v: FormDataEntryValue | null) => (v === '' || v == null ? null : v);
  const parsed = Auditoria.safeParse({
    status: form.get('status'),
    responsavel_auditoria_id: vazio(form.get('responsavel_auditoria_id')),
    parecer: form.get('parecer') ?? '',
    prioridade: vazio(form.get('prioridade')),
    enviar_clickup: form.get('enviar_clickup') === 'on',
  });
  if (!parsed.success) return { erro: 'Revise os campos da auditoria e tente de novo.' };

  const supabase = createClient();
  const { error, count } = await supabase
    .from('lei_do_bem_avaliacoes')
    .update(parsed.data, { count: 'exact' })
    .eq('id', avaliacaoId);

  if (error) return { erro: 'Não foi possível salvar a auditoria. Tente de novo.' };
  if (!count) return { erro: SEM_PERMISSAO };

  revalidatePath('/lei-do-bem');
  return { ok: true };
}
