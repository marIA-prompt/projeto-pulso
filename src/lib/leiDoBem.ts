/**
 * Lei do Bem (Lei 11.196/2005) — domínio da pré-análise de enquadramento.
 *
 * A lógica de classificação replica 1:1 as fórmulas da planilha
 * `Triagem_Preliminar_Lei_do_Bem_Simples.xlsx` (células B27–B30), que é a
 * fonte de verdade validada pelo time de PD&I. O mesmo cálculo existe como
 * trigger no Postgres (supabase/migrations/0010_lei_do_bem.sql) — o banco é
 * quem persiste; esta cópia serve para o preview em tempo real no wizard.
 * As duas precisam concordar: mudou aqui, muda na migration.
 *
 * Textos de apoio parafraseados do Guia Prático da Lei do Bem 2020 (MCTI),
 * do Manual de Frascati (OCDE) e do Manual de Oslo.
 */

export type LdbResposta = 'sim' | 'parcialmente' | 'nao' | 'nao_sei';

export const LDB_RESPOSTAS: LdbResposta[] = ['sim', 'parcialmente', 'nao', 'nao_sei'];

export const LDB_RESPOSTA_LABEL: Record<LdbResposta, string> = {
  sim: 'Sim',
  parcialmente: 'Parcialmente',
  nao: 'Não',
  nao_sei: 'Não sei',
};

export type LdbStatus = 'backlog' | 'em_avaliacao_interna' | 'enquadrado' | 'nao_enquadrado';

export const LDB_STATUSES: LdbStatus[] = [
  'backlog', 'em_avaliacao_interna', 'enquadrado', 'nao_enquadrado',
];

export const LDB_STATUS_LABEL: Record<LdbStatus, string> = {
  backlog: 'Backlog',
  em_avaliacao_interna: 'Em avaliação interna',
  enquadrado: 'Enquadrado',
  nao_enquadrado: 'Não enquadrado',
};

/** Tom semântico da raia/badge de status — paleta do semáforo já existente. */
export const LDB_STATUS_TONE: Record<LdbStatus, 'neutro' | 'warn' | 'ok' | 'crit'> = {
  backlog: 'neutro',
  em_avaliacao_interna: 'warn',
  enquadrado: 'ok',
  nao_enquadrado: 'crit',
};

export type LdbClassificacao =
  | 'pendente'
  | 'informacoes_insuficientes'
  | 'baixo_potencial'
  | 'potencial_parcial'
  | 'potencialmente_elegivel';

export const LDB_CLASSIFICACOES: LdbClassificacao[] = [
  'potencialmente_elegivel', 'potencial_parcial', 'baixo_potencial',
  'informacoes_insuficientes', 'pendente',
];

export const LDB_CLASSIFICACAO_LABEL: Record<LdbClassificacao, string> = {
  pendente: 'Pendente',
  informacoes_insuficientes: 'Informações insuficientes',
  baixo_potencial: 'Baixo potencial',
  potencial_parcial: 'Potencial parcial',
  potencialmente_elegivel: 'Potencialmente elegível',
};

/** Cores semânticas do design system para o badge de classificação (§6.2). */
export const LDB_CLASSIFICACAO_TONE: Record<LdbClassificacao, 'ok' | 'warn' | 'crit' | 'neutro'> = {
  potencialmente_elegivel: 'ok',
  potencial_parcial: 'warn',
  baixo_potencial: 'crit',
  pendente: 'neutro',
  informacoes_insuficientes: 'neutro',
};

export type LdbPrioridade = 'baixa' | 'media' | 'alta';
export const LDB_PRIORIDADES: LdbPrioridade[] = ['baixa', 'media', 'alta'];
export const LDB_PRIORIDADE_LABEL: Record<LdbPrioridade, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta',
};

// ============================================================================
// Grupo 1 — Cadastro do Projeto (itens 4–10 do documento de referência;
// nome, responsável e data já existem na iniciativa e não são duplicados)
// ============================================================================

export const LDB_GRUPO1 = [
  {
    campo: 'objetivo_estrategico_okr',
    label: 'Objetivo estratégico / OKR',
    rows: 2,
    ajuda: 'A qual objetivo estratégico, necessidade ou oportunidade da Senff este projeto se conecta.',
  },
  {
    campo: 'contexto_problema',
    label: 'Contexto e problema',
    rows: 4,
    ajuda: 'Situação atual, o problema que motiva o projeto e quem é afetado por ele.',
  },
  {
    campo: 'o_que_sera_desenvolvido',
    label: 'O que será desenvolvido ou alterado',
    rows: 4,
    ajuda: 'Produto, processo, sistema, serviço ou funcionalidade que será criado ou modificado de forma relevante.',
  },
  {
    campo: 'resultados_esperados',
    label: 'Quais resultados são esperados',
    rows: 4,
    ajuda: 'Resultados técnicos e de negócio esperados ao final do desenvolvimento.',
  },
  {
    campo: 'como_sera_desenvolvido',
    label: 'Como será desenvolvido',
    rows: 4,
    ajuda: 'Abordagem geral: etapas, times envolvidos, tecnologias e forma de trabalho.',
  },
  {
    campo: 'fora_do_escopo',
    label: 'O que está fora do escopo',
    rows: 3,
    ajuda: 'O que este projeto deliberadamente não cobre — ajuda a separar o desenvolvimento experimental da rotina.',
  },
  {
    campo: 'desafios_riscos',
    label: 'Principais desafios e riscos',
    rows: 3,
    ajuda: 'Desafios técnicos e riscos relevantes. Para a Lei do Bem, interessam os de natureza técnica/tecnológica.',
  },
] as const;

// ============================================================================
// Grupo 2 — Avaliação técnica (Guia Prático da Lei do Bem, seção 6).
// Cada campo corresponde a 1 dos 5 critérios de PD&I do Manual de Frascati:
// inovador · criativo · incerto · sistemático · transferível/reprodutível.
// ============================================================================

export const LDB_GRUPO2 = [
  {
    campo: 'descricao_projeto',
    label: 'Descrição do projeto',
    criterio: 'Sistemático',
    rows: 5,
    ajuda: 'O problema tecnológico que o projeto se propõe a resolver e o progresso já alcançado. É o bloco 6.1 do FormP&D: situa o avanço buscado frente ao estado da técnica.',
  },
  {
    campo: 'elemento_tecnologico_novo',
    label: 'Elemento tecnologicamente novo ou inovador da atividade',
    criterio: 'Inovador',
    rows: 5,
    ajuda: 'O que é novo na tecnologia usada ou desenvolvida — para a empresa ou para o mercado. Novidade apenas comercial ou organizacional não caracteriza PD&I.',
  },
  {
    campo: 'barreira_desafio_tecnologico',
    label: 'Barreira ou desafio tecnológico superável',
    criterio: 'Incerto',
    rows: 5,
    ajuda: 'A incerteza científica/tecnológica enfrentada: o que não se sabia fazer no início e por que a solução não era óbvia para um profissional da área.',
  },
  {
    campo: 'metodologia_metodos',
    label: 'Metodologia e métodos utilizados',
    criterio: 'Criativo e sistemático',
    rows: 5,
    ajuda: 'Como o trabalho é conduzido: hipóteses, experimentos, protótipos, testes e critérios de validação, de forma planejada e documentada.',
  },
  {
    campo: 'descritivo_complementar',
    label: 'Descritivo complementar',
    criterio: 'Transferível / reprodutível',
    rows: 4,
    ajuda: 'Contexto adicional: parcerias com universidades/ICTs, patentes, trabalhos acadêmicos, outras fontes de financiamento e como o conhecimento gerado pode ser reaproveitado.',
  },
] as const;

export type LdbCampoTexto =
  | (typeof LDB_GRUPO1)[number]['campo']
  | (typeof LDB_GRUPO2)[number]['campo'];

export const LDB_CAMPOS_TEXTO: LdbCampoTexto[] = [
  ...LDB_GRUPO1.map((c) => c.campo),
  ...LDB_GRUPO2.map((c) => c.campo),
];

// ============================================================================
// Grupo 3 — Questionário de triagem preliminar.
// Texto EXATO da planilha Triagem_Preliminar_Lei_do_Bem_Simples.xlsx — é o
// instrumento validado que a auditoria já usa; não parafrasear.
// ============================================================================

export type LdbTriagemCampo =
  | 'triagem_01' | 'triagem_02' | 'triagem_03' | 'triagem_04'
  | 'triagem_05' | 'triagem_06' | 'triagem_07' | 'triagem_08'
  | 'triagem_09' | 'triagem_10' | 'triagem_11' | 'triagem_12';

export const LDB_TRIAGEM: {
  campo: LdbTriagemCampo;
  pergunta: string;
  bloqueioDuro: boolean;
  /** Frase da síntese quando a resposta é "Não" (célula B29 da planilha). */
  fraseNao: string;
}[] = [
  {
    campo: 'triagem_01',
    pergunta: 'O projeto está ligado a um objetivo estratégico, necessidade ou oportunidade claramente identificada?',
    bloqueioDuro: false,
    fraseNao: 'Objetivo estratégico não evidenciado.',
  },
  {
    campo: 'triagem_02',
    pergunta: 'O problema atual e quem é afetado estão claramente definidos?',
    bloqueioDuro: false,
    fraseNao: 'Problema e público afetado não definidos.',
  },
  {
    campo: 'triagem_03',
    pergunta: 'Será desenvolvido ou alterado um produto, processo, sistema, serviço ou funcionalidade de forma relevante?',
    bloqueioDuro: true,
    fraseNao: 'Não há desenvolvimento ou alteração relevante de produto, processo, sistema ou serviço.',
  },
  {
    campo: 'triagem_04',
    pergunta: 'O resultado esperado traz novidade ou ganho técnico/tecnológico relevante para a empresa?',
    bloqueioDuro: true,
    fraseNao: 'Novidade ou ganho técnico/tecnológico não evidenciado.',
  },
  {
    campo: 'triagem_05',
    pergunta: 'Existe incerteza técnica, ou seja, a solução e o caminho para alcançá-la não são totalmente conhecidos no início?',
    bloqueioDuro: true,
    fraseNao: 'Incerteza técnica não demonstrada.',
  },
  {
    campo: 'triagem_06',
    pergunta: 'O desenvolvimento exigirá hipóteses, testes, protótipos, experimentos ou validações técnicas?',
    bloqueioDuro: true,
    fraseNao: 'Ausência de hipóteses, testes, protótipos ou validações técnicas.',
  },
  {
    campo: 'triagem_07',
    pergunta: 'O trabalho será planejado, acompanhado e documentado por etapas?',
    bloqueioDuro: false,
    fraseNao: 'Trabalho sem planejamento e documentação por etapas.',
  },
  {
    campo: 'triagem_08',
    pergunta: 'O conhecimento ou resultado gerado poderá ser reproduzido, transferido ou reaproveitado?',
    bloqueioDuro: false,
    fraseNao: 'Conhecimento gerado não reproduzível ou transferível.',
  },
  {
    campo: 'triagem_09',
    pergunta: 'É possível separar o desenvolvimento experimental de implantação, parametrização, manutenção, suporte e correções rotineiras?',
    bloqueioDuro: true,
    fraseNao: 'Desenvolvimento experimental não separável das atividades rotineiras.',
  },
  {
    campo: 'triagem_10',
    pergunta: 'Os principais desafios ou riscos são técnicos/tecnológicos, e não apenas de prazo, custo ou gestão?',
    bloqueioDuro: true,
    fraseNao: 'Desafios apontados não são técnicos/tecnológicos.',
  },
  {
    campo: 'triagem_11',
    pergunta: 'O projeto vai além da simples compra, configuração ou integração de uma solução pronta?',
    bloqueioDuro: true,
    fraseNao: 'O projeto aparenta limitar-se a solução pronta.',
  },
  {
    campo: 'triagem_12',
    pergunta: 'Haverá registros de atividades, horas, testes, decisões e gastos vinculados ao projeto?',
    bloqueioDuro: false,
    fraseNao: 'Sem registros de atividades, horas, testes, decisões e gastos.',
  },
];

export const LDB_TRIAGEM_CAMPOS: LdbTriagemCampo[] = LDB_TRIAGEM.map((t) => t.campo);

// ============================================================================
// Classificação automática (espelho do trigger lei_do_bem_classificar)
// ============================================================================

export type TriagemResultado = {
  classificacao: LdbClassificacao;
  /** 0..1 com 2 casas, ou null enquanto nem todas as 12 foram respondidas. */
  indice: number | null;
  sintese: string;
  proximaAcao: string;
};

const PROXIMA_ACAO: Record<LdbClassificacao, string> = {
  pendente: 'Responder os itens restantes.',
  informacoes_insuficientes: 'Esclarecer os itens marcados como Não sei.',
  potencialmente_elegivel: 'Encaminhar para análise técnica detalhada e validação fiscal/documental.',
  potencial_parcial: 'Revisar o escopo, separar atividades rotineiras e complementar evidências.',
  baixo_potencial: 'Reavaliar ou reformular o projeto, salvo se houver novas informações técnicas.',
};

const SINTESE_SEM_BLOQUEIOS =
  'As respostas não indicam bloqueios críticos. A elegibilidade final ainda depende de validação técnica, fiscal, contábil e documental.';

/**
 * Ordem de avaliação (a primeira condição que bater decide):
 *  1. < 12 respostas → pendente (índice nulo)
 *  2. alguma "não sei" → informações insuficientes
 *  3. bloqueio duro (itens 3,4,5,6,9,10,11) respondido "não" → baixo potencial
 *  4. índice = (sim×2 + parcialmente) / 24:
 *     ≥ 0,75 elegível · ≥ 0,5 parcial · < 0,5 baixo potencial
 */
export function classificarTriagem(
  respostas: Partial<Record<LdbTriagemCampo, LdbResposta | null>>,
): TriagemResultado {
  const valores = LDB_TRIAGEM.map((t) => respostas[t.campo] ?? null);
  const respondidas = valores.filter((v) => v != null).length;

  const indice = respondidas < 12
    ? null
    : Math.round(
        ((valores.filter((v) => v === 'sim').length * 2 +
          valores.filter((v) => v === 'parcialmente').length) / 24) * 100,
      ) / 100;

  let classificacao: LdbClassificacao;
  if (respondidas < 12) {
    classificacao = 'pendente';
  } else if (valores.some((v) => v === 'nao_sei')) {
    classificacao = 'informacoes_insuficientes';
  } else if (
    LDB_TRIAGEM.some((t, i) => t.bloqueioDuro && valores[i] === 'nao') ||
    (indice as number) < 0.5
  ) {
    classificacao = 'baixo_potencial';
  } else if ((indice as number) >= 0.75) {
    classificacao = 'potencialmente_elegivel';
  } else {
    classificacao = 'potencial_parcial';
  }

  let sintese: string;
  if (classificacao === 'pendente') {
    sintese = 'Preencha todas as respostas para gerar a síntese.';
  } else if (classificacao === 'informacoes_insuficientes') {
    sintese = 'Há respostas marcadas como Não sei. Esclareça esses itens antes de concluir a triagem.';
  } else if (!valores.some((v) => v === 'nao')) {
    sintese = SINTESE_SEM_BLOQUEIOS;
  } else {
    sintese = LDB_TRIAGEM
      .filter((t, i) => valores[i] === 'nao')
      .map((t) => t.fraseNao)
      .join(' ');
  }

  return { classificacao, indice, sintese, proximaAcao: PROXIMA_ACAO[classificacao] };
}

// ============================================================================
// Tipos de linha (view v_lei_do_bem)
// ============================================================================

export type LdbAvaliacaoRow = {
  id: string;
  project_id: string;
  title: string;
  stage: string;
  area_name: string | null;
  directorate: string | null;
  owner_id: string | null;
  owner_name: string | null;
  project_created_at: string;

  objetivo_estrategico_okr: string | null;
  contexto_problema: string | null;
  o_que_sera_desenvolvido: string | null;
  resultados_esperados: string | null;
  como_sera_desenvolvido: string | null;
  fora_do_escopo: string | null;
  desafios_riscos: string | null;

  descricao_projeto: string | null;
  elemento_tecnologico_novo: string | null;
  barreira_desafio_tecnologico: string | null;
  metodologia_metodos: string | null;
  descritivo_complementar: string | null;

  triagem_01: LdbResposta | null;
  triagem_02: LdbResposta | null;
  triagem_03: LdbResposta | null;
  triagem_04: LdbResposta | null;
  triagem_05: LdbResposta | null;
  triagem_06: LdbResposta | null;
  triagem_07: LdbResposta | null;
  triagem_08: LdbResposta | null;
  triagem_09: LdbResposta | null;
  triagem_10: LdbResposta | null;
  triagem_11: LdbResposta | null;
  triagem_12: LdbResposta | null;
  triagem_classificacao: LdbClassificacao | null;
  triagem_indice_aderencia: number | null;
  triagem_sintese: string | null;
  triagem_proxima_acao: string | null;
  triagem_atualizada_em: string | null;

  status: LdbStatus;
  responsavel_auditoria_id: string | null;
  responsavel_auditoria_nome: string | null;
  parecer: string | null;
  prioridade: LdbPrioridade | null;
  enviar_clickup: boolean;
  clickup_sincronizado_em: string | null;
  created_at: string;
  updated_at: string;
};

export type LdbHistoricoRow = {
  id: string;
  avaliacao_id: string;
  status_anterior: LdbStatus | null;
  status_novo: LdbStatus;
  alterado_por: string | null;
  alterado_por_nome?: string | null;
  criado_em: string;
};
