'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { aceitarConvite, type EstadoAceite } from './actions';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Concluindo…' : 'Concluir cadastro'}
    </Button>
  );
}

export function AceiteForm({
  token, areas,
}: { token: string; areas: { id: string; name: string }[] }) {
  const [estado, action] = useFormState(aceitarConvite, {} as EstadoAceite);

  return (
    <form action={action} className="card mt-6 space-y-4 p-6">
      {estado.erro && <ErroBox mensagem={estado.erro} />}
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="label" htmlFor="nome">Nome completo</label>
        <input id="nome" name="nome" required autoComplete="name" className="field mt-1" />
      </div>

      <div>
        <label className="label" htmlFor="areaId">Sua área</label>
        <select id="areaId" name="areaId" className="field mt-1" defaultValue="">
          <option value="">Prefiro informar depois</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="senha">Senha</label>
        <input
          id="senha" name="senha" type="password" required minLength={10}
          autoComplete="new-password" className="field mt-1"
          aria-describedby="dica-senha"
        />
        <p id="dica-senha" className="mt-1 text-xs text-g50">Mínimo de 10 caracteres.</p>
      </div>

      <div>
        <label className="label" htmlFor="confirmacao">Repita a senha</label>
        <input
          id="confirmacao" name="confirmacao" type="password" required
          autoComplete="new-password" className="field mt-1"
        />
      </div>

      <Enviar />
    </form>
  );
}
