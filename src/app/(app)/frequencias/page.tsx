import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { confirmarPresenca } from './actions';
import { dataLonga, nf, nf1 } from '@/lib/format';
import { Empty } from '@/components/ui/Card';
import { hasRoleAtLeast, type AttendanceStatus } from '@/lib/types';
import { ExportarCsv } from './ExportarCsv';

export const metadata = { title: 'Frequências — Pulso' };
export const dynamic = 'force-dynamic';

type Encontro = {
  id: string; title: string; scheduled_at: string; description: string | null;
};

export default async function FrequenciasPage() {
  const perfil = await requireUser();
  const supabase = createClient();
  const agora = new Date().toISOString();

  const [{ data: proximos }, { data: minhas }, { data: kpis }] = await Promise.all([
    supabase.from('meetings').select('id, title, scheduled_at, description')
      .gte('scheduled_at', agora).order('scheduled_at').limit(6),
    supabase.from('attendance').select('meeting_id, status').eq('user_id', perfil.id),
    perfil.role === 'administrador'
      ? supabase.from('v_attendance_kpis').select('*').order('scheduled_at', { ascending: false }).limit(8)
      : Promise.resolve({ data: null }),
  ]);

  const meuStatus = new Map<string, AttendanceStatus>(
    (minhas ?? []).map((a) => [a.meeting_id as string, a.status as AttendanceStatus]),
  );
  const encontros = (proximos ?? []) as Encontro[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Frequências</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-g60">
          Confirmar presença ajuda quem organiza a dimensionar a sala e a pauta.
        </p>
      </header>

      <section aria-labelledby="proximos-titulo" className="space-y-3">
        <h2 id="proximos-titulo" className="text-base font-semibold">Próximos encontros</h2>

        {encontros.length === 0 ? (
          <Empty titulo="Nenhum encontro agendado ainda. Um administrador cria o próximo pela Área Admin." />
        ) : (
          <ul className="grid gap-3">
            {encontros.map((e) => {
              const status = meuStatus.get(e.id) ?? 'pending';
              return (
                <li key={e.id} className="card flex flex-wrap items-center gap-4 p-4">
                  <div className="min-w-[16rem] flex-1">
                    <p className="font-medium text-g90">{e.title}</p>
                    <p className="num mt-0.5 text-xs text-g50">{dataLonga(e.scheduled_at)}</p>
                    {e.description && <p className="mt-1 text-sm text-g60">{e.description}</p>}
                  </div>

                  <p aria-live="polite" className="text-sm">
                    {status === 'present' && <span className="text-[var(--sig-ok)]">Você confirmou presença.</span>}
                    {status === 'absent' && <span className="text-[var(--sig-crit)]">Você avisou que não vai.</span>}
                    {status === 'pending' && <span className="text-g50">Aguardando sua resposta.</span>}
                  </p>

                  {hasRoleAtLeast(perfil.role, 'participante') ? (
                    <div className="flex gap-2">
                      <form action={confirmarPresenca}>
                        <input type="hidden" name="meetingId" value={e.id} />
                        <input type="hidden" name="status" value="present" />
                        <button className="rounded-s bg-[var(--blue)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--blue-2)]">
                          Vou participar
                        </button>
                      </form>
                      <form action={confirmarPresenca}>
                        <input type="hidden" name="meetingId" value={e.id} />
                        <input type="hidden" name="status" value="absent" />
                        <button className="rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g80 hover:bg-g20">
                          Não vou
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-xs text-g50">Somente leitura</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {perfil.role === 'administrador' && kpis && kpis.length > 0 && (() => {
        const totConvidados = kpis.reduce((s, k) => s + (k.convidados ?? 0), 0);
        const totConfirmaram = kpis.reduce((s, k) => s + (k.confirmaram ?? 0), 0);
        const totPresentes = kpis.reduce((s, k) => s + (k.presentes ?? 0), 0);
        const taxaGeral = totConvidados ? Math.round((1000 * totPresentes) / totConvidados) / 10 : null;
        return (
          <section aria-labelledby="consolidado-titulo" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="consolidado-titulo" className="text-base font-semibold">Consolidado por encontro</h2>
              <ExportarCsv linhas={kpis.map((k) => ({
                meeting_id: k.meeting_id, title: k.title, scheduled_at: k.scheduled_at,
                convidados: k.convidados, confirmaram: k.confirmaram, presentes: k.presentes,
                taxa_presenca: k.taxa_presenca,
              }))} />
            </div>
            <div className="card overflow-x-auto p-0">
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-g30 text-left text-xs uppercase tracking-wide text-g50">
                    <th scope="col" className="p-3">Encontro</th>
                    <th scope="col" className="p-3 text-right">Convidados</th>
                    <th scope="col" className="p-3 text-right">Confirmaram</th>
                    <th scope="col" className="p-3 text-right">Presentes</th>
                    <th scope="col" className="p-3 text-right">Taxa de presença</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.map((k) => (
                    <tr key={k.meeting_id} className="border-b border-g20 last:border-0">
                      <td className="p-3 font-medium text-g90">{k.title}</td>
                      <td className="num p-3 text-right text-g60">{nf.format(k.convidados)}</td>
                      <td className="num p-3 text-right text-g60">{nf.format(k.confirmaram)}</td>
                      <td className="num p-3 text-right text-g60">{nf.format(k.presentes)}</td>
                      <td className="num p-3 text-right">
                        <span className={(k.taxa_presenca ?? 0) >= 80 ? 'text-[var(--sig-ok)]' : 'text-[var(--sig-warn)]'}>
                          {k.taxa_presenca == null ? '—' : `${nf1.format(k.taxa_presenca)}%`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-g40 bg-g10 font-semibold text-g90">
                    <td className="p-3">Total</td>
                    <td className="num p-3 text-right">{nf.format(totConvidados)}</td>
                    <td className="num p-3 text-right">{nf.format(totConfirmaram)}</td>
                    <td className="num p-3 text-right">{nf.format(totPresentes)}</td>
                    <td className="num p-3 text-right">{taxaGeral == null ? '—' : `${nf1.format(taxaGeral)}%`}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        );
      })()}
    </div>
  );
}
