/**
 * Lista fechada das diretorias no cadastro de iniciativa.
 * O banco (tabela diretorias) manda quando já tem linhas; esta constante
 * cobre o formulário antes da migration 0018.
 */
export const DIRETORIAS_CADASTRO = [
  'Área Vendas Varejo Expansão',
  'Área Dados e Infraestrutura',
  'Área Operações e Atendimento',
  'Área Consignado',
  'Área Tecnologia da Informação',
  'Área Pós Vendas Private Label',
  'Área Controladoria',
  'Área Crédito/Cobrança',
  'Área Comercial PJ',
  'Área Adquirência e Marketplace',
  'Área de Tesouraria e Captação',
  'Área de Processos',
  'Área de Seguros',
  'Área de RH',
] as const;

export function nomesDiretoria(vindosDoBanco: readonly string[]): string[] {
  const origem = vindosDoBanco.map((nome) => nome.trim()).filter(Boolean);
  const base = origem.length ? origem : [...DIRETORIAS_CADASTRO];
  const vistos = new Set<string>();
  const lista: string[] = [];
  for (const nome of base) {
    if (vistos.has(nome)) continue;
    vistos.add(nome);
    lista.push(nome);
  }
  return lista;
}

/** Inclui o texto já gravado quando ele não está na lista, para a edição não apagá-lo. */
export function opcoesDiretoria(nomes: readonly string[], atual?: string | null): string[] {
  const lista = nomesDiretoria(nomes);
  const legado = (atual ?? '').trim();
  if (legado && !lista.includes(legado)) lista.push(legado);
  return lista;
}
