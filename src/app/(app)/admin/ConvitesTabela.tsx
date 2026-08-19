'use client';

import { useEffect, useState } from 'react';
import { cancelarConvite, reenviarConvite } from './actions';
import { dataCurta } from '@/lib/format';
import { ROLE_LABEL } from '@/lib/types';

const POR_PAGINA = 10;

const STATUS_LABEL: Record<string, string> = {
  pending: 'Aguardando aceite', accepted: 'Aceito',
  expired: 'Expirado', revoked: 'Cancelado',
};

type Convite = {
  id: string; email: string; role: string; status: string;
  expires_at: string | null; created_at: string;
};

export function ConvitesTabela({ convites }: { convites: Convite[] }) {
  const [pagina, setPagina] = useState(1);
  const total = Math.max(1, Math.ceil(convites.length / POR_PAGINA));
  useEffect(() => { setPagina(1); }, [convites.length]);
  const atual = Math.min(pagina, total);
  const linhas = convites.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA);

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
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
            {linhas.map((c) => (
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

      {convites.length > POR_PAGINA && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-g30 p-3">
          <p className="text-xs text-g50">
            Exibindo <span className="num">{(atual - 1) * POR_PAGINA + 1}</span>–
            <span className="num">{Math.min(atual * POR_PAGINA, convites.length)}</span> de{' '}
            <span className="num">{convites.length}</span>
          </p>
          <nav aria-label="Paginação de convites" className="flex items-center gap-1">
            <button
              onClick={() => setPagina(Math.max(1, atual - 1))} disabled={atual === 1}
              className="rounded-s border border-g40 px-2 py-1 text-xs text-g70 hover:bg-g20 disabled:opacity-40"
            >Anterior</button>
            {Array.from({ length: total }, (_, i) => i + 1)
              .filter((n) => Math.abs(n - atual) <= 2 || n === 1 || n === total)
              .reduce<number[]>((acc, n) => {
                if (acc.length && n - acc[acc.length - 1] > 1) acc.push(-1);
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) => n === -1
                ? <span key={`e${i}`} className="px-1 text-xs text-g50">…</span>
                : (
                  <button
                    key={n} onClick={() => setPagina(n)} aria-current={n === atual ? 'page' : undefined}
                    className={n === atual
                      ? 'num rounded-s bg-[var(--navy)] px-2.5 py-1 text-xs font-semibold text-white'
                      : 'num rounded-s border border-g40 px-2.5 py-1 text-xs text-g70 hover:bg-g20'}
                  >{n}</button>
                ))}
            <button
              onClick={() => setPagina(Math.min(total, atual + 1))} disabled={atual === total}
              className="rounded-s border border-g40 px-2 py-1 text-xs text-g70 hover:bg-g20 disabled:opacity-40"
            >Próxima</button>
          </nav>
        </div>
      )}
    </div>
  );
}
