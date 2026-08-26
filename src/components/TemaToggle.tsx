'use client';

import { useEffect, useState } from 'react';
import { aplicarTema, temaAtual, TEMA_KEY, type Tema } from '@/lib/tema';
import { clsx } from '@/lib/clsx';

const OPCOES: { id: Tema; emoji: string; rotulo: string }[] = [
  { id: 'light', emoji: '☀️', rotulo: 'Tema claro' },
  { id: 'dark', emoji: '🌙', rotulo: 'Tema escuro' },
];

export function TemaToggle({ compacto = false }: { compacto?: boolean }) {
  const [tema, setTema] = useState<Tema>('light');

  useEffect(() => {
    setTema(temaAtual());
    function sync(e: StorageEvent) {
      if (e.key !== TEMA_KEY) return;
      setTema(temaAtual());
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  function escolher(t: Tema) {
    aplicarTema(t);
    setTema(t);
  }

  return (
    <div
      role="group"
      aria-label="Tema da interface"
      className="inline-flex rounded-s border border-g40 bg-[var(--white)] p-0.5"
    >
      {OPCOES.map((o) => {
        const ativo = tema === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-label={o.rotulo}
            aria-pressed={ativo}
            title={o.rotulo}
            onClick={() => escolher(o.id)}
            className={clsx(
              'rounded-[6px] px-2 py-1 text-sm leading-none transition-colors',
              compacto && 'px-1.5',
              ativo ? 'bg-g20' : 'opacity-55 hover:opacity-100',
            )}
          >
            <span aria-hidden="true">{o.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Canto superior das telas públicas (login, cadastro, convite). */
export function TemaPublico() {
  return (
    <div className="fixed right-4 top-4 z-30">
      <TemaToggle />
    </div>
  );
}
