export type PessoaOpcao = { id: string; full_name: string | null };

/** Rótulo de UI para um perfil. O valor gravado é sempre o id. */
export function rotuloPessoa(p: { full_name: string | null } | null | undefined): string {
  const n = p?.full_name?.trim();
  return n || 'Sem nome';
}

export function nomeProprietario(
  ownerId: string | null | undefined,
  perfil: { full_name: string | null } | null | undefined,
): string {
  if (!ownerId) return 'Sem proprietário';
  return rotuloPessoa(perfil);
}

