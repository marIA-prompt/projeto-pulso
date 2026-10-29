'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { MAX_CHARS_PROBLEMA, MIN_CHARS_PROBLEMA, PULSENFF } from '@/lib/match-solucoes';
import { varrerPulsenff } from '@/app/(app)/match/actions';

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Varrendo…' : 'Varrer a base'}
    </Button>
  );
}

/** Botão suspenso do Pulsenff, presente em todas as telas autenticadas. */
export function PulsenffBotao() {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const painelId = useId();

  useEffect(() => {
    if (!aberto) return;
    campo.current?.focus();
    function tecla(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false);
    }
    function fora(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('keydown', tecla);
    document.addEventListener('mousedown', fora);
    return () => {
      document.removeEventListener('keydown', tecla);
      document.removeEventListener('mousedown', fora);
    };
  }, [aberto]);

  return (
    <div ref={raiz} className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-3">
      {aberto && (
        <section
          id={painelId}
          role="dialog"
          aria-labelledby={`${painelId}-titulo`}
          className="card w-[min(22rem,calc(100vw-2.5rem))] space-y-3 border-l-4 border-l-[var(--blue)] p-4 shadow-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">{PULSENFF}</p>
              <h2 id={`${painelId}-titulo`} className="text-base font-semibold">Match de soluções</h2>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="rounded-s px-2 py-1 text-sm text-g60 hover:bg-g20"
            >
              Fechar
            </button>
          </div>
          <p className="text-sm leading-relaxed text-g60">
            Descreva o problema. Eu varro as iniciativas e gravo a prévia em pulsenff_consultas.
          </p>
          <form action={varrerPulsenff} className="space-y-3">
            <div>
              <label className="label" htmlFor={`${painelId}-q`}>Qual problema você quer resolver?</label>
              <textarea
                ref={campo}
                id={`${painelId}-q`}
                name="q"
                required
                minLength={MIN_CHARS_PROBLEMA}
                maxLength={MAX_CHARS_PROBLEMA}
                rows={4}
                placeholder="Ex.: a cobrança de faturas atrasadas ainda é manual no financeiro."
                className="field mt-1"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/match" className="text-sm font-medium text-[var(--blue)] hover:underline">
                Abrir a página do Match
              </Link>
              <Enviar />
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        aria-label={aberto ? 'Fechar o Pulsenff' : 'Abrir o Pulsenff, match de soluções'}
        aria-expanded={aberto}
        aria-controls={painelId}
        onClick={() => setAberto((v) => !v)}
        className="h-24 w-24 bg-transparent p-0 transition-transform motion-safe:hover:scale-105 motion-safe:focus-visible:scale-105"
      >
        <img src="/pulsenff.png" alt="" className="h-full w-full object-contain" />
      </button>
    </div>
  );
}
