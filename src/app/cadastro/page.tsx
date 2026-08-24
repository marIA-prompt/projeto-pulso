import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { CadastroForm } from './CadastroForm';

export const metadata = { title: 'Criar conta — Pulso' };
export const dynamic = 'force-dynamic';

export default async function CadastroPage() {
  let areas: { id: string; name: string }[] = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('areas')
      .select('id, name')
      .eq('is_real_area', true)
      .order('name');
    areas = data ?? [];
  } catch {
    areas = [];
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--g10)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">Senff</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Criar conta</h1>
          <p className="mt-3 text-sm leading-relaxed text-g60">
            Cadastro para colaboradores Senff. Sua conta entra como{' '}
            <strong className="text-g80">participante</strong> — você pode completar
            o perfil da comunidade depois.
          </p>
        </div>

        {areas.length === 0 ? (
          <div className="card space-y-3 p-6 text-sm text-g60">
            <p>Não foi possível carregar as áreas agora. Tente de novo em instantes.</p>
            <Link href="/login" className="underline hover:text-g90">Voltar para o login</Link>
          </div>
        ) : (
          <CadastroForm areas={areas} />
        )}
      </div>
    </main>
  );
}
