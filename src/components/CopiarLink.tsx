'use client';

import { useState } from 'react';

export function CopiarLink({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-s bg-g20 px-3 py-2">
      <span className="num min-w-0 flex-1 break-all text-xs text-g80">{link}</span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
          } catch {
            /* clipboard indisponível: o link continua visível para cópia manual */
          }
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        }}
        className="shrink-0 rounded-s border border-g40 bg-[var(--white)] px-2 py-1 text-xs font-medium text-g80 hover:bg-g20"
      >
        {copiado ? 'Copiado!' : 'Copiar link'}
      </button>
    </div>
  );
}
