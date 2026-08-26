import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { ConviteForm, EncontroForm, EncontroItem } from './Forms';
import { ConvitesTabela } from './ConvitesTabela';
import { ParticipantesTabela } from './ParticipantesTabela';
import { Empty } from '@/components/ui/Card';

export const metadata = { title: 'Admin — Pulso' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await requireAdmin();
  const supabase = createClient();

  const [{ data: convites }, { data: pessoas }, { data: encontros }] = await Promise.all([
    supabase.from('invitations')
      .select('id, email, role, status, expires_at, created_at')
      .order('created_at', { ascending: false }).limit(300),
    supabase.from('profiles')
      .select('id, full_name, role, active, created_at')
      .order('full_name'),
    supabase.from('meetings')
      .select('id, title, scheduled_at, description').order('scheduled_at', { ascending: false }).limit(10),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Área Admin</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-g60">
          Convites, papéis e encontros. Nada é excluído de verdade — acessos são
          revogados para preservar o histórico de presença e as iniciativas.
        </p>
      </header>

      <section aria-labelledby="convites-titulo" className="space-y-4">
        <h2 id="convites-titulo" className="text-lg font-semibold">Convites</h2>
        <ConviteForm />

        {!convites?.length ? (
          <Empty titulo="Nenhum convite ainda." />
        ) : (
          <ConvitesTabela convites={convites} />
        )}
      </section>

      <section aria-labelledby="pessoas-titulo" className="space-y-4">
        <h2 id="pessoas-titulo" className="text-lg font-semibold">Participantes</h2>
        {!pessoas?.length ? (
          <Empty titulo="Nenhum participante cadastrado." />
        ) : (
          <ParticipantesTabela
            meuId={admin.id}
            pessoas={(pessoas ?? []).map((p) => ({
              id: p.id,
              full_name: p.full_name,
              role: p.role,
              active: p.active,
            }))}
          />
        )}
      </section>

      <section aria-labelledby="encontros-titulo" className="space-y-4">
        <h2 id="encontros-titulo" className="text-lg font-semibold">Encontros</h2>
        <EncontroForm />
        {!encontros?.length ? (
          <Empty titulo="Nenhum encontro criado ainda." />
        ) : (
          <ul className="grid gap-2">
            {encontros.map((e) => (
              <EncontroItem
                key={e.id}
                encontro={e as { id: string; title: string; scheduled_at: string; description: string | null }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
