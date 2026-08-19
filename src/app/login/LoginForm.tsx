'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { entrar, recuperarSenha, type EstadoForm } from './actions';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';

const inicial: EstadoForm = {};

function Enviar({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className="w-full">{pending ? 'Enviando…' : children}</Button>;
}

export function LoginForm({ next }: { next?: string }) {
  const [modo, setModo] = useState<'login' | 'recuperar'>('login');
  const [estadoLogin, actionLogin] = useFormState(entrar, inicial);
  const [estadoRec, actionRec] = useFormState(recuperarSenha, inicial);

  if (modo === 'recuperar') {
    return (
      // key distinto força o React a montar um formulário novo em vez de
      // reaproveitar os <input> do login por posição — sem isso, o campo de
      // senha (mascarado) era reusado como campo de e-mail e expunha o valor.
      <form key="recuperar" action={actionRec} className="card space-y-4 p-6">
        <h2 className="text-base font-semibold">Redefinir senha</h2>
        {estadoRec.erro && <ErroBox mensagem={estadoRec.erro} />}
        {estadoRec.ok && (
          <p role="status" className="rounded-s bg-[var(--sig-ok-bg)] px-3 py-2 text-sm text-[var(--sig-ok)]">
            {estadoRec.ok}
          </p>
        )}
        <div>
          <label className="label" htmlFor="email-rec">E-mail</label>
          <input id="email-rec" name="email" type="email" required autoComplete="email" className="field mt-1" />
        </div>
        <Enviar>Enviar link</Enviar>
        <button type="button" onClick={() => setModo('login')} className="w-full text-sm text-g60 underline">
          Voltar para o login
        </button>
      </form>
    );
  }

  return (
    <form key="login" action={actionLogin} className="card space-y-4 p-6">
      {estadoLogin.erro && <ErroBox mensagem={estadoLogin.erro} />}
      <input type="hidden" name="next" value={next ?? ''} />
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field mt-1" />
      </div>
      <div>
        <label className="label" htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" required autoComplete="current-password" className="field mt-1" />
      </div>
      <Enviar>Entrar</Enviar>
      <button type="button" onClick={() => setModo('recuperar')} className="w-full text-sm text-g60 underline">
        Esqueci minha senha
      </button>
    </form>
  );
}
