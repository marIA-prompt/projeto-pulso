'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/Avatar';

export function MenuConta({
  nome, apelido, avatarUrl, userId,
}: {
  nome: string;
  apelido: string | null;
  avatarUrl: string | null;
  userId: string;
}) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const primario = apelido?.trim() || nome;
  const secundario = apelido?.trim() && apelido.trim() !== nome ? nome : null;

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

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        aria-label="Menu da conta"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="rounded-full ring-offset-2 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue)]"
      >
        <Avatar src={avatarUrl} nome={primario} size={32} />
      </button>

      {aberto && (
        <div
          role="menu"
          aria-label="Conta"
          className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-m border border-g30 bg-[var(--white)] shadow-2"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar src={avatarUrl} nome={primario} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-g90">{primario}</p>
              {secundario && <p className="truncate text-xs text-g50">{secundario}</p>}
            </div>
          </div>

          <div className="border-t border-g20 py-1">
            <Link
              role="menuitem"
              href="/comunidade/perfil"
              onClick={() => setAberto(false)}
              className="block px-3 py-2 text-sm text-g80 hover:bg-g20"
            >
              Meu perfil
            </Link>
            <Link
              role="menuitem"
              href={`/projetos?owner=${userId}`}
              onClick={() => setAberto(false)}
              className="block px-3 py-2 text-sm text-g80 hover:bg-g20"
            >
              Minhas iniciativas
            </Link>
          </div>

          <div className="border-t border-g20 py-1">
            <form action="/auth/sair" method="post">
              <button
                role="menuitem"
                type="submit"
                className="block w-full px-3 py-2 text-left text-sm text-g80 hover:bg-g20"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
