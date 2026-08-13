'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { criarConvite, criarEncontro, type EstadoAdmin } from './actions';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';
import { PAPEIS, ROLE_LABEL } from '@/lib/types';

function Enviar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Enviando…' : rotulo}</Button>;
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
      {estado.link && (
        <p className="num mt-2 break-all rounded-s bg-g20 px-3 py-2 text-xs text-g80">{estado.link}</p>
      )}
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
