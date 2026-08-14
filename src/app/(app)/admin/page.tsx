import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { dataCurta } from '@/lib/format';
import { ConviteForm, EncontroForm, EncontroItem } from './Forms';
import { cancelarConvite, reenviarConvite, alterarPapel, alternarAtivo } from './actions';
import { Empty } from '@/components/ui/Card';
import { ROLE_LABEL, PAPEIS } from '@/lib/types';

export const metadata = { title: 'Admin — Pulso' };
export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Aguardando aceite', accepted: 'Aceito',
  expired: 'Expirado', revoked: 'Cancelado',
};

export default async function AdminPage() {
  const admin = await requireAdmin();
  const supabase = createClient();

  const [{ data: convites }, { data: pessoas }, { data: encontros }] = await Promise.all([
    supabase.from('invitations')
      .select('id, email, role, status, expires_at, created_at')
      .order('created_at', { ascending: false }).limit(40),
    supabase.from('profiles')
      .select('id, full_name, role, active, created_at, areas(name)')
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
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-g30 text-left text-xs uppercase tracking-wide text-g50">
                  <th scope="col" className="p-3">E-mail</th>
                  <th scope="col" className="p-3">Papel</th>
                  <th scope="col" className="p-3">Situação</th>
                  <th scope="col" className="p-3">Expira</th>
                  <th scope="col" className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {convites.map((c) => (
                  <tr key={c.id} className="border-b border-g20 last:border-0">
                    <td className="p-3 text-g90">{c.email}</td>
                    <td className="p-3 text-g60">{ROLE_LABEL[c.role as keyof typeof ROLE_LABEL] ?? c.role}</td>
                    <td className="p-3 text-g60">{STATUS_LABEL[c.status] ?? c.status}</td>
                    <td className="num p-3 text-g60">{dataCurta(c.expires_at)}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        {c.status === 'pending' && (
                          <>
                            <form action={reenviarConvite}>
                              <input type="hidden" name="id" value={c.id} />
                              <button className="rounded-s border border-g40 px-2 py-1 text-xs text-g80 hover:bg-g20">
                                Reenviar
                              </button>
                            </form>
                            <form action={cancelarConvite}>
                              <input type="hidden" name="id" value={c.id} />
                              <button className="rounded-s border border-[var(--sig-crit)] px-2 py-1 text-xs text-[var(--sig-crit)] hover:bg-[var(--sig-crit-bg)]">
                                Cancelar
                              </button>
                            </form>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="pessoas-titulo" className="space-y-4">
        <h2 id="pessoas-titulo" className="text-lg font-semibold">Participantes</h2>
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-g30 text-left text-xs uppercase tracking-wide text-g50">
                <th scope="col" className="p-3">Nome</th>
                <th scope="col" className="p-3">Área</th>
                <th scope="col" className="p-3">Papel</th>
                <th scope="col" className="p-3">Acesso</th>
                <th scope="col" className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(pessoas ?? []).map((p) => {
                const areas = p.areas as unknown as { name: string } | null;
                const euMesmo = p.id === admin.id;
                return (
                  <tr key={p.id} className="border-b border-g20 last:border-0">
                    <td className="p-3 text-g90">
                      {p.full_name ?? '—'}
                      {euMesmo && <span className="ml-2 text-xs text-g50">você</span>}
                    </td>
                    <td className="p-3 text-g60">{ROLE_LABEL[p.role as keyof typeof ROLE_LABEL] ?? p.role}</td>
                    <td className="p-3">
                      <span className={p.active ? 'text-[var(--sig-ok)]' : 'text-g50'}>
                        {p.active ? 'Ativo' : 'Revogado'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        {!euMesmo && (
                          <>
                            <form action={alterarPapel} style={{ display: 'inline-flex', gap: '.4rem' }}>
                              <input type="hidden" name="id" value={p.id} />
                                <select name="role" defaultValue={p.role}
                                            className="rounded-s border border-g40 px-2 py-1 text-xs text-g80">
                                  {PAPEIS.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                                </select>
                                <button className="rounded-s border border-g40 px-2 py-1 text-xs text-g80 hover:bg-g20">
                                  Salvar
                              </button>
                            </form>
                            <form action={alternarAtivo}>
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="active" value={String(p.active)} />
                              <button className="rounded-s border border-g40 px-2 py-1 text-xs text-g80 hover:bg-g20">
                                {p.active ? 'Revogar acesso' : 'Restaurar acesso'}
                              </button>
                            </form>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
