import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Role } from '@/lib/types';

export type SessionProfile = {
  id: string;
  full_name: string | null;
  role: Role;
  area_id: string | null;
};

/** Camada 2 da defesa em camadas: checagem por página. */
export async function requireUser(): Promise<SessionProfile> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, area_id')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login?erro=sem-perfil');
  return profile as SessionProfile;
}

export async function requireAdmin(): Promise<SessionProfile> {
  const profile = await requireUser();
  if (profile.role !== 'administrador') redirect('/dashboard?erro=sem-permissao');
  return profile;
}
