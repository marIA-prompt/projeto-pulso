'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { cadastrar, type EstadoCadastro } from './actions';
import { TagInput } from '@/app/(app)/comunidade/TagInput';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Criando conta…' : 'Criar conta'}
    </Button>
  );
}

export function CadastroForm({
  areas,
}: {
  areas: { id: string; name: string }[];
}) {
  const [estado, action] = useFormState(cadastrar, {} as EstadoCadastro);

  return (
    <form action={action} className="card space-y-4 p-6">
      {estado.erro && <ErroBox mensagem={estado.erro} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="nome">Nome</label>
          <input
            id="nome" name="nome" required minLength={2} autoComplete="given-name"
            className="field mt-1" placeholder="Maria Clara"
          />
        </div>
        <div>
          <label className="label" htmlFor="sobrenome">Sobrenome</label>
          <input
            id="sobrenome" name="sobrenome" required minLength={2} autoComplete="family-name"
            className="field mt-1" placeholder="Morais"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="email">E-mail Senff</label>
        <input
          id="email" name="email" type="email" required autoComplete="email"
          className="field mt-1" placeholder="nome.sobrenome@senff.com.br"
        />
        <p className="mt-1 text-xs text-g50">Somente endereços @senff.com.br.</p>
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

      <div>
        <label className="label" htmlFor="areaId">Área</label>
        <select id="areaId" name="areaId" required className="field mt-1" defaultValue="">
          <option value="" disabled>Selecione sua área</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <TagInput
        name="interests"
        label="Interesses (opcional)"
        sugestoes={[
          'IA Generativa', 'Dados & BI', 'Automação de Processos', 'Atendimento',
          'RPA', 'Machine Learning', 'Integrações/APIs', 'Compliance',
        ]}
        placeholder="IA Generativa, Dados & BI…"
      />

      <Enviar />

      <p className="text-center text-sm text-g60">
        Já tenho conta —{' '}
        <Link href="/login" className="underline hover:text-g90">entrar</Link>
      </p>
    </form>
  );
}
