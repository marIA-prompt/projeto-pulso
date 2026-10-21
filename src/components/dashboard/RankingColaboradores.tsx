'use client';

import { useId, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { diaCurto, nf } from '@/lib/format';
import { clsx } from '@/lib/clsx';
import type { RankingCategoria, RankingPessoa, RankingsColaboradores } from '@/lib/ranking';

const ABAS: {
  id: RankingCategoria;
  rotulo: string;
  titulo: string;
  nota: string;
  cor: string;
}[] = [
  {
    id: 'entregas',
    rotulo: 'Entregas',
    titulo: 'Maior volume de entregas',
    nota: 'Iniciativas concluídas ou em showcase nos últimos 3 meses.',
    cor: 'var(--blue)',
  },
  {
    id: 'especialistas',
    rotulo: 'Especialistas',
    titulo: 'Especialistas (conhecimento técnico)',
    nota: 'Nível de domínio no Hub e cobertura das ferramentas que o time declara no perfil e nas iniciativas.',
    cor: 'var(--cat-7)',
  },
  {
    id: 'colaboradores',
    rotulo: 'Colaboração',
    titulo: 'Top colaboradores',
    nota: 'Índice 0–100: presença nos encontros (até 40), disponibilidade para ajudar (20), iniciativas ativas (até 20) e perfil encontrável (até 20).',
    cor: 'var(--cat-3)',
  },
];

function notaDaAba(id: RankingCategoria, rankings: RankingsColaboradores): string {
  if (id === 'entregas' && !rankings.entregasNaJanela) {
    return 'Nenhuma conclusão datada nos últimos 3 meses. Ranking pelo histórico de entregas concluídas ou em showcase.';
  }
  return ABAS.find((a) => a.id === id)?.nota ?? '';
}

export function RankingColaboradores({ rankings }: { rankings: RankingsColaboradores }) {
  const [aba, setAba] = useState<RankingCategoria>('entregas');
  const baseId = useId();
  const vazio = ABAS.every((a) => rankings[a.id].length === 0);

  if (vazio) {
    return (
      <section className="card p-4" aria-labelledby={`${baseId}-titulo`}>
        <h2 id={`${baseId}-titulo`} className="text-base font-semibold">Top 10 colaboradores</h2>
        <p className="mt-2 text-sm text-g60">
          Ainda não há dados suficientes para montar o ranking. Ele aparece quando houver
          entregas recentes, perfis com ferramentas ou presença nos encontros.
        </p>
      </section>
    );
  }

  return (
    <section className="card p-4" aria-labelledby={`${baseId}-titulo`}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`${baseId}-titulo`} className="text-base font-semibold">Top 10 colaboradores</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-g60">
            Reconhecimento com base nos dados do Pulso — entregas, conhecimento técnico e ajuda entre pares.
            {rankings.entregasNaJanela
              ? ` Entregas e presença desde ${diaCurto(rankings.corteDesde)}.`
              : ` Presença desde ${diaCurto(rankings.corteDesde)}. Sem conclusão datada no período, o volume usa o histórico.`}
          </p>
        </div>
      </header>

      {/* Mobile/tablet: um gráfico, três abas em grade fixa (não quebra a terceira). */}
      <div className="mt-4 lg:hidden">
        <div role="tablist" aria-label="Categorias do ranking" className="grid grid-cols-3 gap-1 rounded-s border border-g40 p-1">
          {ABAS.map((a) => {
            const selecionada = a.id === aba;
            return (
              <button
                key={a.id}
                type="button"
                role="tab"
                id={`${baseId}-tab-${a.id}`}
                aria-selected={selecionada}
                aria-controls={`${baseId}-painel-${a.id}`}
                tabIndex={selecionada ? 0 : -1}
                onClick={() => setAba(a.id)}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                  e.preventDefault();
                  const i = ABAS.findIndex((x) => x.id === aba);
                  const next = e.key === 'ArrowRight'
                    ? ABAS[(i + 1) % ABAS.length]
                    : ABAS[(i - 1 + ABAS.length) % ABAS.length];
                  setAba(next.id);
                  requestAnimationFrame(() => {
                    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
                  });
                }}
                className={clsx(
                  'rounded-s px-1.5 py-1.5 text-center text-[0.7rem] font-medium leading-tight sm:px-2 sm:text-sm',
                  selecionada
                    ? 'bg-[var(--navy)] text-white'
                    : 'text-g60 hover:bg-g20 hover:text-g90',
                )}
              >
                {a.rotulo}
              </button>
            );
          })}
        </div>
        {ABAS.map((a) => (
          <div
            key={a.id}
            role="tabpanel"
            id={`${baseId}-painel-${a.id}`}
            aria-labelledby={`${baseId}-tab-${a.id}`}
            hidden={a.id !== aba}
            aria-live={a.id === aba ? 'polite' : undefined}
            className="mt-4"
          >
            <PainelRanking
              titulo={a.titulo}
              nota={notaDaAba(a.id, rankings)}
              pessoas={rankings[a.id]}
              cor={a.cor}
            />
          </div>
        ))}
      </div>

      {/* Desktop: as três listas lado a lado. */}
      <div className="mt-4 hidden gap-4 lg:grid lg:grid-cols-3">
        {ABAS.map((a) => (
          <PainelRanking
            key={a.id}
            titulo={a.titulo}
            nota={notaDaAba(a.id, rankings)}
            pessoas={rankings[a.id]}
            cor={a.cor}
          />
        ))}
      </div>
    </section>
  );
}

function PainelRanking({
  titulo, nota, pessoas, cor,
}: {
  titulo: string;
  nota: string;
  pessoas: RankingPessoa[];
  cor: string;
}) {
  const max = Math.max(...pessoas.map((p) => p.valor), 1);
  return (
    <figure className="min-w-0">
      <figcaption>
        <h3 className="text-sm font-semibold text-g90">{titulo}</h3>
        <p className="mt-1 text-xs leading-relaxed text-g50">{nota}</p>
      </figcaption>
      {pessoas.length === 0 ? (
        <p className="mt-4 text-sm text-g50">Ninguém pontuou nesta categoria ainda.</p>
      ) : (
        <ol className="mt-4 space-y-2.5">
          {pessoas.map((p, i) => {
            const posto = i + 1;
            const largura = `${Math.max(6, (p.valor / max) * 100)}%`;
            return (
              <li key={p.id} className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-2">
                <span
                  className={clsx(
                    'num flex h-6 w-7 items-center justify-center rounded-full text-xs font-semibold',
                    posto === 1 && 'bg-[var(--yellow)] text-[var(--navy-deep)]',
                    posto === 2 && 'bg-g20 text-g80',
                    posto === 3 && 'bg-[var(--orange)] text-white',
                    posto > 3 && 'text-g50',
                  )}
                >
                  {posto}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar src={p.avatar_url} nome={p.nome} size={24} />
                    <span
                      className="truncate text-sm font-medium text-g90"
                      title={p.area_name ? `${p.nome} · ${p.area_name}` : p.nome}
                    >
                      {p.nome}
                    </span>
                  </div>
                  <span aria-hidden className="mt-1 block h-2.5 rounded-full bg-g20">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: largura, background: cor }}
                    />
                  </span>
                  <p className="mt-0.5 truncate text-[0.7rem] leading-tight text-g50" title={p.detalhe}>
                    {p.detalhe}
                  </p>
                </div>
                <span className="num shrink-0 text-right text-xs text-g60" title={p.detalhe}>
                  {nf.format(p.valor)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {pessoas.length > 0 && (
        <p className="sr-only">
          {titulo}. {pessoas.map((p, i) => `${i + 1}º ${p.nome}: ${p.detalhe}`).join('; ')}.
        </p>
      )}
    </figure>
  );
}
