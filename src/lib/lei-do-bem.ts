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

/** Escala da auditoria. */
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

/** Colunas da lista Lei do Bem que aceitam ordenação crescente/decrescente. */
export type LeiDoBemColunaOrdem = 'status' | 'triagem' | 'indice' | 'prioridade';
export type SentidoOrdem = 'asc' | 'desc';

/**
 * Peso do status da auditoria: backlog → avaliação → não enquadrado → enquadrado.
 * O primeiro clique (desc) coloca Enquadrado no topo.
 */
export const LEI_DO_BEM_STATUS_PESO: Record<LeiDoBemStatus, number> = {
  backlog: 0,
  em_avaliacao_interna: 1,
  nao_enquadrado: 2,
  enquadrado: 3,
};

/** Peso da classificação: pendente → insuficiente → baixo → parcial → elegível. */
export const LEI_DO_BEM_TRIAGEM_PESO: Record<LeiDoBemClassificacao, number> = {
  pendente: 0,
  informacoes_insuficientes: 1,
  baixo_potencial: 2,
  potencial_parcial: 3,
  potencialmente_elegivel: 4,
};

export const LEI_DO_BEM_PRIORIDADE_PESO: Record<LeiDoBemPrioridade, number> = {
  baixa: 1,
  media: 2,
  alta: 3,
};

export const LEI_DO_BEM_ORDEM_ROTULO: Record<LeiDoBemColunaOrdem, string> = {
  status: 'Status',
  triagem: 'Triagem',
  indice: 'Índice',
  prioridade: 'Prioridade',
};

export function pesoTriagemLeiDoBem(c: LeiDoBemClassificacao | null): number | null {
  return c == null ? null : LEI_DO_BEM_TRIAGEM_PESO[c];
}

export function pesoPrioridadeLeiDoBem(p: LeiDoBemPrioridade | null): number | null {
  return p == null ? null : LEI_DO_BEM_PRIORIDADE_PESO[p];
}

/** Valores vazios vão para o fim, em qualquer sentido. */
export function cmpNumNulosNoFim(a: number | null, b: number | null, sentido: SentidoOrdem): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return sentido === 'asc' ? a - b : b - a;
}

/**
 * 1º clique: maior primeiro; 2º: o inverso; 3º: tira a ordenação.
 * Mesmo ciclo da tabela de Acompanhamento.
 */
export function cicloOrdemLeiDoBem(
  atual: '' | LeiDoBemColunaOrdem,
  sentido: SentidoOrdem,
  clicada: LeiDoBemColunaOrdem,
): { coluna: '' | LeiDoBemColunaOrdem; sentido: SentidoOrdem } {
  if (atual !== clicada) return { coluna: clicada, sentido: 'desc' };
  if (sentido === 'desc') return { coluna: atual, sentido: 'asc' };
  return { coluna: '', sentido: 'desc' };
}

export type LinhaOrdenavelLeiDoBem = {
  title: string;
  status: LeiDoBemStatus;
  triagem_classificacao: LeiDoBemClassificacao | null;
  triagem_indice_aderencia: number | null;
  prioridade: LeiDoBemPrioridade | null;
  updated_at?: string;
};

export function ordenarLinhasLeiDoBem<T extends LinhaOrdenavelLeiDoBem>(
  linhas: T[],
  coluna: '' | LeiDoBemColunaOrdem,
  sentido: SentidoOrdem,
): T[] {
  if (!coluna) return linhas;
  const lista = [...linhas];
  lista.sort((a, b) => {
    let cmp = 0;
    if (coluna === 'status') {
      cmp = cmpNumNulosNoFim(LEI_DO_BEM_STATUS_PESO[a.status], LEI_DO_BEM_STATUS_PESO[b.status], sentido);
    } else if (coluna === 'triagem') {
      cmp = cmpNumNulosNoFim(
        pesoTriagemLeiDoBem(a.triagem_classificacao),
        pesoTriagemLeiDoBem(b.triagem_classificacao),
        sentido,
      );
    } else if (coluna === 'indice') {
      cmp = cmpNumNulosNoFim(a.triagem_indice_aderencia, b.triagem_indice_aderencia, sentido);
    } else if (coluna === 'prioridade') {
      cmp = cmpNumNulosNoFim(
        pesoPrioridadeLeiDoBem(a.prioridade),
        pesoPrioridadeLeiDoBem(b.prioridade),
        sentido,
      );
    }
    if (cmp !== 0) return cmp;
    if (a.updated_at && b.updated_at) {
      const u = b.updated_at.localeCompare(a.updated_at);
      if (u !== 0) return u;
    }
    return a.title.localeCompare(b.title, 'pt-BR');
  });
  return lista;
}

export function textoOrdemLeiDoBem(coluna: '' | LeiDoBemColunaOrdem, sentido: SentidoOrdem): string | null {
  if (!coluna) return null;
  const maior = {
    status: 'enquadrado primeiro',
    triagem: 'maior potencial primeiro',
    indice: 'maior primeiro',
    prioridade: 'alta primeiro',
  }[coluna];
  const menor = {
    status: 'backlog primeiro',
    triagem: 'menor potencial primeiro',
    indice: 'menor primeiro',
    prioridade: 'baixa primeiro',
  }[coluna];
  return `ordenadas por ${LEI_DO_BEM_ORDEM_ROTULO[coluna]} · ${sentido === 'desc' ? maior : menor}`;
}

export function hrefAbrirCadastroLeiDoBem(projectId: string): string {
  return `/projetos/${projectId}?visualizar=1&origem=lei-do-bem`;
}

export function ehVisualizacaoCadastro(visualizar?: string): boolean {
  return visualizar === '1';
}

export function hrefVoltarCadastro(origem?: string): string {
  return origem === 'lei-do-bem' ? '/lei-do-bem' : '/projetos';
}

export function rotuloBotaoSalvarAuditoria(pending: boolean, salvo: boolean): string {
  if (pending) return 'Salvando…';
  if (salvo) return 'Salvo';
  return 'Salvar auditoria';
}

export const GRUPO1_CAMPOS = [
  {
    name: 'objetivo_estrategico_okr',
    label: 'Objetivo estratégico / OKR',
    ajuda: 'A que objetivo, necessidade ou oportunidade identificada esta iniciativa se liga.',
    rows: 3,
    obrigatorio: false,
  },
  {
    name: 'contexto_problema',
    label: 'Contexto e problema',
    ajuda: 'Qual é a situação atual e quem é afetado — o problema que a iniciativa enfrenta.',
    rows: 4,
    obrigatorio: false,
  },
  {
    name: 'o_que_sera_desenvolvido',
    label: 'O que será desenvolvido ou alterado?',
    ajuda: 'Produto, processo, sistema, serviço ou funcionalidade criado ou modificado de forma relevante.',
    rows: 4,
    obrigatorio: true,
  },
  {
    name: 'resultados_esperados',
    label: 'Quais são os resultados esperados?',
    ajuda: 'O que se espera obter ao final, em termos técnicos e de negócio.',
    rows: 3,
    obrigatorio: true,
  },
  {
    name: 'como_sera_desenvolvido',
    label: 'Como será desenvolvido?',
    ajuda: 'Abordagem, etapas e meios previstos para chegar ao resultado.',
    rows: 4,
    obrigatorio: true,
  },
  {
    name: 'fora_do_escopo',
    label: 'O que está fora do escopo?',
    ajuda: 'O que esta iniciativa deliberadamente não cobre — implantação, parametrização, manutenção e o que mais não entra.',
    rows: 3,
    obrigatorio: true,
  },
  {
    name: 'desafios_riscos',
    label: 'Quais são os principais desafios ou riscos?',
    ajuda: 'Incertezas, restrições e riscos — de preferência técnicos ou tecnológicos, não só prazo e custo.',
    rows: 3,
    obrigatorio: true,
  },
] as const;

/** Os 5 campos de escopo exigidos na validação humana da Lei do Bem. */
export const GRUPO1_CAMPOS_ESCOPO = GRUPO1_CAMPOS.filter((c) => c.obrigatorio);

/** Avaliação técnica MCTI — Guia Prático da Lei do Bem, seção 6 (FormP&D). */
export const GRUPO2_CAMPOS = [
  {
    name: 'descricao_projeto',
    secao: '6.1',
    label: 'Descrição do projeto',
    ajuda:
      'Detalhe técnico da concepção: qual problema tecnológico é resolvido, que progresso científico ou tecnológico já foi ou será alcançado, e se a abordagem exigiu investigação ou usou só o repertório já dominado pela equipe.',
    rows: 4,
  },
  {
    name: 'elemento_tecnologico_novo',
    secao: '6.2',
    label: 'Elemento tecnologicamente novo ou inovador da atividade',
    ajuda:
      'Tecnologia a desenvolver, novas funcionalidades e aplicação. O que existia antes, como era feito e quais eram as limitações. A novidade não pode ser óbvia para quem já conhece as técnicas do setor.',
    rows: 4,
  },
  {
    name: 'barreira_desafio_tecnologico',
    secao: '6.3',
    label: 'Barreira ou desafio tecnológico superável',
    ajuda:
      'Qual problema tecnológico impacta o projeto, com que abordagem será resolvido (estudos, análises, testes, prototipação) e se a barreira já foi superada ou quais hipóteses ainda estão em teste.',
    rows: 4,
  },
  {
    name: 'metodologia_metodos',
    secao: '6.4',
    label: 'Metodologia e métodos utilizados',
    ajuda:
      'Métodos de pesquisa ou desenvolvimento experimental usados para superar a barreira — não uma metodologia genérica de gestão (scrum, kanban) sem o recorte científico.',
    rows: 4,
  },
  {
    name: 'descritivo_complementar',
    secao: '6.5',
    label: 'Descritivo complementar',
    ajuda:
      'Contexto extra, parcerias, patentes, trabalhos acadêmicos, outras fontes de financiamento, equipes dedicadas, número de protótipos e ensaios, ganhos de qualidade ou produtividade.',
    rows: 3,
  },
] as const;

export type LeiDoBemAvaliacaoCampos = {
  [K in (typeof GRUPO1_CAMPOS)[number]['name'] | (typeof GRUPO2_CAMPOS)[number]['name']]?: string | null;
} & RespostasTriagem;

export function campoPreenchido(v: string | null | undefined): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Rótulos dos 5 campos de escopo ainda vazios — bloqueiam o cadastro na Lei do Bem. */
export function faltamCamposCadastroLeiDoBem(
  valores: Partial<Record<string, string | null | undefined>>,
): string[] {
  return GRUPO1_CAMPOS_ESCOPO
    .filter((c) => !campoPreenchido(valores[c.name]))
    .map((c) => c.label);
}

export const MSG_CAMPOS_CADASTRO_LEI_DO_BEM =
  'Para a validação humana da Lei do Bem, preencha o que será desenvolvido, os resultados esperados, como será desenvolvido, o que está fora do escopo e os principais desafios ou riscos.';

export type AvaliacaoCriterio = 'atende' | 'parcial' | 'nao_atende' | 'insuficiente';

export const AVALIACAO_CRITERIO_LABEL: Record<AvaliacaoCriterio, string> = {
  atende: 'Atende',
  parcial: 'Parcial',
  nao_atende: 'Não atende',
  insuficiente: 'Informações insuficientes',
};

export const AVALIACAO_CRITERIO_TOM: Record<AvaliacaoCriterio, 'ok' | 'warn' | 'crit' | 'g'> = {
  atende: 'ok',
  parcial: 'warn',
  nao_atende: 'crit',
  insuficiente: 'g',
};

/**
 * Cinco critérios de Frascati (Guia Prático MCTI §6), amarrados às perguntas
 * da triagem e ao bloco correspondente do FormP&D. Substitui o modelo genérico
 * de pré-análise (agente de IA do ClickUp) pela estrutura que o MCTI avalia.
 */
export const FRASCATI_CRITERIOS = [
  {
    id: 'inovador',
    label: 'Inovador',
    secao: '6.2',
    descricao: 'Há elemento de novidade não óbvio e progresso científico ou tecnológico.',
    itens: [3, 4, 11],
    campoMcti: 'elemento_tecnologico_novo',
  },
  {
    id: 'criativo',
    label: 'Criativo',
    secao: '6.4',
    descricao: 'O caminho envolve hipóteses, testes, protótipos ou experimentos — não só o repertório já dominado.',
    itens: [6],
    campoMcti: 'metodologia_metodos',
  },
  {
    id: 'incerto',
    label: 'Incerto',
    secao: '6.3',
    descricao: 'Existe incerteza técnica: a solução e o caminho não são totalmente conhecidos no início.',
    itens: [5, 10],
    campoMcti: 'barreira_desafio_tecnologico',
  },
  {
    id: 'sistematico',
    label: 'Sistemático',
    secao: '6.4',
    descricao: 'O trabalho é planejado, acompanhado e documentado por etapas, com registros de atividades e testes.',
    itens: [7, 12],
    campoMcti: 'metodologia_metodos',
  },
  {
    id: 'transferivel',
    label: 'Transferível / reproduzível',
    secao: '6.1',
    descricao: 'O conhecimento ou resultado gerado pode ser reproduzido, transferido ou reaproveitado.',
    itens: [8],
    campoMcti: 'descricao_projeto',
  },
] as const;

export type FrascatiId = (typeof FRASCATI_CRITERIOS)[number]['id'];

function respostaDoItem(respostas: RespostasTriagem, n: number): LeiDoBemResposta | null {
  const campo = `triagem_${String(n).padStart(2, '0')}` as TriagemCampo;
  const v = respostas[campo];
  return ehResposta(v) ? v : null;
}

export function avaliarItensTriagem(respostas: RespostasTriagem, itens: readonly number[]): AvaliacaoCriterio {
  const vals = itens.map((n) => respostaDoItem(respostas, n));
  if (vals.some((v) => v == null || v === 'nao_sei')) return 'insuficiente';
  if (vals.every((v) => v === 'sim')) return 'atende';
  if (vals.some((v) => v === 'nao')) return 'nao_atende';
  return 'parcial';
}

export type BlocoPreAnaliseMcti = {
  secao: string;
  name: (typeof GRUPO2_CAMPOS)[number]['name'];
  label: string;
  preenchido: boolean;
};

export type CriterioPreAnaliseMcti = {
  id: FrascatiId;
  label: string;
  secao: string;
  descricao: string;
  avaliacao: AvaliacaoCriterio;
  blocoPreenchido: boolean;
};

export type PreAnaliseTecnicaMcti = {
  blocos: BlocoPreAnaliseMcti[];
  frascati: CriterioPreAnaliseMcti[];
  lacunas: string[];
  sintese: string;
};

/**
 * Pré-análise técnica no recorte MCTI/Lei do Bem (Guia Prático §6 + Frascati).
 * Lê os blocos do FormP&D e as 12 escolhas da triagem; não substitui o parecer
 * humano nem a validação fiscal/documental.
 */
export function preAnaliseTecnicaMcti(valores: LeiDoBemAvaliacaoCampos): PreAnaliseTecnicaMcti {
  const blocos: BlocoPreAnaliseMcti[] = GRUPO2_CAMPOS.map((c) => ({
    secao: c.secao,
    name: c.name,
    label: c.label,
    preenchido: campoPreenchido(valores[c.name]),
  }));

  const frascati: CriterioPreAnaliseMcti[] = FRASCATI_CRITERIOS.map((c) => ({
    id: c.id,
    label: c.label,
    secao: c.secao,
    descricao: c.descricao,
    avaliacao: avaliarItensTriagem(valores, c.itens),
    blocoPreenchido: campoPreenchido(valores[c.campoMcti]),
  }));

  const lacunas: string[] = [];
  for (const b of blocos) {
    if (!b.preenchido) lacunas.push(`§${b.secao} ${b.label}`);
  }
  for (const c of frascati) {
    if (c.avaliacao === 'insuficiente') lacunas.push(`Frascati · ${c.label}: triagem incompleta`);
    else if (c.avaliacao === 'nao_atende') lacunas.push(`Frascati · ${c.label}: não evidenciado`);
  }

  const atende = frascati.filter((c) => c.avaliacao === 'atende').length;
  const blocosOk = blocos.filter((b) => b.preenchido).length;
  let sintese: string;
  if (frascati.every((c) => c.avaliacao === 'insuficiente') && blocosOk === 0) {
    sintese =
      'Pré-análise MCTI pendente: preencha a triagem e os cinco blocos do Guia Prático (§6.1–6.5) para estruturar a avaliação técnica.';
  } else if (frascati.some((c) => c.avaliacao === 'nao_atende')) {
    const nomes = frascati.filter((c) => c.avaliacao === 'nao_atende').map((c) => c.label.toLowerCase());
    sintese =
      `Pré-análise MCTI: ${atende}/5 critérios de Frascati atendidos; ${blocosOk}/5 blocos do FormP&D preenchidos. `
      + `Não evidenciado: ${nomes.join(', ')}. A auditoria deve revisar o escopo antes de reportar ao MCTI.`;
  } else if (frascati.every((c) => c.avaliacao === 'atende') && blocosOk === 5) {
    sintese =
      'Pré-análise MCTI: os cinco critérios de Frascati e os cinco blocos do Guia Prático (§6) estão preenchidos. Segue para validação humana, fiscal e documental.';
  } else {
    sintese =
      `Pré-análise MCTI: ${atende}/5 critérios de Frascati atendidos; ${blocosOk}/5 blocos do FormP&D preenchidos. `
      + 'Complemente os blocos técnicos e a triagem para fechar a avaliação.';
  }

  return { blocos, frascati, lacunas, sintese };
}
