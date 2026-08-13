import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Cliente para Server Components, Server Actions e Route Handlers. */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list: { name: string; value: string; options?: any }[]) => {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component não pode escrever cookie: o middleware renova a sessão.
          }
        },
      },
    },
  );
}
