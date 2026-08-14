'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { criarConvite, criarEncontro, atualizarEncontro, type EstadoAdmin } from './actions';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';
import { PAPEIS, ROLE_LABEL } from '@/lib/types';
import { dataLonga } from '@/lib/format';

function Enviar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Enviando…' : rotulo}</Button>;
}

function CopiarLink({ link }: { link: string }) {
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
        className="shrink-0 rounded-s border border-g40 bg-white px-2 py-1 text-xs font-medium text-g80 hover:bg-g20"
      >
        {copiado ? 'Copiado!' : 'Copiar link'}
      </button>
    </div>
  );
}

function Retorno({ estado }: { estado: EstadoAdmin }) {
  return (
    <div aria-live="polite">
      {estado.erro && <ErroBox mensagem={estado.erro} />}
      {estado.ok && (
        <p className="rounded-s bg-[var(--sig-ok-bg)] px-3 py-2 text-sm text-[var(--sig-ok)]">
          {estado.ok}
        </p>
      )}
      {estado.link && <CopiarLink link={estado.link} />}
    </div>
  );
}

export function ConviteForm() {
  const [estado, action] = useFormState(criarConvite, {} as EstadoAdmin);
  return (
    <form action={action} className="card space-y-4 p-4">
      <Retorno estado={estado} />
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="conv-email">E-mail para convidar</label>
          <input id="conv-email" name="email" type="email" required className="field mt-1" />
        </div>
        <div>
          <label className="label" htmlFor="conv-role">Papel</label>
          <select id="conv-role" name="role" className="field mt-1" defaultValue="participante">
            {PAPEIS.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </div>
        <Enviar rotulo="Enviar convite" />
      </div>
      <p className="text-xs text-g50">O convite vale por 7 dias e pode ser reenviado ou cancelado.</p>
    </form>
  );
}

export function EncontroForm() {
  const [estado, action] = useFormState(criarEncontro, {} as EstadoAdmin);
  return (
    <form action={action} className="card space-y-4 p-4">
      <Retorno estado={estado} />
      <div className="grid gap-3 sm:grid-cols-[1fr_16rem_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="enc-title">Nome do encontro</label>
          <input id="enc-title" name="title" required className="field mt-1"
                 placeholder="Encontro semanal do Pulso" />
        </div>
        <div>
          <label className="label" htmlFor="enc-data">Data e hora</label>
          <input id="enc-data" name="scheduled_at" type="datetime-local" required className="field mt-1" />
        </div>
        <Enviar rotulo="Criar encontro" />
      </div>
      <div>
        <label className="label" htmlFor="enc-desc">Pauta (opcional)</label>
        <input id="enc-desc" name="description" className="field mt-1" />
      </div>
      <label className="flex items-center gap-2 text-sm text-g80">
        <input type="checkbox" name="convidarTodos" defaultChecked /> Convidar todos os participantes ativos
      </label>
    </form>
  );
}

type Encontro = { id: string; title: string; scheduled_at: string; description: string | null };

/** Converte um ISO em valor para <input type="datetime-local">, mantendo o
 * mesmo relógio de parede usado na criação (round-trip consistente). */
function paraInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 16);
}

export function EncontroItem({ encontro }: { encontro: Encontro }) {
  const [editando, setEditando] = useState(false);
  const [estado, action] = useFormState(atualizarEncontro, {} as EstadoAdmin);

  if (!editando && !estado.ok) {
    return (
      <li className="card flex flex-wrap items-baseline justify-between gap-2 p-3">
        <div className="min-w-0">
          <span className="font-medium text-g90">{encontro.title}</span>
          {encontro.description && <p className="mt-0.5 text-xs text-g60">{encontro.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="num text-xs text-g50">{dataLonga(encontro.scheduled_at)}</span>
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="rounded-s border border-g40 px-2 py-1 text-xs text-g80 hover:bg-g20"
          >
            Editar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="card space-y-3 p-4">
      <Retorno estado={estado} />
      <form action={action} className="space-y-3" onSubmit={() => setEditando(false)}>
        <input type="hidden" name="id" value={encontro.id} />
        <div className="grid gap-3 sm:grid-cols-[1fr_16rem]">
          <div>
            <label className="label" htmlFor={`t-${encontro.id}`}>Nome do encontro</label>
            <input id={`t-${encontro.id}`} name="title" required defaultValue={encontro.title} className="field mt-1" />
          </div>
          <div>
            <label className="label" htmlFor={`d-${encontro.id}`}>Data e hora</label>
            <input id={`d-${encontro.id}`} name="scheduled_at" type="datetime-local" required
                   defaultValue={paraInput(encontro.scheduled_at)} className="field mt-1" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor={`p-${encontro.id}`}>Pauta (opcional)</label>
          <input id={`p-${encontro.id}`} name="description" defaultValue={encontro.description ?? ''} className="field mt-1" />
        </div>
        <div className="flex gap-2">
          <Enviar rotulo="Salvar encontro" />
          <button type="button" onClick={() => setEditando(false)}
                  className="rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g80 hover:bg-g20">
            Cancelar
          </button>
        </div>
      </form>
    </li>
  );
}
