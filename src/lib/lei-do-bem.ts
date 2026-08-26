/**
 * Triagem preliminar Lei do Bem — espelho 1:1 da planilha
 * `Triagem_Preliminar_Lei_do_Bem_Simples` (células B27–B30).
 *
 * A mesma fórmula vive no trigger `lei_do_bem_calcular_triagem`
 * (supabase/migrations/0010_lei_do_bem.sql). Mudou aqui, muda lá.
 *
 * A triagem SINALIZA, nunca bloqueia o cadastro nem a entrada na aba.
 */

export const LEI_DO_BEM_RESPOSTAS = ['sim', 'parcialmente', 'nao', 'nao_sei'] as const;
export type LeiDoBemResposta = (typeof LEI_DO_BEM_RESPOSTAS)[number];

export const LEI_DO_BEM_RESPOSTA_LABEL: Record<LeiDoBemResposta, string> = {
  sim: 'Sim',
  parcialmente: 'Parcialmente',
  nao: 'Não',
  nao_sei: 'Não sei',
};

export const LEI_DO_BEM_STATUS = [
  'backlog',
  'em_avaliacao_interna',
  'enquadrado',
  'nao_enquadrado',
] as const;
export type LeiDoBemStatus = (typeof LEI_DO_BEM_STATUS)[number];

export const LEI_DO_BEM_STATUS_LABEL: Record<LeiDoBemStatus, string> = {
  backlog: 'Backlog',
  em_avaliacao_interna: 'Em avaliação interna',
  enquadrado: 'Enquadrado',
  nao_enquadrado: 'Não enquadrado',
};

/** Faixa superior da coluna do kanban — tokens semânticos já usados no semáforo. */
export const LEI_DO_BEM_STATUS_TOM: Record<LeiDoBemStatus, 'g' | 'warn' | 'ok' | 'crit'> = {
  backlog: 'g',
  em_avaliacao_interna: 'warn',
  enquadrado: 'ok',
  nao_enquadrado: 'crit',
};

export const LEI_DO_BEM_CLASSIFICACOES = [
  'pendente',
  'informacoes_insuficientes',
  'baixo_potencial',
  'potencial_parcial',
  'potencialmente_elegivel',
] as const;
export type LeiDoBemClassificacao = (typeof LEI_DO_BEM_CLASSIFICACOES)[number];

export const LEI_DO_BEM_CLASSIFICACAO_LABEL: Record<LeiDoBemClassificacao, string> = {
  pendente: 'Pendente',
  informacoes_insuficientes: 'Informações insuficientes',
  baixo_potencial: 'Baixo potencial',
  potencial_parcial: 'Potencial parcial',
  potencialmente_elegivel: 'Potencialmente elegível',
};

/** Cores semânticas do design system — nunca os hex da planilha. */
export const LEI_DO_BEM_CLASSIFICACAO_TOM: Record<LeiDoBemClassificacao, 'ok' | 'warn' | 'crit' | 'g'> = {
  potencialmente_elegivel: 'ok',
  potencial_parcial: 'warn',
  baixo_potencial: 'crit',
  pendente: 'g',
  informacoes_insuficientes: 'g',
};

/** Escala da auditoria (a Matriz de 4 eixos saiu do cadastro). */
export const LEI_DO_BEM_PRIORIDADES = ['alta', 'media', 'baixa'] as const;
export type LeiDoBemPrioridade = (typeof LEI_DO_BEM_PRIORIDADES)[number];

export const LEI_DO_BEM_PRIORIDADE_LABEL: Record<LeiDoBemPrioridade, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

/**
 * Frases concatenadas na síntese quando o item é "Não".
 * Itens 5 e 11 são o texto citado no instrumento; os demais seguem o mesmo
 * tom telegráfico da célula B29, um por pergunta, na ordem 1→12.
 */
export const TRIAGEM_ITENS = [
  {
    n: 1,
    campo: 'triagem_01',
    bloqueioDuro: false,
    pergunta: 'O projeto está ligado a um objetivo estratégico, necessidade ou oportunidade claramente identificada?',
    sinteseNao: 'Vínculo estratégico, necessidade ou oportunidade não evidenciado. ',
  },
  {
    n: 2,
    campo: 'triagem_02',
    bloqueioDuro: false,
    pergunta: 'O problema atual e quem é afetado estão claramente definidos?',
    sinteseNao: 'Problema atual e público afetado não estão claros. ',
  },
  {
    n: 3,
    campo: 'triagem_03',
    bloqueioDuro: true,
    pergunta: 'Será desenvolvido ou alterado um produto, processo, sistema, serviço ou funcionalidade de forma relevante?',
    sinteseNao: 'Não há desenvolvimento ou alteração relevante de produto, processo, sistema, serviço ou funcionalidade. ',
  },
  {
    n: 4,
    campo: 'triagem_04',
    bloqueioDuro: true,
    pergunta: 'O resultado esperado traz novidade ou ganho técnico/tecnológico relevante para a empresa?',
    sinteseNao: 'Não há novidade ou ganho técnico/tecnológico relevante. ',
  },
  {
    n: 5,
    campo: 'triagem_05',
    bloqueioDuro: true,
    pergunta: 'Existe incerteza técnica, ou seja, a solução e o caminho para alcançá-la não são totalmente conhecidos no início?',
    sinteseNao: 'Incerteza técnica não demonstrada. ',
  },
  {
    n: 6,
    campo: 'triagem_06',
    bloqueioDuro: true,
    pergunta: 'O desenvolvimento exigirá hipóteses, testes, protótipos, experimentos ou validações técnicas?',
    sinteseNao: 'O desenvolvimento não exigirá hipóteses, testes, protótipos, experimentos ou validações técnicas. ',
  },
  {
    n: 7,
    campo: 'triagem_07',
    bloqueioDuro: false,
    pergunta: 'O trabalho será planejado, acompanhado e documentado por etapas?',
    sinteseNao: 'O trabalho não será planejado, acompanhado e documentado por etapas. ',
  },
  {
    n: 8,
    campo: 'triagem_08',
    bloqueioDuro: false,
    pergunta: 'O conhecimento ou resultado gerado poderá ser reproduzido, transferido ou reaproveitado?',
    sinteseNao: 'O conhecimento ou resultado gerado não poderá ser reproduzido, transferido ou reaproveitado. ',
  },
  {
    n: 9,
    campo: 'triagem_09',
    bloqueioDuro: true,
    pergunta: 'É possível separar o desenvolvimento experimental de implantação, parametrização, manutenção, suporte e correções rotineiras?',
    sinteseNao: 'Não é possível separar o desenvolvimento experimental das atividades rotineiras. ',
  },
  {
    n: 10,
    campo: 'triagem_10',
    bloqueioDuro: true,
    pergunta: 'Os principais desafios ou riscos são técnicos/tecnológicos, e não apenas de prazo, custo ou gestão?',
    sinteseNao: 'Os desafios ou riscos não são técnicos/tecnológicos. ',
  },
  {
    n: 11,
    campo: 'triagem_11',
    bloqueioDuro: true,
    pergunta: 'O projeto vai além da simples compra, configuração ou integração de uma solução pronta?',
    sinteseNao: 'O projeto aparenta limitar-se a solução pronta. ',
  },
  {
    n: 12,
    campo: 'triagem_12',
    bloqueioDuro: false,
    pergunta: 'Haverá registros de atividades, horas, testes, decisões e gastos vinculados ao projeto?',
    sinteseNao: 'Não haverá registros de atividades, horas, testes, decisões e gastos. ',
  },
] as const;

export type TriagemCampo = (typeof TRIAGEM_ITENS)[number]['campo'];

export const TRIAGEM_CAMPOS: TriagemCampo[] = TRIAGEM_ITENS.map((i) => i.campo);

export const SINTESSE_PENDENTE = 'Preencha todas as respostas para gerar a síntese.';
export const SINTESSE_INSUFICIENTE =
  'Há respostas marcadas como Não sei. Esclareça esses itens antes de concluir a triagem.';
export const SINTESSE_SEM_BLOQUEIO =
  'As respostas não indicam bloqueios críticos. A elegibilidade final ainda depende de validação técnica, fiscal, contábil e documental.';

export const PROXIMA_ACAO: Record<LeiDoBemClassificacao, string> = {
  pendente: 'Responder os itens restantes.',
  informacoes_insuficientes: 'Esclarecer os itens marcados como Não sei.',
  potencialmente_elegivel: 'Encaminhar para análise técnica detalhada e validação fiscal/documental.',
  potencial_parcial: 'Revisar o escopo, separar atividades rotineiras e complementar evidências.',
  baixo_potencial: 'Reavaliar ou reformular o projeto, salvo se houver novas informações técnicas.',
};

export const COMO_INTERPRETAR = [
  {
    classe: 'potencialmente_elegivel' as const,
    texto: 'Atende preliminarmente aos critérios técnicos e deve seguir para validação detalhada.',
  },
  {
    classe: 'potencial_parcial' as const,
    texto: 'Há indícios, mas o escopo ou as evidências precisam ser melhorados.',
  },
  {
    classe: 'baixo_potencial' as const,
    texto: 'As respostas indicam ausência de um ou mais elementos técnicos essenciais.',
  },
];

export const REFERENCIAS_METODOLOGICAS = [
  {
    rotulo: 'Manual de Frascati 2015',
    href: 'https://www.oecd.org/en/publications/frascati-manual-2015_9789264239012-en.html',
  },
  {
    rotulo: 'Manual de Oslo 2018',
    href: 'https://www.oecd.org/en/publications/oslo-manual-2018_9789264304604-en.html',
  },
  {
    rotulo: 'Lei nº 11.196/2005',
    href: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11196.htm',
  },
  {
    rotulo: 'Decreto nº 5.798/2006',
    href: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/decreto/d5798.htm',
  },
];

export const AVISO_TRIAGEM =
  'Trata-se de triagem preliminar e não substitui a validação técnica, fiscal, contábil e documental.';

export type ResultadoTriagem = {
  classificacao: LeiDoBemClassificacao;
  indice: number | null;
  sintese: string;
  proximaAcao: string;
};

export type RespostasTriagem = Partial<Record<TriagemCampo, LeiDoBemResposta | null | ''>>;

function ehResposta(v: unknown): v is LeiDoBemResposta {
  return v === 'sim' || v === 'parcialmente' || v === 'nao' || v === 'nao_sei';
}

/** Índice bruto (Sim×2 + Parcialmente) / 24, antes do arredondamento para persistir. */
export function indiceAderenciaBruto(respostas: RespostasTriagem): number {
  let sims = 0;
  let parciais = 0;
  for (const item of TRIAGEM_ITENS) {
    const r = respostas[item.campo];
    if (r === 'sim') sims += 1;
    else if (r === 'parcialmente') parciais += 1;
  }
  return (sims * 2 + parciais) / 24;
}

export function classificarTriagem(respostas: RespostasTriagem): ResultadoTriagem {
  const lista = TRIAGEM_ITENS.map((item) => {
    const v = respostas[item.campo];
    return ehResposta(v) ? v : null;
  });

  const preenchidas = lista.filter((r) => r != null).length;
  if (preenchidas < 12) {
    return {
      classificacao: 'pendente',
      indice: null,
      sintese: SINTESSE_PENDENTE,
      proximaAcao: PROXIMA_ACAO.pendente,
    };
  }

  const indiceBruto = indiceAderenciaBruto(respostas);
  const indice = Math.round(indiceBruto * 100) / 100;

  if (lista.some((r) => r === 'nao_sei')) {
    return {
      classificacao: 'informacoes_insuficientes',
      indice,
      sintese: SINTESSE_INSUFICIENTE,
      proximaAcao: PROXIMA_ACAO.informacoes_insuficientes,
    };
  }

  const bloqueioDuro = TRIAGEM_ITENS.some(
    (item, i) => item.bloqueioDuro && lista[i] === 'nao',
  );

  let classificacao: LeiDoBemClassificacao;
  if (bloqueioDuro) {
    classificacao = 'baixo_potencial';
  } else if (indiceBruto >= 0.75) {
    classificacao = 'potencialmente_elegivel';
  } else if (indiceBruto >= 0.5) {
    classificacao = 'potencial_parcial';
  } else {
    classificacao = 'baixo_potencial';
  }

  const algumNao = lista.some((r) => r === 'nao');
  const sintese = !algumNao
    ? SINTESSE_SEM_BLOQUEIO
    : TRIAGEM_ITENS.map((item, i) => (lista[i] === 'nao' ? item.sinteseNao : ''))
      .join('')
      .trim();

  return {
    classificacao,
    indice,
    sintese,
    proximaAcao: PROXIMA_ACAO[classificacao],
  };
}

export function classeBadgeTom(tom: 'ok' | 'warn' | 'crit' | 'g'): string {
  if (tom === 'ok') return 'bg-[var(--sig-ok-bg)] text-[var(--sig-ok)]';
  if (tom === 'warn') return 'bg-[var(--sig-warn-bg)] text-[var(--sig-warn)]';
  if (tom === 'crit') return 'bg-[var(--sig-crit-bg)] text-[var(--sig-crit)]';
  return 'bg-g20 text-g80';
}

export const GRUPO1_CAMPOS = [
  {
    name: 'objetivo_estrategico_okr',
    label: 'Objetivo estratégico / OKR',
    ajuda: 'A que objetivo, necessidade ou oportunidade identificada esta iniciativa se liga.',
    rows: 3,
  },
  {
    name: 'contexto_problema',
    label: 'Contexto e problema',
    ajuda: 'Qual é a situação atual e quem é afetado — o problema que a iniciativa enfrenta.',
    rows: 4,
  },
  {
    name: 'o_que_sera_desenvolvido',
    label: 'O que será desenvolvido ou alterado',
    ajuda: 'Produto, processo, sistema, serviço ou funcionalidade criado ou modificado de forma relevante.',
    rows: 4,
  },
  {
    name: 'resultados_esperados',
    label: 'Quais resultados são esperados',
    ajuda: 'O que se espera obter ao final, em termos técnicos e de negócio.',
    rows: 3,
  },
  {
    name: 'como_sera_desenvolvido',
    label: 'Como será desenvolvido',
    ajuda: 'Abordagem, etapas e meios previstos para chegar ao resultado.',
    rows: 4,
  },
  {
    name: 'fora_do_escopo',
    label: 'O que está fora do escopo',
    ajuda: 'O que esta iniciativa deliberadamente não cobre.',
    rows: 3,
  },
  {
    name: 'desafios_riscos',
    label: 'Principais desafios e riscos',
    ajuda: 'Incertezas, restrições e riscos — de preferência técnicos ou tecnológicos, não só prazo e custo.',
    rows: 3,
  },
] as const;

export const GRUPO2_CAMPOS = [
  {
    name: 'descricao_projeto',
    label: 'Descrição do projeto',
    ajuda: 'Qual problema tecnológico a iniciativa enfrenta e que progresso já foi ou será alcançado.',
    rows: 4,
  },
  {
    name: 'elemento_tecnologico_novo',
    label: 'Elemento tecnologicamente novo ou inovador',
    ajuda: 'O que é novo ou inovador na tecnologia, no método ou na aplicação — não a mera adoção de ferramenta pronta.',
    rows: 4,
  },
  {
    name: 'barreira_desafio_tecnologico',
    label: 'Barreira ou desafio tecnológico superável',
    ajuda: 'Qual incerteza ou desafio tecnológico precisa ser superado. A solução e o caminho não podem ser óbvios no início.',
    rows: 4,
  },
  {
    name: 'metodologia_metodos',
    label: 'Metodologia e métodos utilizados',
    ajuda: 'Como o trabalho será conduzido de forma sistemática: hipóteses, testes, protótipos, experimentos, validações.',
    rows: 4,
  },
  {
    name: 'descritivo_complementar',
    label: 'Descritivo complementar',
    ajuda: 'Parcerias, patentes, trabalhos acadêmicos, outras fontes de financiamento ou contexto extra relevante.',
    rows: 3,
  },
] as const;

export type LeiDoBemAvaliacaoCampos = {
  [K in (typeof GRUPO1_CAMPOS)[number]['name'] | (typeof GRUPO2_CAMPOS)[number]['name']]?: string | null;
} & RespostasTriagem;
