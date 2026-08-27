'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { STAGES, STAGE_LABEL, type Stage } from '@/lib/types';
import { nf1, moeda } from '@/lib/format';
import { moverEstagio } from '@/app/(app)/projetos/actions';

export type CardProjeto = {
  id: string;
  title: string;
  stage: Stage;
  theme: string | null;
  owner_id: string | null;
  hours_saved_month: number | null;
  cost_saved_month: number | null;
  area_name: string | null;
  owner_name: string | null;
};

// As raias do Kanban seguem o pipeline da Metodologia (§4). 'cancelado' fica
// fora do fluxo linear, mas ganha raia própria para não sumir do quadro.
const RAIAS: Stage[] = [...STAGES];
const CARDS_POR_RAIA = 6;

export function ProjetosKanban({
  projetos, meuId, podeMover,
}: { projetos: CardProjeto[]; meuId: string; podeMover: boolean }) {
  const router = useRouter();
  const [cards, setCards] = useState<CardProjeto[]>(projetos);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<Stage | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [paginas, setPaginas] = useState<Partial<Record<Stage, number>>>({});
  const [, startTransition] = useTransition();

  useEffect(() => { setCards(projetos); }, [projetos]);

  function paginaDa(stage: Stage) {
    return paginas[stage] ?? 1;
  }

  function setPaginaDa(stage: Stage, n: number) {
    setPaginas((p) => ({ ...p, [stage]: n }));
  }

  function soltar(stage: Stage) {
    const id = arrastando;
    setArrastando(null);
    setAlvo(null);
    if (!id) return;
    const atual = cards.find((c) => c.id === id);
    if (!atual || atual.stage === stage) return;

    const anterior = atual.stage;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, stage } : c)));
    setErro(null);
    // Ao receber um card, volta à 1ª página da raia de destino para o card aparecer.
    setPaginaDa(stage, 1);

    startTransition(async () => {
      const res = await moverEstagio(id, stage);
      if (res.erro) {
        setCards((cs) => cs.map((c) => (c.id === id ? { ...c, stage: anterior } : c)));
        setErro(res.erro);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {erro && (
        <p role="alert" className="rounded-s bg-[var(--sig-crit-bg)] px-3 py-2 text-sm text-[var(--sig-crit)]">
          {erro}
        </p>
      )}
      {podeMover && (
        <p className="text-xs text-g50">Arraste um card para outra raia para mudar o estágio da iniciativa.</p>
      )}

      {/*
        Sem scroll horizontal: as 8 raias cabem lado a lado em telas largas
        (minimax ~11rem) e quebram em linhas conforme a largura disponível.
      */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3">
        {RAIAS.map((stage) => {
          const daRaia = cards.filter((c) => c.stage === stage);
          const totalPaginas = Math.max(1, Math.ceil(daRaia.length / CARDS_POR_RAIA));
          const pagina = Math.min(paginaDa(stage), totalPaginas);
          const inicio = (pagina - 1) * CARDS_POR_RAIA;
          const visiveis = daRaia.slice(inicio, inicio + CARDS_POR_RAIA);

          return (
            <section
              key={stage}
              onDragOver={(e) => { if (podeMover && arrastando) { e.preventDefault(); setAlvo(stage); } }}
              onDrop={(e) => { e.preventDefault(); if (podeMover) soltar(stage); }}
              className={`flex min-w-0 flex-col rounded-m border p-2 ${
                alvo === stage ? 'border-[var(--blue)] bg-[var(--blue-tint,rgba(37,99,235,.06))]' : 'border-g30 bg-g10'
              }`}
            >
              <header className="mb-2 flex items-center justify-between gap-1 px-1">
                <h3 className="truncate text-sm font-semibold text-g80">{STAGE_LABEL[stage]}</h3>
                <span className="num shrink-0 rounded-s bg-g20 px-1.5 text-xs text-g60">{daRaia.length}</span>
              </header>

              <div className="flex min-h-[3rem] flex-1 flex-col gap-2">
                {visiveis.map((c) => {
                  const meu = c.owner_id === meuId;
                  return (
                    <article
                      key={c.id}
                      draggable={podeMover}
                      onDragStart={() => setArrastando(c.id)}
                      onDragEnd={() => { setArrastando(null); setAlvo(null); }}
                      className={`rounded-s border border-g30 bg-[var(--white)] p-3 shadow-sm ${
                        podeMover ? 'cursor-grab active:cursor-grabbing' : ''
                      } ${arrastando === c.id ? 'opacity-50' : ''}`}
                    >
                      <Link href={`/projetos/${c.id}`} className="text-sm font-medium text-g90 hover:text-[var(--blue)]">
                        {c.title}
                      </Link>
                      <p className="mt-1 text-xs text-g50">
                        {c.area_name ?? 'Área não informada'}
                        {c.owner_name && ` · ${c.owner_name}`}
                        {meu && ' · sua'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] text-g60">
                        <span className="num">{c.hours_saved_month == null ? '—' : `${nf1.format(c.hours_saved_month)} h/mês`}</span>
                        {c.cost_saved_month != null && (
                          <span className="num">· {moeda(c.cost_saved_month * 12)}/ano</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {daRaia.length > CARDS_POR_RAIA && (
                <nav
                  aria-label={`Paginação da raia ${STAGE_LABEL[stage]}`}
                  className="mt-2 flex items-center justify-center gap-1 border-t border-g30 pt-2"
                >
                  <button
                    type="button"
                    onClick={() => setPaginaDa(stage, Math.max(1, pagina - 1))}
                    disabled={pagina === 1}
                    aria-label="Página anterior"
                    className="rounded-s px-1.5 py-0.5 text-xs text-g70 hover:bg-g20 disabled:opacity-40"
                  >
                    ‹
                  </button>
                  <span className="num text-[0.7rem] text-g60">
                    {pagina}/{totalPaginas}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaginaDa(stage, Math.min(totalPaginas, pagina + 1))}
                    disabled={pagina === totalPaginas}
                    aria-label="Próxima página"
                    className="rounded-s px-1.5 py-0.5 text-xs text-g70 hover:bg-g20 disabled:opacity-40"
                  >
                    ›
                  </button>
                </nav>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
