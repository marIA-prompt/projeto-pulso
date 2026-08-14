'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { hasRoleAtLeast } from '@/lib/types';

const Confirmacao = z.object({
  meetingId: z.string().uuid(),
  status: z.enum(['present', 'absent']),
});

export async function confirmarPresenca(form: FormData) {
  const perfil = await requireUser();
  // Leitor não faz parte da lista de presença (Metodologia do Grupo §10).
  if (!hasRoleAtLeast(perfil.role, 'participante')) return;
  const parsed = Confirmacao.safeParse({
    meetingId: form.get('meetingId'),
    status: form.get('status'),
  });
  if (!parsed.success) return;

  const supabase = createClient();
  // A RLS garante que user_id só pode ser o próprio. Mesmo que alguém
  // forje o formulário, não consegue confirmar por outra pessoa.
  await supabase.from('attendance').upsert(
    {
      meeting_id: parsed.data.meetingId,
      user_id: perfil.id,
      status: parsed.data.status,
      confirmed_at: new Date().toISOString(),
    },
    { onConflict: 'meeting_id,user_id' },
  );

  revalidatePath('/frequencias');
  revalidatePath('/dashboard');
}
