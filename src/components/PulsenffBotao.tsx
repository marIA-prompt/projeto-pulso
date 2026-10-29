'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { DUVIDAS_FREQUENTES } from '@/lib/faq-pulso';
import { MAX_CHARS_PROBLEMA, MIN_CHARS_PROBLEMA, PULSENFF } from '@/lib/match-solucoes';
import { varrerPulsenff } from '@/app/(app)/match/actions';

type Tela = 'menu' | 'match' | 'faq';

const TITULO: Record<Tela, string> = {
  menu: 'Como posso ajudar?',
  match: 'Match de soluções',
  faq: 'Dúvidas frequentes',
};

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
  const [tela, setTela] = useState<Tela>('menu');
  const raiz = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const painelId = useId();

  function fechar() {
    setAberto(false);
    setTela('menu');
  }

  useEffect(() => {
    if (!aberto) return;
    if (tela === 'match') campo.current?.focus();
    function tecla(e: KeyboardEvent) {
      if (e.key === 'Escape') fechar();
    }
    function fora(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) fechar();
    }
    document.addEventListener('keydown', tecla);
    document.addEventListener('mousedown', fora);
    return () => {
      document.removeEventListener('keydown', tecla);
      document.removeEventListener('mousedown', fora);
    };
  }, [aberto, tela]);

  return (
    <div ref={raiz} className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-3">
      {aberto && (
        <section
          id={painelId}
          role="dialog"
          aria-labelledby={`${painelId}-titulo`}
          className="card flex max-h-[min(36rem,calc(100vh-8rem))] w-[min(24rem,calc(100vw-2.5rem))] flex-col border-l-4 border-l-[var(--blue)] shadow-2"
        >
          <div className="flex items-start justify-between gap-3 p-4 pb-2">
            <div>
              <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">{PULSENFF}</p>
              <h2 id={`${painelId}-titulo`} className="text-base font-semibold">{TITULO[tela]}</h2>
            </div>
            <button
              type="button"
              onClick={fechar}
              className="rounded-s px-2 py-1 text-sm text-g60 hover:bg-g20"
            >
              Fechar
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto px-4 pb-4">
            {tela === 'menu' && (
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setTela('match')}
                  className="rounded-s border border-g30 px-3 py-3 text-left hover:bg-g20"
                >
                  <span className="block text-sm font-semibold text-g90">Descobrir match de iniciativa</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-g50">
                    Descreva um problema e veja se já existe iniciativa parecida.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTela('faq')}
                  className="rounded-s border border-g30 px-3 py-3 text-left hover:bg-g20"
                >
                  <span className="block text-sm font-semibold text-g90">Dúvidas frequentes</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-g50">
                    Respostas curtas sobre a plataforma.
                  </span>
                </button>
              </div>
            )}

            {tela === 'match' && (
              <>
                <button
                  type="button"
                  onClick={() => setTela('menu')}
                  className="text-sm font-medium text-[var(--blue)] hover:underline"
                >
                  Voltar
                </button>
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
              </>
            )}

            {tela === 'faq' && (
              <>
                <button
                  type="button"
                  onClick={() => setTela('menu')}
                  className="text-sm font-medium text-[var(--blue)] hover:underline"
                >
                  Voltar
                </button>
                <ul className="grid gap-2">
                  {DUVIDAS_FREQUENTES.map((duvida) => (
                    <li key={duvida.pergunta} className="rounded-s border border-g30 px-3 py-2">
                      <details>
                        <summary className="cursor-pointer text-sm font-medium text-g90">
                          {duvida.pergunta}
                        </summary>
                        <p className="mt-2 text-sm leading-relaxed text-g60">{duvida.resposta}</p>
                      </details>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        aria-label={aberto ? 'Fechar o Pulsenff' : 'Abrir o Pulsenff'}
        aria-expanded={aberto}
        aria-controls={painelId}
        onClick={() => (aberto ? fechar() : setAberto(true))}
        className="h-24 w-24 bg-transparent p-0 transition-transform motion-safe:hover:scale-105 motion-safe:focus-visible:scale-105"
      >
        <img src="/pulsenff.png" alt="" className="h-full w-full object-contain" />
      </button>
    </div>
  );
}
