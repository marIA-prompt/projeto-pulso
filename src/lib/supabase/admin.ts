import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente com service-role. EXCLUSIVAMENTE server-side — contorna RLS.
 * Usado só para: criar usuário a partir de convite válido e bootstrap do
 * primeiro admin. Nunca importar em componente cliente.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente no servidor.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function buscarAuthPorEmail(
  admin: SupabaseClient,
  email: string,
) {
  const alvo = email.toLowerCase();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) return null;
  return (data.users ?? []).find((u) => (u.email ?? '').toLowerCase() === alvo) ?? null;
}
