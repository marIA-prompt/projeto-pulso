'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { EXPERIENCE_LEVELS } from '@/lib/types';

export type EstadoPerfil = { erro?: string; ok?: string };

const listaDe = (v: FormDataEntryValue | null): string[] =>
  String(v ?? '')
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);

const Perfil = z.object({
  nickname: z.string().max(60).optional(),
  headline: z.string().max(140).optional(),
  bio: z.string().max(2000).optional(),
  experience_level: z.enum(EXPERIENCE_LEVELS as [string, ...string[]]).nullable().catch(null),
  projects_done: z.string().max(4000).optional(),
  contact: z.string().max(300).optional(),
  available: z.boolean(),
});

const MAX_AVATAR = 3 * 1024 * 1024; // 3 MB
const TIPOS_OK = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export async function atualizarPerfilHub(
  _prev: EstadoPerfil, form: FormData,
): Promise<EstadoPerfil> {
  const perfil = await requireUser();
  const supabase = createClient();

  const nivelBruto = form.get('experience_level');
  const parsed = Perfil.safeParse({
    nickname: form.get('nickname') ?? '',
    headline: form.get('headline') ?? '',
    bio: form.get('bio') ?? '',
    experience_level: nivelBruto ? nivelBruto : null,
    projects_done: form.get('projects_done') ?? '',
    contact: form.get('contact') ?? '',
    available: form.get('available') === 'on',
  });
  if (!parsed.success) return { erro: parsed.error.issues[0].message };

  // Upload opcional do avatar para o bucket 'avatars', na pasta do próprio uid.
  let avatarUrl: string | undefined;
  const avatar = form.get('avatar');
  if (avatar instanceof File && avatar.size > 0) {
    if (!TIPOS_OK.includes(avatar.type)) {
      return { erro: 'Foto em formato não suportado. Use PNG, JPG, WEBP ou GIF.' };
    }
    if (avatar.size > MAX_AVATAR) {
      return { erro: 'A foto excede 3 MB. Envie uma imagem menor.' };
    }
    const ext = (avatar.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
    const path = `${perfil.id}/avatar.${ext}`;
    const bytes = new Uint8Array(await avatar.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, { upsert: true, contentType: avatar.type });
    if (upErr) return { erro: 'Não foi possível enviar a foto. Tente novamente.' };
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      nickname: parsed.data.nickname || null,
      headline: parsed.data.headline || null,
      bio: parsed.data.bio || null,
      experience_level: parsed.data.experience_level,
      languages: listaDe(form.get('languages')),
      automations: listaDe(form.get('automations')),
      interests: listaDe(form.get('interests')),
      projects_done: parsed.data.projects_done || null,
      contact: parsed.data.contact || null,
      available: parsed.data.available,
      hub_updated_at: new Date().toISOString(),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq('id', perfil.id);

  if (error) return { erro: 'Não foi possível salvar o perfil. Tente novamente.' };

  revalidatePath('/comunidade');
  revalidatePath('/comunidade/perfil');
  redirect('/comunidade?ok=perfil');
}
