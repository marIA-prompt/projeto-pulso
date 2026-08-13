import { createClient } from '@supabase/supabase-js';

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
