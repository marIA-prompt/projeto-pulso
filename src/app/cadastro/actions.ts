'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type EstadoCadastro = { erro?: string };

const DOMINIO_SENFF = '@senff.com.br';

const listaDe = (v: FormDataEntryValue | null): string[] =>
  String(v ?? '')
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);

const Cadastro = z.object({
  nome: z.string().trim().min(2, 'Informe o nome.'),
  sobrenome: z.string().trim().min(2, 'Informe o sobrenome.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
  senha: z.string().min(10, 'A senha precisa de pelo menos 10 caracteres.'),
  confirmacao: z.string(),
  areaId: z.string().uuid('Selecione sua área.'),
  interests: z.array(z.string()).max(30),
}).refine((d) => d.senha === d.confirmacao, {
  message: 'As senhas não conferem.', path: ['confirmacao'],
}).refine((d) => d.email.toLowerCase().endsWith(DOMINIO_SENFF), {
  message: 'Use um e-mail @senff.com.br.', path: ['email'],
});

export async function cadastrar(
  _prev: EstadoCadastro,
  form: FormData,
): Promise<EstadoCadastro> {
  const parsed = Cadastro.safeParse({
    nome: form.get('nome'),
    sobrenome: form.get('sobrenome'),
    email: form.get('email'),
    senha: form.get('senha'),
    confirmacao: form.get('confirmacao'),
    areaId: form.get('areaId'),
    interests: listaDe(form.get('interests')),
  });
  if (!parsed.success) return { erro: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase();
  const fullName = `${parsed.data.nome} ${parsed.data.sobrenome}`.replace(/\s+/g, ' ').trim();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { erro: 'Cadastro indisponível no momento. Tente de novo em instantes.' };
  }

  const { data: area } = await admin
    .from('areas')
    .select('id')
    .eq('id', parsed.data.areaId)
    .eq('is_real_area', true)
    .maybeSingle();
  if (!area) return { erro: 'Área inválida. Selecione uma área da lista.' };

  const { data: criado, error: erroCriacao } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.senha,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (erroCriacao || !criado.user) {
    const msg = (erroCriacao?.message ?? '').toLowerCase();
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
      return { erro: 'Já existe uma conta com este e-mail. Entre ou redefina a senha.' };
    }
    return { erro: 'Não foi possível concluir o cadastro. Tente de novo ou fale com um administrador.' };
  }

  const { data: convitePendente } = await admin
    .from('invitations')
    .select('id, role')
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle();

  const { error: erroPerfil } = await admin.from('profiles').upsert({
    id: criado.user.id,
    full_name: fullName,
    area_id: parsed.data.areaId,
    role: convitePendente?.role ?? 'participante',
    interests: parsed.data.interests,
    active: true,
  });

  if (erroPerfil) {
    console.error('cadastro: perfil não gravado', erroPerfil.message);
    // Conta Auth criada; perfil falhou — evita deixar usuário órfão sem feedback.
    return { erro: 'Conta criada, mas o perfil não foi concluído. Fale com um administrador.' };
  }

  if (convitePendente) {
    await admin.from('invitations').update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    }).eq('id', convitePendente.id);
  }

  const supabase = createClient();
  const { error: erroLogin } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.senha,
  });
  if (erroLogin) {
    return { erro: 'Conta criada. Entre com seu e-mail e senha na tela de login.' };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/admin');
  revalidatePath('/comunidade');
  revalidatePath('/projetos');
  redirect('/dashboard?bemvindo=1');
}
