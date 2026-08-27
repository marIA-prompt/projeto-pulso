'use client';

import { useEffect, useState } from 'react';
import { alterarPapel, alternarAtivo } from './actions';
import { ROLE_LABEL, PAPEIS } from '@/lib/types';

const POR_PAGINA = 10;

export type PessoaAdmin = {
  id: string;
  full_name: string | null;
  role: string;
  active: boolean;
  area_name: string | null;
};

export function ParticipantesTabela({
  pessoas, meuId,
}: {
  pessoas: PessoaAdmin[];
  meuId: string;
}) {
  const [pagina, setPagina] = useState(1);
  const total = Math.max(1, Math.ceil(pessoas.length / POR_PAGINA));
  useEffect(() => { setPagina(1); }, [pessoas.length]);
  const atual = Math.min(pagina, total);
  const linhas = pessoas.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA);

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
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
            {linhas.map((p) => {
              const euMesmo = p.id === meuId;
              return (
                <tr key={p.id} className="border-b border-g20 last:border-0">
                  <td className="p-3 text-g90">
                    {p.full_name ?? '—'}
                    {euMesmo && <span className="ml-2 text-xs text-g50">você</span>}
                  </td>
                  <td className="p-3 text-g60">{p.area_name ?? '—'}</td>
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

      {pessoas.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-g30 p-3">
          <p className="text-xs text-g50">
            Exibindo <span className="num">{(atual - 1) * POR_PAGINA + 1}</span>–
            <span className="num">{Math.min(atual * POR_PAGINA, pessoas.length)}</span> de{' '}
            <span className="num">{pessoas.length}</span>
          </p>
          {pessoas.length > POR_PAGINA && (
            <nav aria-label="Paginação de participantes" className="flex items-center gap-1">
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
          )}
        </div>
      )}
    </div>
  );
}
