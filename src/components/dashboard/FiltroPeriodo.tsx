'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { diaCurto, diaISO } from '@/lib/format';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const DIAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function ymd(dt: Date) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function parseYmd(s: string): { y: number; m: number } | null {
  const m = /^(\d{4})-(\d{2})/.exec(s);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]) - 1 };
}

type Celula = { chave: string; dia: number; fora: boolean };

function grade(y: number, m: number): Celula[] {
  const primeiro = new Date(y, m, 1).getDay();
  const n = new Date(y, m + 1, 0).getDate();
  const cells: Celula[] = [];
  for (let i = 0; i < primeiro; i++) {
    const dt = new Date(y, m, 1 - (primeiro - i));
    cells.push({ chave: ymd(dt), dia: dt.getDate(), fora: true });
  }
  for (let d = 1; d <= n; d++) {
    cells.push({ chave: ymd(new Date(y, m, d)), dia: d, fora: false });
  }
  let extra = 1;
  while (cells.length % 7 !== 0) {
    const dt = new Date(y, m + 1, extra);
    cells.push({ chave: ymd(dt), dia: extra, fora: true });
    extra += 1;
  }
  return cells;
}

export function FiltroPeriodo({
  rotulo, de, ate, onChange,
}: {
  rotulo: string;
  de: string;
  ate: string;
  onChange: (de: string, ate: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [aguardandoFim, setAguardandoFim] = useState('');
  const raiz = useRef<HTMLDivElement>(null);
  const hoje = diaISO(new Date().toISOString());
  const [visivel, setVisivel] = useState(() => (
    parseYmd(de || ate || hoje) ?? { y: new Date().getFullYear(), m: new Date().getMonth() }
  ));

  useEffect(() => {
    if (!aberto) return;
    setAguardandoFim(de && !ate ? de : '');
    const p = parseYmd(de || ate || hoje);
    if (p) setVisivel(p);
  }, [aberto, de, ate, hoje]);

  useEffect(() => {
    if (!aberto) return;
    function fora(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false);
    }
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  const cells = useMemo(() => grade(visivel.y, visivel.m), [visivel]);

  const texto = !de && !ate
    ? 'Período'
    : de && ate && de !== ate
      ? `${diaCurto(de)} – ${diaCurto(ate)}`
      : diaCurto(de || ate);

  function escolher(dia: string) {
    if (!aguardandoFim) {
      setAguardandoFim(dia);
      onChange(dia, '');
      return;
    }
    const a = aguardandoFim <= dia ? aguardandoFim : dia;
    const b = aguardandoFim <= dia ? dia : aguardandoFim;
    onChange(a, b);
    setAguardandoFim('');
    setAberto(false);
  }

  function navegar(delta: number) {
    setVisivel((v) => {
      const dt = new Date(v.y, v.m + delta, 1);
      return { y: dt.getFullYear(), m: dt.getMonth() };
    });
  }

  const pontaDe = aguardandoFim || de;
  const pontaAte = aguardandoFim ? '' : ate;

  return (
    <div ref={raiz} className="relative">
      <span className="label">{rotulo}</span>
      <button
        type="button"
        aria-expanded={aberto}
        aria-haspopup="dialog"
        onClick={() => setAberto((v) => !v)}
        className="field mt-1 flex items-center justify-between gap-2 text-left"
      >
        <span className={de || ate ? 'text-g90' : 'text-g50'}>{texto}</span>
        <span aria-hidden className="text-g50">▾</span>
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label={`Período de ${rotulo.toLowerCase()}`}
          className="absolute z-30 mt-2 w-[18.5rem] rounded-m border border-g30 bg-[var(--white)] p-3 shadow-2"
        >
          <div className="mb-2 flex items-center justify-between">
            <button type="button" aria-label="Mês anterior" onClick={() => navegar(-1)}
                    className="rounded-s px-2 py-1 text-g60 hover:bg-g20">‹</button>
            <p className="text-sm font-semibold capitalize text-g90">
              {MESES[visivel.m]} {visivel.y}
            </p>
            <button type="button" aria-label="Próximo mês" onClick={() => navegar(1)}
                    className="rounded-s px-2 py-1 text-g60 hover:bg-g20">›</button>
          </div>

          <div className="grid grid-cols-7 text-center text-[0.7rem] font-medium text-g50">
            {DIAS.map((d, i) => <span key={`${d}${i}`} className="py-1">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 text-center">
            {cells.map((c) => {
              const selInicio = Boolean(pontaDe && c.chave === pontaDe);
              const selFim = Boolean(pontaAte && c.chave === pontaAte);
              const noMeio = Boolean(pontaDe && pontaAte && c.chave > pontaDe && c.chave < pontaAte);
              return (
                <button
                  key={c.chave}
                  type="button"
                  onClick={() => escolher(c.chave)}
                  className={[
                    'm-0.5 h-8 rounded-s text-sm',
                    c.fora ? 'text-g40' : 'text-g90',
                    c.chave === hoje && !selInicio && !selFim ? 'ring-1 ring-[var(--blue)]' : '',
                    noMeio ? 'bg-[var(--sig-done-bg)]' : '',
                    selInicio || selFim ? 'bg-[var(--blue)] font-semibold text-white' : 'hover:bg-g20',
                  ].join(' ')}
                >
                  {c.dia}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 border-t border-g20 pt-2">
            <p className="text-[0.7rem] text-g50">
              {aguardandoFim ? 'Agora clique o fim do período.' : 'Clique o início e o fim.'}
            </p>
            {(de || ate) && (
              <button
                type="button"
                onClick={() => { onChange('', ''); setAguardandoFim(''); }}
                className="text-xs font-medium text-[var(--blue)] hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
