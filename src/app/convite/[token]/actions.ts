'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

import { hashToken } from '@/lib/invite-token';

const Aceite = z.object({
  token: z.string().min(20),
  nome: z.string().min(2, 'Informe seu nome completo.'),
  senha: z.string().min(10, 'A senha precisa de pelo menos 10 caracteres.'),
  confirmacao: z.string(),
  areaId: z.string().uuid().optional().or(z.literal('')),
}).refine((d) => d.senha === d.confirmacao, {
  message: 'As senhas não conferem.', path: ['confirmacao'],
});

export type EstadoAceite = { erro?: string };

export async function aceitarConvite(
  _prev: EstadoAceite,
  form: FormData,
): Promise<EstadoAceite> {
  const parsed = Aceite.safeParse({
    token: form.get('token'),
    nome: form.get('nome'),
    senha: form.get('senha'),
    confirmacao: form.get('confirmacao'),
    areaId: form.get('areaId') ?? '',
  });
  if (!parsed.success) return { erro: parsed.error.issues[0].message };

  const admin = createAdminClient();

  // Revalida o convite no servidor. A tela já validou, mas a tela não é
  // fronteira de segurança: entre carregar e enviar, o convite pode ter
  // expirado ou sido revogado.
  const { data: convite } = await admin
    .from('invitations')
    .select('id, email, role, status, expires_at')
    .eq('token_hash', hashToken(parsed.data.token))
    .maybeSingle();

  if (!convite || convite.status !== 'pending') {
    return { erro: 'Este convite não está mais válido. Peça um novo a um administrador.' };
  }
  if (new Date(convite.expires_at) < new Date()) {
    await admin.from('invitations').update({ status: 'expired' }).eq('id', convite.id);
    return { erro: 'Este convite expirou. Peça um novo a um administrador.' };
  }

  const { data: criado, error: erroCriacao } = await admin.auth.admin.createUser({
    email: convite.email,
    password: parsed.data.senha,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.nome },
  });

  if (erroCriacao || !criado.user) {
    return { erro: 'Não foi possível concluir o cadastro. Fale com um administrador.' };
  }

  await admin.from('profiles').upsert({
    id: criado.user.id,
    full_name: parsed.data.nome,
    area_id: parsed.data.areaId || null,
    role: convite.role,
  });

  await admin.from('invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', convite.id);

  const supabase = createClient();
  await supabase.auth.signInWithPassword({
    email: convite.email,
    password: parsed.data.senha,
  });

  redirect('/dashboard?bemvindo=1');
}
