/**
 * Pré-triagem do portfólio já cadastrado.
 *
 * Não há as 12 respostas humanas: o cadastro legado traz título, descrição,
 * tema, ferramentas e flags uses_ai / uses_n8n. Esta régua lê esses campos
 * e devolve um perfil Frascati/Oslo — a classificação B27–B30 continua
 * vindo de `classificarTriagem`. A mesma lógica vive na migration
 * `0012_lei_do_bem_pre_triagem.sql`. Mudou aqui, muda lá.
 *
 * Experimental → potencialmente elegível → status enquadrado (auditoria
 * ainda revisa). Nunca inventa "Não sei": ou há evidência, ou o item
 * vai Não / Parcialmente.
 */

import {
  classificarTriagem,
  type LeiDoBemPrioridade,
  type LeiDoBemStatus,
  type RespostasTriagem,
} from './lei-do-bem';

export type PerfilPreTriagem = 'experimental' | 'parcial' | 'pronto' | 'incerto';

export type ProjetoPreTriagem = {
  title: string;
  description?: string | null;
  notes?: string | null;
  theme?: string | null;
  tools?: string | null;
  uses_ai?: boolean | null;
  uses_n8n?: boolean | null;
};

const EXPERIMENTAL = [
  'classificador', 'classificacao', 'modelo preditiv', 'modelo de ',
  'machine learning', 'aprendizado de maquina', 'visao computacional',
  'processamento de linguagem', 'nlp', 'llm', 'fine-tun', 'fine tun',
  'treinar modelo', 'treinamento do modelo', 'algoritmo', 'embedding',
  'rede neural', 'rag', 'ocr', 'extrator', 'extracao inteligente',
  'score de credito', 'motor de', 'reconhecimento de',
];

const PRONTO = [
  'copilot', 'chatgpt', 'implant', 'configur', 'parametr',
  'power bi', 'looker', 'planilha', 'excel', 'dashboard',
  'relatorio', 'treinamento de', 'workshop', 'migracao',
  'licenca', 'suporte', 'manutencao', 'correcao rotin',
];

const AUTOMACAO = [
  'n8n', 'rpa', 'automacao', 'automatizar', 'chatbot', 'assistente',
  'whatsapp', 'workflow', 'fluxo de', 'robo ', 'robos',
];

export function normalizarPreTriagem(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

function contem(txt: string, palavras: string[]): boolean {
  return palavras.some((p) => txt.includes(p));
}

export function perfilPreTriagem(p: ProjetoPreTriagem): PerfilPreTriagem {
  const txt = normalizarPreTriagem(
    [p.title, p.description, p.notes, p.theme, p.tools].filter(Boolean).join(' '),
  );
  const experimental = contem(txt, EXPERIMENTAL);
  const pronto = contem(txt, PRONTO);
  const automacao = contem(txt, AUTOMACAO) || !!p.uses_n8n;

  if (experimental) return 'experimental';
  if (pronto && !experimental) return 'pronto';
  if (automacao || p.uses_ai) return 'parcial';
  return 'incerto';
}

/** 12 respostas por perfil. Hard blocks (3,4,5,6,9,10,11) nunca são Não no perfil experimental/parcial. */
export const RESPOSTAS_POR_PERFIL: Record<PerfilPreTriagem, RespostasTriagem> = {
  experimental: {
    triagem_01: 'sim',
    triagem_02: 'sim',
    triagem_03: 'sim',
    triagem_04: 'sim',
    triagem_05: 'sim',
    triagem_06: 'sim',
    triagem_07: 'parcialmente',
    triagem_08: 'sim',
    triagem_09: 'sim',
    triagem_10: 'sim',
    triagem_11: 'sim',
    triagem_12: 'parcialmente',
  },
  parcial: {
    triagem_01: 'sim',
    triagem_02: 'parcialmente',
    triagem_03: 'sim',
    triagem_04: 'parcialmente',
    triagem_05: 'parcialmente',
    triagem_06: 'parcialmente',
    triagem_07: 'parcialmente',
    triagem_08: 'sim',
    triagem_09: 'parcialmente',
    triagem_10: 'parcialmente',
    triagem_11: 'parcialmente',
    triagem_12: 'parcialmente',
  },
  pronto: {
    triagem_01: 'parcialmente',
    triagem_02: 'parcialmente',
    triagem_03: 'nao',
    triagem_04: 'nao',
    triagem_05: 'nao',
    triagem_06: 'nao',
    triagem_07: 'parcialmente',
    triagem_08: 'parcialmente',
    triagem_09: 'nao',
    triagem_10: 'nao',
    triagem_11: 'nao',
    triagem_12: 'parcialmente',
  },
  incerto: {
    triagem_01: 'parcialmente',
    triagem_02: 'nao',
    triagem_03: 'parcialmente',
    triagem_04: 'nao',
    triagem_05: 'nao',
    triagem_06: 'nao',
    triagem_07: 'parcialmente',
    triagem_08: 'parcialmente',
    triagem_09: 'nao',
    triagem_10: 'nao',
    triagem_11: 'nao',
    triagem_12: 'parcialmente',
  },
};

export function respostasPreTriagem(
  p: ProjetoPreTriagem,
): { perfil: PerfilPreTriagem; respostas: RespostasTriagem } {
  const perfil = perfilPreTriagem(p);
  const respostas = { ...RESPOSTAS_POR_PERFIL[perfil] };
  if ((perfil === 'experimental' || perfil === 'parcial') && !p.description?.trim()) {
    respostas.triagem_02 = 'parcialmente';
  }
  return { perfil, respostas };
}

export function auditoriaDoPerfil(perfil: PerfilPreTriagem): {
  status: LeiDoBemStatus;
  prioridade: LeiDoBemPrioridade;
} {
  if (perfil === 'experimental') return { status: 'enquadrado', prioridade: 'alta' };
  if (perfil === 'parcial') return { status: 'em_avaliacao_interna', prioridade: 'media' };
  if (perfil === 'pronto') return { status: 'nao_enquadrado', prioridade: 'baixa' };
  return { status: 'backlog', prioridade: 'baixa' };
}

export const PARECER_PRE_TRIAGEM =
  'Pré-triagem automática a partir do cadastro no Pulso (título, descrição, tema, IA/n8n). '
  + 'Não substitui validação técnica, fiscal, contábil e documental. A auditoria deve revisar as 12 escolhas.';

export function preTriar(p: ProjetoPreTriagem) {
  const { perfil, respostas } = respostasPreTriagem(p);
  const triagem = classificarTriagem(respostas);
  const auditoria = auditoriaDoPerfil(perfil);
  return { perfil, respostas, triagem, ...auditoria };
}
