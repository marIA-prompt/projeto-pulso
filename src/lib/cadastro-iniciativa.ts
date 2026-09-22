/**
 * Máquina de etapas do cadastro de iniciativa.
 *
 * O clique em "Sim, seguir para a triagem" precisa avançar com o valor NOVO
 * da opção — se usar o estado anterior (ainda vazio), a lista visível é só
 * Dados + Lei do Bem e o próximo passo é a própria Lei do Bem de novo.
 */

export type EtapaCadastro = 'dados' | 'optin' | 'cadastro' | 'triagem' | 'revisao';
export type OptaLeiDoBem = 'sim' | 'nao' | '';

/**
 * Cadastro do projeto (os 5 campos de escopo) fica na etapa da Lei do Bem,
 * não nos dados gerais da iniciativa: só quem opta precisa deles para a
 * validação humana, e aí são obrigatórios.
 */
export const ETAPAS_CADASTRO: { id: EtapaCadastro; rotulo: string }[] = [
  { id: 'dados', rotulo: 'Dados da iniciativa' },
  { id: 'optin', rotulo: 'Lei do Bem' },
  { id: 'cadastro', rotulo: 'Cadastro do projeto' },
  { id: 'triagem', rotulo: 'Triagem preliminar' },
  { id: 'revisao', rotulo: 'Revisão e salvar' },
];

export function etapasCadastroIniciativa(opta: OptaLeiDoBem): { id: EtapaCadastro; rotulo: string }[] {
  return ETAPAS_CADASTRO.filter((e) => {
    if (e.id === 'cadastro' || e.id === 'triagem') return opta === 'sim';
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

/**
 * Impede pular Cadastro do projeto (os 5 campos obrigatórios) pela barra de etapas.
 */
export function destinoEtapaCadastro(
  destino: EtapaCadastro,
  opta: OptaLeiDoBem,
  escopoCompleto: boolean,
): EtapaCadastro {
  const visiveis = etapasCadastroIniciativa(opta);
  if (!visiveis.some((e) => e.id === destino)) return visiveis[0]?.id ?? 'dados';
  if (opta === 'sim' && !escopoCompleto && (destino === 'triagem' || destino === 'revisao')) {
    return 'cadastro';
  }
  return destino;
}
