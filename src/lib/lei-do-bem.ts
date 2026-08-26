export const TRIAGEM_RESPOSTAS = ['sim', 'parcialmente', 'nao', 'nao_sei'] as const;
export type TriagemResposta = (typeof TRIAGEM_RESPOSTAS)[number];
export type LeiDoBemClassificacao =
  | 'pendente' | 'informacoes_insuficientes' | 'baixo_potencial'
  | 'potencial_parcial' | 'potencialmente_elegivel';

export const TRIAGEM_PERGUNTAS = [
  'O projeto está ligado a um objetivo estratégico, necessidade ou oportunidade claramente identificada?',
  'O problema atual e quem é afetado estão claramente definidos?',
  'Será desenvolvido ou alterado um produto, processo, sistema, serviço ou funcionalidade de forma relevante?',
  'O resultado esperado traz novidade ou ganho técnico/tecnológico relevante para a empresa?',
  'Existe incerteza técnica, ou seja, a solução e o caminho para alcançá-la não são totalmente conhecidos no início?',
  'O desenvolvimento exigirá hipóteses, testes, protótipos, experimentos ou validações técnicas?',
  'O trabalho será planejado, acompanhado e documentado por etapas?',
  'O conhecimento ou resultado gerado poderá ser reproduzido, transferido ou reaproveitado?',
  'É possível separar o desenvolvimento experimental de implantação, parametrização, manutenção, suporte e correções rotineiras?',
  'Os principais desafios ou riscos são técnicos/tecnológicos, e não apenas de prazo, custo ou gestão?',
  'O projeto vai além da simples compra, configuração ou integração de uma solução pronta?',
  'Haverá registros de atividades, horas, testes, decisões e gastos vinculados ao projeto?',
] as const;

export const CLASSIFICACAO_LABEL: Record<LeiDoBemClassificacao, string> = {
  pendente: 'Pendente',
  informacoes_insuficientes: 'Informações insuficientes',
  baixo_potencial: 'Baixo potencial',
  potencial_parcial: 'Potencial parcial',
  potencialmente_elegivel: 'Potencialmente elegível',
};

export const PROXIMA_ACAO: Record<LeiDoBemClassificacao, string> = {
  pendente: 'Responder os itens restantes.',
  informacoes_insuficientes: 'Esclarecer os itens marcados como Não sei.',
  potencialmente_elegivel: 'Encaminhar para análise técnica detalhada e validação fiscal/documental.',
  potencial_parcial: 'Revisar o escopo, separar atividades rotineiras e complementar evidências.',
  baixo_potencial: 'Reavaliar ou reformular o projeto, salvo se houver novas informações técnicas.',
};

const SINTeses = [
  'Objetivo estratégico, necessidade ou oportunidade não demonstrados.',
  'Problema atual ou público afetado não definidos.',
  'Desenvolvimento ou alteração relevante não demonstrados.',
  'Novidade ou ganho técnico-tecnológico não demonstrados.',
  'Incerteza técnica não demonstrada.',
  'Hipóteses, testes ou validações técnicas não demonstrados.',
  'Planejamento e documentação por etapas não demonstrados.',
  'Reprodutibilidade, transferência ou reaproveitamento não demonstrados.',
  'Desenvolvimento experimental não separado de atividades rotineiras.',
  'Desafios técnicos ou tecnológicos não demonstrados.',
  'O projeto aparenta limitar-se a solução pronta.',
  'Registros de atividades, horas, testes, decisões e gastos não demonstrados.',
];

export function calcularTriagem(respostas: Array<TriagemResposta | '' | null | undefined>) {
  if (respostas.filter(Boolean).length < 12) {
    return { classificacao: 'pendente' as const, indice: null, sintese: 'Preencha todas as respostas para gerar a síntese.' };
  }
  if (respostas.includes('nao_sei')) {
    return { classificacao: 'informacoes_insuficientes' as const, indice: null, sintese: 'Há respostas marcadas como Não sei. Esclareça esses itens antes de concluir a triagem.' };
  }
  const indice = (respostas.filter((r) => r === 'sim').length * 2 + respostas.filter((r) => r === 'parcialmente').length) / 24;
  const bloqueio = [2, 3, 4, 5, 8, 9, 10].some((i) => respostas[i] === 'nao');
  const classificacao: LeiDoBemClassificacao = bloqueio || indice < .5
    ? 'baixo_potencial' : indice < .75 ? 'potencial_parcial' : 'potencialmente_elegivel';
  const naos = respostas.map((r, i) => r === 'nao' ? SINTeses[i] : null).filter(Boolean).join(' ');
  return {
    classificacao,
    indice,
    sintese: naos || 'As respostas não indicam bloqueios críticos. A elegibilidade final ainda depende de validação técnica, fiscal, contábil e documental.',
  };
}
