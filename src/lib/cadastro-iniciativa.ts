/**
 * Máquina de etapas do cadastro de iniciativa.
 *
 * O clique em "Sim, seguir para a triagem" precisa avançar com o valor NOVO
 * da opção — se usar o estado anterior (ainda vazio), a lista visível é só
 * Dados + Lei do Bem e o próximo passo é a própria Lei do Bem de novo.
 */

export type EtapaCadastro = 'dados' | 'optin' | 'triagem' | 'revisao';
export type OptaLeiDoBem = 'sim' | 'nao' | '';

export const ETAPAS_CADASTRO: { id: EtapaCadastro; rotulo: string }[] = [
  { id: 'dados', rotulo: 'Dados da iniciativa' },
  { id: 'optin', rotulo: 'Lei do Bem' },
  { id: 'triagem', rotulo: 'Triagem preliminar' },
  { id: 'revisao', rotulo: 'Revisão e salvar' },
];

export function etapasCadastroIniciativa(opta: OptaLeiDoBem): { id: EtapaCadastro; rotulo: string }[] {
  return ETAPAS_CADASTRO.filter((e) => {
    if (e.id === 'triagem') return opta === 'sim';
    if (e.id === 'revisao') return opta === 'sim' || opta === 'nao';
    return true;
  });
}

export function proximaEtapaCadastro(etapa: EtapaCadastro, opta: OptaLeiDoBem): EtapaCadastro {
  const lista = etapasCadastroIniciativa(opta);
  const i = lista.findIndex((e) => e.id === etapa);
  if (i < 0) return lista[0]?.id ?? 'dados';
  return lista[Math.min(lista.length - 1, i + 1)].id;
}

export function etapaAnteriorCadastro(etapa: EtapaCadastro, opta: OptaLeiDoBem): EtapaCadastro {
  const lista = etapasCadastroIniciativa(opta);
  const i = lista.findIndex((e) => e.id === etapa);
  if (i <= 0) return lista[0]?.id ?? 'dados';
  return lista[i - 1].id;
}
