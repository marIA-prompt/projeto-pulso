'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const Login = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  senha: z.string().min(1, 'Informe a senha.'),
  next: z.string().optional(),
});

export type EstadoForm = { erro?: string; ok?: string };

export async function entrar(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  const parsed = Login.safeParse({
    email: form.get('email'),
    senha: form.get('senha'),
    next: form.get('next') ?? undefined,
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0].message };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  });

  // Mensagem única para credencial errada e conta inexistente: revelar qual
  // dos dois falhou entrega a um estranho quais e-mails têm conta aqui.
  if (error) return { erro: 'E-mail ou senha não conferem.' };

  revalidatePath('/', 'layout');
  redirect(parsed.data.next || '/dashboard');
}

export async function recuperarSenha(_prev: EstadoForm, form: FormData): Promise<EstadoForm> {
  const email = String(form.get('email') ?? '');
  if (!z.string().email().safeParse(email).success) {
    return { erro: 'Informe um e-mail válido.' };
  }
  const supabase = createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/nova-senha`,
  });
  // Resposta idêntica exista ou não a conta.
  return { ok: 'Se existir uma conta com esse e-mail, o link de redefinição chega em instantes.' };
}
