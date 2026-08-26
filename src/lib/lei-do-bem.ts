export const LEI_DO_BEM_RESPOSTAS = ['sim', 'parcialmente', 'nao', 'nao_sei'] as const;
export type LeiDoBemResposta = (typeof LEI_DO_BEM_RESPOSTAS)[number];

export const LEI_DO_BEM_CLASSIFICACOES = [
  'pendente',
  'informacoes_insuficientes',
  'baixo_potencial',
  'potencial_parcial',
  'potencialmente_elegivel',
] as const;
export type LeiDoBemClassificacao = (typeof LEI_DO_BEM_CLASSIFICACOES)[number];

export const LEI_DO_BEM_STATUS = [
  'backlog',
  'em_avaliacao_interna',
  'enquadrado',
  'nao_enquadrado',
] as const;
export type LeiDoBemStatus = (typeof LEI_DO_BEM_STATUS)[number];

export const LEI_DO_BEM_PRIORIDADES = ['baixa', 'media', 'alta'] as const;
export type LeiDoBemPrioridade = (typeof LEI_DO_BEM_PRIORIDADES)[number];

export const RESPOSTA_LABEL: Record<LeiDoBemResposta, string> = {
  sim: 'Sim',
  parcialmente: 'Parcialmente',
  nao: 'Não',
  nao_sei: 'Não sei',
};

export const CLASSIFICACAO_LABEL: Record<LeiDoBemClassificacao, string> = {
  pendente: 'Pendente',
  informacoes_insuficientes: 'Informações insuficientes',
  baixo_potencial: 'Baixo potencial',
  potencial_parcial: 'Potencial parcial',
  potencialmente_elegivel: 'Potencialmente elegível',
};

export const STATUS_LEI_DO_BEM_LABEL: Record<LeiDoBemStatus, string> = {
  backlog: 'Backlog',
  em_avaliacao_interna: 'Em avaliação interna',
  enquadrado: 'Enquadrado',
  nao_enquadrado: 'Não enquadrado',
};

export const PRIORIDADE_LEI_DO_BEM_LABEL: Record<LeiDoBemPrioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

export const TRIAGEM_PERGUNTAS = [
  {
    numero: 1,
    texto: 'O projeto está ligado a um objetivo estratégico, necessidade ou oportunidade claramente identificada?',
    bloqueioDuro: false,
    sinteseNao: 'Objetivo estratégico, necessidade ou oportunidade não demonstrados.',
  },
  {
    numero: 2,
    texto: 'O problema atual e quem é afetado estão claramente definidos?',
    bloqueioDuro: false,
    sinteseNao: 'Problema atual ou público afetado não definidos.',
  },
  {
    numero: 3,
    texto: 'Será desenvolvido ou alterado um produto, processo, sistema, serviço ou funcionalidade de forma relevante?',
    bloqueioDuro: true,
    sinteseNao: 'Desenvolvimento ou alteração relevante não demonstrados.',
  },
  {
    numero: 4,
    texto: 'O resultado esperado traz novidade ou ganho técnico/tecnológico relevante para a empresa?',
    bloqueioDuro: true,
    sinteseNao: 'Novidade ou ganho técnico/tecnológico relevante não demonstrado.',
  },
  {
    numero: 5,
    texto: 'Existe incerteza técnica, ou seja, a solução e o caminho para alcançá-la não são totalmente conhecidos no início?',
    bloqueioDuro: true,
    sinteseNao: 'Incerteza técnica não demonstrada.',
  },
  {
    numero: 6,
    texto: 'O desenvolvimento exigirá hipóteses, testes, protótipos, experimentos ou validações técnicas?',
    bloqueioDuro: true,
    sinteseNao: 'Hipóteses, testes, protótipos, experimentos ou validações técnicas não previstos.',
  },
  {
    numero: 7,
    texto: 'O trabalho será planejado, acompanhado e documentado por etapas?',
    bloqueioDuro: false,
    sinteseNao: 'Planejamento, acompanhamento e documentação por etapas não previstos.',
  },
  {
    numero: 8,
    texto: 'O conhecimento ou resultado gerado poderá ser reproduzido, transferido ou reaproveitado?',
    bloqueioDuro: false,
    sinteseNao: 'Reprodutibilidade, transferência ou reaproveitamento não demonstrados.',
  },
  {
    numero: 9,
    texto: 'É possível separar o desenvolvimento experimental de implantação, parametrização, manutenção, suporte e correções rotineiras?',
    bloqueioDuro: true,
    sinteseNao: 'Desenvolvimento experimental não separado de implantação ou rotina.',
  },
  {
    numero: 10,
    texto: 'Os principais desafios ou riscos são técnicos/tecnológicos, e não apenas de prazo, custo ou gestão?',
    bloqueioDuro: true,
    sinteseNao: 'Os desafios aparentam ser apenas de prazo, custo ou gestão.',
  },
  {
    numero: 11,
    texto: 'O projeto vai além da simples compra, configuração ou integração de uma solução pronta?',
    bloqueioDuro: true,
    sinteseNao: 'O projeto aparenta limitar-se a solução pronta.',
  },
  {
    numero: 12,
    texto: 'Haverá registros de atividades, horas, testes, decisões e gastos vinculados ao projeto?',
    bloqueioDuro: false,
    sinteseNao: 'Registros de atividades, horas, testes, decisões e gastos não previstos.',
  },
] as const;

export type ResultadoTriagem = {
  classificacao: LeiDoBemClassificacao;
  indice: number | null;
  sintese: string;
  proximaAcao: string;
};

const PROXIMA_ACAO: Record<LeiDoBemClassificacao, string> = {
  pendente: 'Responder os itens restantes.',
  informacoes_insuficientes: 'Esclarecer os itens marcados como Não sei.',
  potencialmente_elegivel: 'Encaminhar para análise técnica detalhada e validação fiscal/documental.',
  potencial_parcial: 'Revisar o escopo, separar atividades rotineiras e complementar evidências.',
  baixo_potencial: 'Reavaliar ou reformular o projeto, salvo se houver novas informações técnicas.',
};

export function classificarTriagem(
  respostas: Array<LeiDoBemResposta | null | undefined>,
): ResultadoTriagem {
  const preenchidas = respostas.filter(Boolean) as LeiDoBemResposta[];

  if (preenchidas.length < TRIAGEM_PERGUNTAS.length) {
    return {
      classificacao: 'pendente',
      indice: null,
      sintese: 'Preencha todas as respostas para gerar a síntese.',
      proximaAcao: PROXIMA_ACAO.pendente,
    };
  }

  const indice = (
    preenchidas.filter((r) => r === 'sim').length * 2
    + preenchidas.filter((r) => r === 'parcialmente').length
  ) / 24;

  if (preenchidas.includes('nao_sei')) {
    return {
      classificacao: 'informacoes_insuficientes',
      indice,
      sintese: 'Há respostas marcadas como Não sei. Esclareça esses itens antes de concluir a triagem.',
      proximaAcao: PROXIMA_ACAO.informacoes_insuficientes,
    };
  }

  const temBloqueio = TRIAGEM_PERGUNTAS.some(
    (pergunta, i) => pergunta.bloqueioDuro && preenchidas[i] === 'nao',
  );
  const classificacao: LeiDoBemClassificacao = temBloqueio || indice < 0.5
    ? 'baixo_potencial'
    : indice < 0.75
      ? 'potencial_parcial'
      : 'potencialmente_elegivel';

  const negativas = TRIAGEM_PERGUNTAS
    .filter((_, i) => preenchidas[i] === 'nao')
    .map((pergunta) => pergunta.sinteseNao);

  return {
    classificacao,
    indice,
    sintese: negativas.length === 0
      ? 'As respostas não indicam bloqueios críticos. A elegibilidade final ainda depende de validação técnica, fiscal, contábil e documental.'
      : negativas.join(' '),
    proximaAcao: PROXIMA_ACAO[classificacao],
  };
}

export function classeClassificacao(classificacao: LeiDoBemClassificacao): string {
  if (classificacao === 'potencialmente_elegivel') {
    return 'bg-[var(--sig-ok-bg)] text-[var(--sig-ok)]';
  }
  if (classificacao === 'potencial_parcial') {
    return 'bg-[var(--sig-warn-bg)] text-[var(--sig-warn)]';
  }
  if (classificacao === 'baixo_potencial') {
    return 'bg-[var(--sig-crit-bg)] text-[var(--sig-crit)]';
  }
  return 'bg-g20 text-g60';
}
