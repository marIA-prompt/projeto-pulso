'use client';

import { useRouter } from 'next/navigation';
import { rotuloPessoa, type PessoaOpcao } from '@/lib/pessoas';

export function FiltroProprietario({
  pessoas, valor, query,
}: {
  pessoas: PessoaOpcao[];
  valor: string;
  /** Query atual sem o param `owner` — o select acrescenta o id da pessoa. */
  query: Record<string, string>;
}) {
  const router = useRouter();

  function ir(ownerId: string) {
    const sp = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v) sp.set(k, v); });
    if (ownerId) sp.set('owner', ownerId);
    const s = sp.toString();
    router.push(s ? `/projetos?${s}` : '/projetos');
  }

  return (
    <label className="flex items-center gap-2">
      <span className="whitespace-nowrap text-xs font-medium text-g60">Proprietário</span>
      <select
        aria-label="Filtrar por criador ou proprietário"
        className="field max-w-[16rem] py-1.5 text-sm"
        value={valor}
        onChange={(e) => ir(e.target.value)}
      >
        <option value="">Todos</option>
        {pessoas.map((p) => (
          <option key={p.id} value={p.id}>{rotuloPessoa(p)}</option>
        ))}
      </select>
    </label>
  );
}
