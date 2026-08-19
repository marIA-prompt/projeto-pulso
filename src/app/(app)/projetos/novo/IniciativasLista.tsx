'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { STAGE_LABEL, type Stage } from '@/lib/types';
import { classificar } from '@/lib/scoring';
import { nf1, dataCurta } from '@/lib/format';

const POR_PAGINA = 10;

export type LinhaIniciativa = {
  id: string;
  title: string;
  stage: Stage;
  theme: string | null;
  area_name: string | null;
  owner_id: string | null;
  hours_saved_month: number | null;
  score_final: number | null;
  last_activity_at: string;
};

export function IniciativasLista({
  linhas, meuId, podeGerenciar,
}: { linhas: LinhaIniciativa[]; meuId: string; podeGerenciar: boolean }) {
  const [pagina, setPagina] = useState(1);
  const total = Math.max(1, Math.ceil(linhas.length / POR_PAGINA));
  useEffect(() => { setPagina(1); }, [linhas.length]);
  const atual = Math.min(pagina, total);
  const visiveis = linhas.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA);

  return (
    <div className="space-y-3">
      <ul className="grid gap-3">
        {visiveis.map((p) => {
          const classe = classificar(p.score_final);
          const meu = p.owner_id === meuId;
          const podeEditar = meu || podeGerenciar;
          return (
            <li key={p.id} className="card flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
              <div className="min-w-[14rem] flex-1">
                <Link href={`/projetos/${p.id}`} className="font-medium text-g90 hover:text-[var(--blue)]">
                  {p.title}
                </Link>
                <p className="mt-0.5 text-xs text-g50">
                  {p.area_name ?? 'Área não informada'}
                  {p.theme && ` · ${p.theme}`}
                  {meu && ' · sua iniciativa'}
                </p>
              </div>
              <span className="rounded-s bg-g20 px-2 py-0.5 text-xs font-medium text-g80">{STAGE_LABEL[p.stage]}</span>
              <span className="num text-sm text-g60">
                {p.hours_saved_month == null ? '—' : `${nf1.format(p.hours_saved_month)} h/mês`}
              </span>
              <span className="text-xs text-g50">
                {p.score_final == null ? 'Não pontuada' : `${classe.label} · ${p.score_final.toFixed(2)}`}
              </span>
              <span className="num text-xs text-g50">atualizada em {dataCurta(p.last_activity_at)}</span>
              {podeEditar && (
                <Link href={`/projetos/${p.id}`}
                      className="rounded-s border border-g40 px-3 py-1.5 text-xs font-medium text-g80 hover:bg-g20">
                  Atualizar
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {linhas.length > POR_PAGINA && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-g50">
            Exibindo <span className="num">{(atual - 1) * POR_PAGINA + 1}</span>–
            <span className="num">{Math.min(atual * POR_PAGINA, linhas.length)}</span> de{' '}
            <span className="num">{linhas.length}</span>
          </p>
          <nav aria-label="Paginação das iniciativas" className="flex items-center gap-1">
            <button onClick={() => setPagina(Math.max(1, atual - 1))} disabled={atual === 1}
                    className="rounded-s border border-g40 px-2 py-1 text-xs text-g70 hover:bg-g20 disabled:opacity-40">Anterior</button>
            {Array.from({ length: total }, (_, i) => i + 1)
              .filter((n) => Math.abs(n - atual) <= 2 || n === 1 || n === total)
              .reduce<number[]>((acc, n) => { if (acc.length && n - acc[acc.length - 1] > 1) acc.push(-1); acc.push(n); return acc; }, [])
              .map((n, i) => n === -1
                ? <span key={`e${i}`} className="px-1 text-xs text-g50">…</span>
                : <button key={n} onClick={() => setPagina(n)} aria-current={n === atual ? 'page' : undefined}
                          className={n === atual
                            ? 'num rounded-s bg-[var(--navy)] px-2.5 py-1 text-xs font-semibold text-white'
                            : 'num rounded-s border border-g40 px-2.5 py-1 text-xs text-g70 hover:bg-g20'}>{n}</button>)}
            <button onClick={() => setPagina(Math.min(total, atual + 1))} disabled={atual === total}
                    className="rounded-s border border-g40 px-2 py-1 text-xs text-g70 hover:bg-g20 disabled:opacity-40">Próxima</button>
          </nav>
        </div>
      )}
    </div>
  );
}
