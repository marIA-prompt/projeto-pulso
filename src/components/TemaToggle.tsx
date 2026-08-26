'use client';

import { useEffect, useState } from 'react';
import { aplicarTema, temaAtual, TEMA_KEY, type Tema } from '@/lib/tema';
import { clsx } from '@/lib/clsx';

const OPCOES: { id: Tema; rotulo: string }[] = [
  { id: 'light', rotulo: 'Tema claro' },
  { id: 'dark', rotulo: 'Tema escuro' },
];

function IconeSol() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="block">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M12 3v2M12 19v2M5.05 5.05l1.4 1.4M17.55 17.55l1.4 1.4M3 12h2M19 12h2M5.05 18.95l1.4-1.4M17.55 6.45l1.4-1.4" />
      </g>
    </svg>
  );
}

function IconeLua() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="block">
      <path
        fill="currentColor"
        d="M20.5 15.2A8.2 8.2 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2z"
      />
    </svg>
  );
}

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
              'rounded-[6px] p-1.5 transition-colors',
              compacto && 'p-1',
              ativo
                ? o.id === 'light'
                  ? 'bg-g20 text-[var(--yellow)]'
                  : 'bg-g20 text-[var(--blue)]'
                : 'text-g50 hover:text-g80',
            )}
          >
            {o.id === 'light' ? <IconeSol /> : <IconeLua />}
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
