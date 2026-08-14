'use client';

import { useId, useState } from 'react';

/**
 * Entrada de habilidades como "chips": cada item vira uma tag removível.
 * Adiciona ao pressionar Enter, vírgula ou selecionar uma sugestão. O valor
 * final é enviado no formulário via input hidden (name), separado por vírgula
 * — casando com o parser `listaDe` da server action.
 */
export function TagInput({
  name, label, valorInicial = [], sugestoes = [], placeholder,
}: {
  name: string;
  label: string;
  valorInicial?: string[];
  sugestoes?: string[];
  placeholder?: string;
}) {
  const [tags, setTags] = useState<string[]>(valorInicial);
  const [texto, setTexto] = useState('');
  const listId = useId();

  function adicionar(bruto: string) {
    const v = bruto.trim().replace(/,$/, '').trim();
    if (!v) return;
    setTags((t) => (t.some((x) => x.toLowerCase() === v.toLowerCase()) ? t : [...t, v]));
    setTexto('');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      adicionar(texto);
    } else if (e.key === 'Backspace' && !texto && tags.length) {
      setTags((t) => t.slice(0, -1));
    }
  }

  return (
    <div>
      <label className="label" htmlFor={`${name}-input`}>{label}</label>
      <input type="hidden" name={name} value={tags.join(',')} />
      <div className="field mt-1 flex flex-wrap items-center gap-1.5 py-1.5">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-s bg-g20 px-2 py-0.5 text-xs font-medium text-g80">
            {t}
            <button
              type="button" aria-label={`Remover ${t}`}
              onClick={() => setTags((cur) => cur.filter((x) => x !== t))}
              className="text-g50 hover:text-[var(--sig-crit)]"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          id={`${name}-input`}
          value={texto}
          onChange={(e) => {
            const v = e.target.value;
            // Se a pessoa colar/selecionar algo com vírgula, quebra em tags.
            if (v.includes(',')) {
              v.split(',').forEach(adicionar);
            } else {
              setTexto(v);
            }
          }}
          onKeyDown={onKeyDown}
          onBlur={() => adicionar(texto)}
          list={listId}
          placeholder={tags.length ? '' : placeholder}
          className="min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
        />
        <datalist id={listId}>
          {sugestoes.map((s) => <option key={s} value={s} />)}
        </datalist>
      </div>
      <p className="mt-1 text-xs text-g50">Digite e pressione Enter (ou vírgula) para adicionar. Clique no ✕ para remover.</p>
    </div>
  );
}
