'use server';

import { randomBytes, createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth';
import { notificar } from '@/lib/n8n';
import { PAPEIS } from '@/lib/types';

export type EstadoAdmin = { erro?: string; ok?: string; link?: string };

const Convite = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  role: z.enum(['leitor', 'participante', 'editor', 'gerencial', 'administrador']),
});

export async function criarConvite(_prev: EstadoAdmin, form: FormData): Promise<EstadoAdmin> {
  const admin = await requireAdmin();
  const parsed = Convite.safeParse({ email: form.get('email'), role: form.get('role') });
  if (!parsed.success) return { erro: parsed.error.issues[0].message };

  // Token em claro só existe aqui e no e-mail. O banco guarda o hash —
  // vazamento da tabela não dá acesso a ninguém.
  const token = randomBytes(32).toString('base64url');
  const token_hash = createHash('sha256').update(token).digest('hex');

  const supabase = createClient();
  const { error } = await supabase.from('invitations').insert({
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    invited_by: admin.id,
    token_hash,
  });

  if (error) {
    return { erro: 'Já existe um convite pendente para esse e-mail. Cancele o anterior ou reenvie.' };
  }

  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/convite/${token}`;
  const enviado = await notificar('W1_CONVITE', {
    email: parsed.data.email, role: parsed.data.role, link,
  });

  revalidatePath('/admin');
  // O link sempre volta para a tela: mesmo com o envio automático (n8n)
  // configurado, o administrador consegue copiar e mandar na hora. O token
  // em claro só existe neste retorno — não fica gravado no banco.
  return enviado
    ? { ok: `Convite enviado para ${parsed.data.email}. Link abaixo, caso queira reenviar manualmente.`, link }
    : { ok: `Convite criado para ${parsed.data.email}. Copie o link abaixo e envie à pessoa convidada.`, link };
}

export async function alterarPapel(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get('id') ?? '');
  const role = String(form.get('role') ?? '');
  if (!PAPEIS.includes(role as (typeof PAPEIS)[number])) return;
  // Sem auto-rebaixamento: quem está logado não pode tirar o próprio administrador.
  if (id === admin.id && role !== 'administrador') return;

  const supabase = createClient();
  await supabase.from('profiles').update({ role }).eq('id', id);
  revalidatePath('/admin');
}

export async function reenviarConvite(form: FormData): Promise<void> {
  await requireAdmin();
  const id = String(form.get('id') ?? '');

  const token = randomBytes(32).toString('base64url');
  const token_hash = createHash('sha256').update(token).digest('hex');

  const supabase = createClient();
  const { data } = await supabase.from('invitations')
    .update({
      token_hash,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
    })
    .eq('id', id).select('email, role').single();

  if (data) {
    const link = `${process.env.NEXT_PUBLIC_SITE_URL}/convite/${token}`;
    await notificar('W1_CONVITE', { email: data.email, role: data.role, link });
  }

  revalidatePath('/admin');
}

export async function cancelarConvite(form: FormData) {
  await requireAdmin();
  const supabase = createClient();
  await supabase.from('invitations')
    .update({ status: 'revoked' })
    .eq('id', String(form.get('id') ?? ''));
  revalidatePath('/admin');
}

export async function alternarAtivo(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get('id') ?? '');
  if (id === admin.id) return;
  const ativo = form.get('active') === 'true';
  const supabase = createClient();
  // Revogação, nunca exclusão física — o histórico de presença e as
  // iniciativas continuam íntegros.
  await supabase.from('profiles').update({ active: !ativo }).eq('id', id);
  revalidatePath('/admin');
}

const Encontro = z.object({
  title: z.string().min(3, 'Dê um nome ao encontro.'),
  scheduled_at: z.string().min(1, 'Informe data e hora.'),
  description: z.string().optional(),
  convidarTodos: z.boolean(),
});

export async function criarEncontro(_prev: EstadoAdmin, form: FormData): Promise<EstadoAdmin> {
  const admin = await requireAdmin();
  const parsed = Encontro.safeParse({
    title: form.get('title'),
    scheduled_at: form.get('scheduled_at'),
    description: form.get('description') ?? '',
    convidarTodos: form.get('convidarTodos') === 'on',
  });
  if (!parsed.success) return { erro: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data: encontro, error } = await supabase.from('meetings').insert({
    title: parsed.data.title,
    scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
    description: parsed.data.description || null,
    created_by: admin.id,
  }).select('id, title, scheduled_at').single();

  if (error || !encontro) return { erro: 'Não foi possível criar o encontro.' };

  // Sem as linhas em 'pending', a taxa de confirmação não tem denominador.
  if (parsed.data.convidarTodos) {
    const service = createAdminClient();
    const { data: pessoas } = await service.from('profiles').select('id').eq('active', true);
    if (pessoas?.length) {
      await service.from('attendance').upsert(
        pessoas.map((p) => ({ meeting_id: encontro.id, user_id: p.id, status: 'pending' as const })),
        { onConflict: 'meeting_id,user_id' },
      );
    }
  }

  await notificar('W2_LEMBRETE_PRESENCA', {
    meetingId: encontro.id, title: encontro.title, scheduledAt: encontro.scheduled_at,
  });

  revalidatePath('/admin');
  revalidatePath('/frequencias');
  return { ok: 'Encontro criado e participantes convidados.' };
}

const EncontroEdicao = z.object({
  id: z.string().uuid(),
  title: z.string().min(3, 'Dê um nome ao encontro.'),
  scheduled_at: z.string().min(1, 'Informe data e hora.'),
  description: z.string().optional(),
});

export async function atualizarEncontro(_prev: EstadoAdmin, form: FormData): Promise<EstadoAdmin> {
  await requireAdmin();
  const parsed = EncontroEdicao.safeParse({
    id: form.get('id'),
    title: form.get('title'),
    scheduled_at: form.get('scheduled_at'),
    description: form.get('description') ?? '',
  });
  if (!parsed.success) return { erro: parsed.error.issues[0].message };

  const supabase = createClient();
  const { error } = await supabase.from('meetings').update({
    title: parsed.data.title,
    scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
    description: parsed.data.description || null,
  }).eq('id', parsed.data.id);

  if (error) return { erro: 'Não foi possível salvar as alterações do encontro.' };

  revalidatePath('/admin');
  revalidatePath('/frequencias');
  return { ok: 'Encontro atualizado.' };
}
