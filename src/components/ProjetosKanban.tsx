'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { STAGES, STAGE_LABEL, type Stage } from '@/lib/types';
import { classificar } from '@/lib/scoring';
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
  score_final: number | null;
  area_name: string | null;
};

// As raias do Kanban seguem o pipeline da Metodologia (§4). 'cancelado' fica
// fora do fluxo linear, mas ganha raia própria para não sumir do quadro.
const RAIAS: Stage[] = [...STAGES];
const POR_RAIA = 6;

export function ProjetosKanban({
  projetos, meuId, podeMover,
}: { projetos: CardProjeto[]; meuId: string; podeMover: boolean }) {
  const router = useRouter();
  const [cards, setCards] = useState<CardProjeto[]>(projetos);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<Stage | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

      <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        {RAIAS.map((stage) => (
          <Raia
            key={stage}
            stage={stage}
            cards={cards.filter((c) => c.stage === stage)}
            meuId={meuId}
            podeMover={podeMover}
            arrastando={arrastando}
            alvo={alvo}
            onDragOver={() => { if (podeMover && arrastando) setAlvo(stage); }}
            onDrop={() => { if (podeMover) soltar(stage); }}
            onDragStart={(id) => setArrastando(id)}
            onDragEnd={() => { setArrastando(null); setAlvo(null); }}
          />
        ))}
      </div>
    </div>
  );
}

function Raia({
  stage, cards, meuId, podeMover, arrastando, alvo,
  onDragOver, onDrop, onDragStart, onDragEnd,
}: {
  stage: Stage;
  cards: CardProjeto[];
  meuId: string;
  podeMover: boolean;
  arrastando: string | null;
  alvo: Stage | null;
  onDragOver: () => void;
  onDrop: () => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(cards.length / POR_RAIA));
  const atual = Math.min(pagina, totalPaginas);
  const visiveis = cards.slice((atual - 1) * POR_RAIA, atual * POR_RAIA);

  return (
    <section
      onDragOver={(e) => { if (podeMover && arrastando) { e.preventDefault(); onDragOver(); } }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      className={`flex min-w-0 flex-col rounded-m border p-2 ${
        alvo === stage ? 'border-[var(--blue)] bg-[var(--blue-tint,rgba(37,99,235,.06))]' : 'border-g30 bg-g10'
      }`}
    >
      <header className="mb-2 flex items-center justify-between gap-1 px-1">
        <h3 className="truncate text-sm font-semibold text-g80">{STAGE_LABEL[stage]}</h3>
        <span className="num shrink-0 rounded-s bg-g20 px-1.5 text-xs text-g60">{cards.length}</span>
      </header>

      <div className="flex min-h-[3rem] flex-1 flex-col gap-2">
        {visiveis.map((c) => {
          const classe = classificar(c.score_final);
          const meu = c.owner_id === meuId;
          return (
            <article
              key={c.id}
              draggable={podeMover}
              onDragStart={() => onDragStart(c.id)}
              onDragEnd={onDragEnd}
              className={`rounded-s border border-g30 bg-white p-2 shadow-sm ${
                podeMover ? 'cursor-grab active:cursor-grabbing' : ''
              } ${arrastando === c.id ? 'opacity-50' : ''}`}
            >
              <Link
                href={`/projetos/${c.id}`}
                className="line-clamp-2 break-words text-xs font-medium text-g90 hover:text-[var(--blue)]"
              >
                {c.title}
              </Link>
              <p className="mt-1 truncate text-[0.65rem] text-g50">
                {c.area_name ?? 'Área não informada'}
                {meu && ' · sua'}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.65rem] text-g60">
                <span className="num">{c.hours_saved_month == null ? '—' : `${nf1.format(c.hours_saved_month)} h/mês`}</span>
                {c.cost_saved_month != null && (
                  <span className="num truncate">· {moeda(c.cost_saved_month * 12)}/ano</span>
                )}
              </div>
              <p className="mt-1 truncate text-[0.65rem] text-g50">
                {c.score_final == null ? 'Não pontuada' : `${classe.label} · ${c.score_final.toFixed(2)}`}
              </p>
            </article>
          );
        })}
      </div>

      {cards.length > POR_RAIA && (
        <footer className="mt-2 flex items-center justify-center gap-0.5">
          <nav aria-label={`Paginação da raia ${STAGE_LABEL[stage]}`} className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Página anterior"
              onClick={() => setPagina(Math.max(1, atual - 1))}
              disabled={atual === 1}
              className="rounded-s px-1.5 py-0.5 text-sm leading-none text-g70 hover:bg-g20 disabled:opacity-40"
            >
              ‹
            </button>
            <span className="num px-0.5 text-[0.65rem] tabular-nums text-g60">
              {atual}/{totalPaginas}
            </span>
            <button
              type="button"
              aria-label="Próxima página"
              onClick={() => setPagina(Math.min(totalPaginas, atual + 1))}
              disabled={atual === totalPaginas}
              className="rounded-s px-1.5 py-0.5 text-sm leading-none text-g70 hover:bg-g20 disabled:opacity-40"
            >
              ›
            </button>
          </nav>
        </footer>
      )}
    </section>
  );
}
