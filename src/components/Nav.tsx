'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from '@/lib/clsx';

const LINKS = [
  { href: '/dashboard', label: 'Acompanhamento' },
  { href: '/projetos', label: 'Iniciativas' },
  { href: '/comunidade', label: 'Comunidade' },
  { href: '/frequencias', label: 'Frequências' },
  { href: '/manifesto', label: 'Manifesto' },
  { href: '/metodologia/metodologia-grupo', label: 'Metodologia' },
];

export function Nav({ isAdmin, nome }: { isAdmin: boolean; nome: string }) {
  const path = usePathname();
  const links = isAdmin ? [...LINKS, { href: '/admin', label: 'Admin' }] : LINKS;

  return (
    <header className="sticky top-0 z-20 border-b border-g30 bg-[var(--topbar-bg)] backdrop-blur">
      <div className="mx-auto flex max-w-shell flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/dashboard" className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-[var(--navy)]">Pulso</span>
          <span className="num text-[0.65rem] uppercase tracking-widest text-g50">Senff</span>
        </Link>

        <nav aria-label="Seções" className="flex flex-wrap items-center gap-1">
          {links.map((l) => {
            const ativo = path === l.href || path.startsWith(l.href + '/');
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={ativo ? 'page' : undefined}
                className={clsx(
                  'rounded-s px-3 py-1.5 text-sm font-medium transition-colors',
                  ativo ? 'bg-[var(--blue)] text-white' : 'text-g60 hover:bg-g20 hover:text-g90',
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-g60 sm:inline">{nome}</span>
          <form action="/auth/sair" method="post">
            <button className="rounded-s border border-g40 px-3 py-1.5 text-sm text-g80 hover:bg-g20">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
