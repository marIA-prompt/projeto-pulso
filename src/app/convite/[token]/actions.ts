'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient, buscarAuthPorEmail } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { hashesDoToken } from '@/lib/invite-token';

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
    .in('token_hash', hashesDoToken(parsed.data.token))
    .limit(1)
    .maybeSingle();

  if (!convite || convite.status !== 'pending') {
    return { erro: 'Este convite não está mais válido. Peça o link mais recente a um administrador.' };
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

  let userId = criado?.user?.id;
  if (erroCriacao || !userId) {
    const msg = (erroCriacao?.message ?? '').toLowerCase();
    const jaExiste = msg.includes('already') || msg.includes('registered') || msg.includes('exists');
    if (!jaExiste) {
      return { erro: 'Não foi possível concluir o cadastro. Fale com um administrador.' };
    }
    const existente = await buscarAuthPorEmail(admin, convite.email);
    if (!existente) {
      return { erro: 'Não foi possível concluir o cadastro. Fale com um administrador.' };
    }
    const { error: erroAtualiza } = await admin.auth.admin.updateUserById(existente.id, {
      password: parsed.data.senha,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.nome },
    });
    if (erroAtualiza) {
      return { erro: 'Já existe uma conta com este e-mail. Entre ou redefina a senha.' };
    }
    userId = existente.id;
  }

  const { error: erroPerfil } = await admin.from('profiles').upsert({
    id: userId,
    full_name: parsed.data.nome,
    area_id: parsed.data.areaId || null,
    role: convite.role,
    active: true,
  });
  if (erroPerfil) {
    console.error('convite: perfil não gravado', erroPerfil.message);
    return { erro: 'Conta criada, mas o perfil não foi concluído. Fale com um administrador.' };
  }

  await admin.from('invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', convite.id);

  const supabase = createClient();
  await supabase.auth.signInWithPassword({
    email: convite.email,
    password: parsed.data.senha,
  });

  revalidatePath('/', 'layout');
  revalidatePath('/admin');
  revalidatePath('/comunidade');
  revalidatePath('/projetos');
  redirect('/dashboard?bemvindo=1');
}
