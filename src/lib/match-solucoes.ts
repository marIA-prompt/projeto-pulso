/**
 * Pulsenff — match de soluções.
 *
 * Varre a base de iniciativas já cadastradas e devolve as parecidas com o
 * problema descrito. A comparação é por termos (título, tema, objetivo,
 * descrição, área, diretoria, ferramentas e notas), com grupos pequenos de
 * sinônimos. Não chama modelo externo: o portfólio cabe na memória e o
 * resultado é o mesmo para a mesma base.
 */

export const PULSENFF = 'Pulsenff';

export const TEXTO_SEM_MATCH =
  'Não há iniciativa parecida na base. Cadastre a solução e apresente na próxima reunião do Pulso.';

export const TEXTO_DUVIDAS = 'Mais dúvidas, consulte somente a Gerência de IA.';

export const TEXTO_CONSULTA_CURTA =
  'Descreva o problema com mais contexto: o que acontece hoje, em qual área e o que precisa mudar.';

export const MIN_CHARS_PROBLEMA = 12;
export const MAX_CHARS_PROBLEMA = 4000;
export const MAX_MATCHES = 5;

const PESO_TITULO = 5;

const STOP = new Set([
  'a', 'o', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das',
  'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'com', 'sem', 'que', 'e', 'ou', 'se',
  'ao', 'aos', 'pelo', 'pela', 'pelos', 'pelas', 'entre', 'sobre', 'ate', 'apos',
  'antes', 'quando', 'onde', 'qual', 'quais', 'quem', 'porque', 'porquê',
  'seu', 'sua', 'seus', 'suas', 'meu', 'minha', 'meus', 'minhas', 'nosso', 'nossa',
  'este', 'esta', 'esse', 'essa', 'isso', 'isto', 'aquele', 'aquela',
  'como', 'mais', 'muito', 'muita', 'muitos', 'muitas', 'ja', 'tambem', 'nao', 'sim',
  'ha', 'tem', 'ter', 'ser', 'estar', 'esta', 'estao', 'foi', 'sao', 'era', 'eram',
  'pelo', 'num', 'numa', 'dum', 'duma', 'lhe', 'eles', 'elas', 'voce', 'voces',
  'pra', 'pro', 'pros', 'pras', 'que', 'dos', 'das', 'the', 'and', 'para',
  'preciso', 'precisa', 'precisamos', 'quero', 'queremos', 'gostaria', 'ajuda',
  'ajudar', 'fazer', 'feito', 'sendo', 'sido', 'pode', 'podem', 'poder',
  'problema', 'problemas', 'solucao', 'solucoes', 'iniciativa', 'iniciativas',
  'empresa', 'senff', 'pulso', 'pulsenff', 'hoje', 'ainda', 'apenas', 'somente',
  'todo', 'toda', 'todos', 'todas', 'cada', 'outro', 'outra', 'outros', 'outras',
  'algum', 'alguma', 'alguns', 'algumas', 'nenhum', 'nenhuma', 'dentro', 'fora',
  'aqui', 'ali', 'la', 'ja', 'bem', 'mal', 'vai', 'vao', 'ir', 'ser', 'ter',
]);

/** Termos genéricos demais para sustentar um match sozinhos. */
const FRACO = new Set([
  'processo', 'sistema', 'rotina', 'manual', 'trabalho', 'atividade', 'melhoria', 'controle',
  'projeto', 'gestao', 'informacao', 'dado', 'pessoa', 'pessoas', 'colaborador',
  'setor', 'area', 'time', 'equipe', 'atual', 'novo', 'nova', 'novos', 'novas',
  'abrir', 'criar', 'interno', 'interna', 'internos', 'internas', 'geral',
  'operacao', 'operacional', 'fluxo', 'tarefa', 'tarefas', 'usuario', 'usuarios',
]);

const GRUPOS: string[][] = [
  ['fatura', 'nfe', 'nfse', 'boleto'],
  ['cobranca', 'inadimplencia', 'inadimplente'],
  ['automatizar', 'automacao', 'automatico', 'automatica', 'rpa'],
  ['atendimento', 'chamado', 'ticket', 'suporte'],
  ['whatsapp', 'wpp'],
  ['relatorio', 'dashboard', 'painel'],
  ['contrato', 'aditivo'],
  ['estoque', 'inventario'],
  ['folha', 'holerite'],
  ['recrutamento', 'curriculo', 'vaga'],
  ['cliente', 'consumidor'],
  ['fornecedor', 'parceiro'],
];

const GRUPO_POR = new Map<string, string>();
for (const [i, grupo] of GRUPOS.entries()) {
  const id = String(i);
  for (const palavra of grupo) {
    for (const chave of chavesDe(palavra)) GRUPO_POR.set(chave, id);
  }
}

export type IniciativaParaMatch = {
  id: string;
  title: string;
  stage: string;
  theme: string | null;
  area_name: string | null;
  directorate: string | null;
  description: string | null;
  objetivo_contexto: string | null;
  tools: string | null;
  notes: string | null;
  owner_name: string | null;
};

export type ItemMatch = {
  id: string;
  title: string;
  stage: string;
  theme: string | null;
  area_name: string | null;
  directorate: string | null;
  owner_name: string | null;
  resumo: string;
  termos: string[];
  afinidade: number;
};

export type ResultadoVarredura =
  | { tipo: 'curto' }
  | { tipo: 'sem_match'; varridas: number }
  | { tipo: 'com_match'; varridas: number; itens: ItemMatch[] };

type Token = {
  exibicao: string;
  chaves: string[];
  grupos: string[];
  fraco: boolean;
};

type CampoIndex = {
  peso: number;
  topo: boolean;
  chaves: Set<string>;
  grupos: Set<string>;
};

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function chavesDe(base: string): string[] {
  const s = new Set<string>([base]);
  if (base.length > 4 && base.endsWith('s')) s.add(base.slice(0, -1));
  if (base.length > 5 && base.endsWith('es')) s.add(base.slice(0, -2));
  if (base.length > 6 && base.endsWith('oes')) s.add(`${base.slice(0, -3)}ao`);
  return [...s];
}

function tokenizar(texto: string): Token[] {
  const partes = texto.toLowerCase().split(/[^0-9a-zà-ÿ]+/).filter(Boolean);
  const vistos = new Set<string>();
  const saida: Token[] = [];
  for (const superficie of partes) {
    const base = semAcento(superficie);
    if (base.length < 3 || STOP.has(base)) continue;
    const chaves = chavesDe(base);
    const id = [...chaves].sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
    if (vistos.has(id)) continue;
    vistos.add(id);
    const grupos = new Set<string>();
    for (const chave of chaves) {
      const g = GRUPO_POR.get(chave);
      if (g) grupos.add(g);
    }
    saida.push({
      exibicao: superficie,
      chaves,
      grupos: [...grupos],
      fraco: chaves.some((c) => FRACO.has(c)),
    });
  }
  return saida;
}

function indexar(texto: string | null, peso: number, topo: boolean): CampoIndex {
  const chaves = new Set<string>();
  const grupos = new Set<string>();
  if (texto) {
    for (const token of tokenizar(texto)) {
      for (const c of token.chaves) chaves.add(c);
      for (const g of token.grupos) grupos.add(g);
    }
  }
  return { peso, topo, chaves, grupos };
}

function camposDe(iniciativa: IniciativaParaMatch): CampoIndex[] {
  return [
    indexar(iniciativa.title, PESO_TITULO, true),
    indexar(iniciativa.theme, 4, true),
    indexar(iniciativa.objetivo_contexto, 3, false),
    indexar(iniciativa.description, 3, false),
    indexar(iniciativa.area_name, 3, false),
    indexar(iniciativa.directorate, 2, false),
    indexar(iniciativa.tools, 2, false),
    indexar(iniciativa.notes, 1, false),
  ];
}

export function problemaNormalizado(valor: string | string[] | undefined): string {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  return (bruto ?? '').trim().slice(0, MAX_CHARS_PROBLEMA);
}

export function resumoIniciativa(iniciativa: {
  objetivo_contexto: string | null;
  description: string | null;
  theme: string | null;
}): string {
  const bruto = (iniciativa.objetivo_contexto || iniciativa.description || iniciativa.theme || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (bruto.length <= 180) return bruto;
  const corte = bruto.slice(0, 180);
  const espaco = corte.lastIndexOf(' ');
  const curto = (espaco > 120 ? corte.slice(0, espaco) : corte).trim();
  return `${curto}…`;
}

export function textoVarredura(varridas: number, encontradas: number): string {
  if (varridas === 0) return 'A base ainda não tem iniciativas para comparar.';
  const base = varridas === 1 ? 'Varri 1 iniciativa' : `Varri ${varridas} iniciativas`;
  if (encontradas === 0) return `${base} e não encontrei nada parecido.`;
  if (encontradas === 1) return `${base} e encontrei 1 parecida.`;
  return `${base} e encontrei ${encontradas} parecidas.`;
}

export type MatchGravado = {
  project_id: string;
  title: string;
  stage: string;
  theme: string | null;
  area_name: string | null;
  owner_name: string | null;
  resumo: string;
  afinidade: number;
  termos: string[];
};

/** Linha de pulsenff_consultas. O que a tela mostra é esta linha, não um cálculo solto. */
export type RegistroPulsenff = {
  problema: string;
  resultado: 'curto' | 'sem_match' | 'com_match';
  varridas: number;
  encontrados: number;
  matches: MatchGravado[];
  previa: string;
};

export function registroPulsenff(problema: string, resultado: ResultadoVarredura): RegistroPulsenff {
  const texto = problemaNormalizado(problema);
  if (resultado.tipo === 'curto') {
    return {
      problema: texto,
      resultado: 'curto',
      varridas: 0,
      encontrados: 0,
      matches: [],
      previa: TEXTO_CONSULTA_CURTA,
    };
  }
  if (resultado.tipo === 'sem_match') {
    return {
      problema: texto,
      resultado: 'sem_match',
      varridas: resultado.varridas,
      encontrados: 0,
      matches: [],
      previa: TEXTO_SEM_MATCH,
    };
  }
  const matches = resultado.itens.map((item) => ({
    project_id: item.id,
    title: item.title,
    stage: item.stage,
    theme: item.theme,
    area_name: item.area_name,
    owner_name: item.owner_name,
    resumo: item.resumo,
    afinidade: item.afinidade,
    termos: item.termos,
  }));
  return {
    problema: texto,
    resultado: 'com_match',
    varridas: resultado.varridas,
    encontrados: matches.length,
    matches,
    previa: matches.map((m) => `${m.title} (${m.afinidade}%)`).join('; '),
  };
}

export function resultadoDoRegistro(registro: Pick<RegistroPulsenff, 'resultado' | 'varridas' | 'matches'>): ResultadoVarredura {
  if (registro.resultado === 'curto') return { tipo: 'curto' };
  if (registro.resultado === 'sem_match') return { tipo: 'sem_match', varridas: registro.varridas };
  return {
    tipo: 'com_match',
    varridas: registro.varridas,
    itens: registro.matches.map((m) => ({
      id: m.project_id,
      title: m.title,
      stage: m.stage,
      theme: m.theme,
      area_name: m.area_name,
      directorate: null,
      owner_name: m.owner_name,
      resumo: m.resumo,
      termos: m.termos,
      afinidade: m.afinidade,
    })),
  };
}

export function hrefCadastrarDoMatch(problema: string): string {
  const texto = problemaNormalizado(problema);
  if (!texto) return '/projetos/novo';
  return `/projetos/novo?${new URLSearchParams({ problema: texto }).toString()}`;
}

export function consultaCurta(problema: string): boolean {
  const texto = problemaNormalizado(problema);
  return texto.length < MIN_CHARS_PROBLEMA || tokenizar(texto).length < 2;
}

export function varrerIniciativas(
  problema: string,
  iniciativas: IniciativaParaMatch[],
): ResultadoVarredura {
  const texto = problemaNormalizado(problema);
  const consulta = tokenizar(texto);
  if (consultaCurta(texto)) return { tipo: 'curto' };

  const fortes = consulta.filter((t) => !t.fraco);
  const teto = (fortes.length || consulta.length) * PESO_TITULO;
  const candidatos: { item: ItemMatch; raw: number }[] = [];

  for (const iniciativa of iniciativas) {
    const campos = camposDe(iniciativa);
    let raw = 0;
    let hitsFortes = 0;
    let exatoNoTopo = false;
    const termos: string[] = [];

    for (const token of consulta) {
      let melhor: { peso: number; exato: boolean; topo: boolean } | null = null;
      for (const campo of campos) {
        if (campo.chaves.size === 0 && campo.grupos.size === 0) continue;
        const exato = token.chaves.some((c) => campo.chaves.has(c));
        if (exato) {
          const peso = token.fraco ? campo.peso * 0.5 : campo.peso;
          if (!melhor || peso > melhor.peso) melhor = { peso, exato: true, topo: campo.topo };
          continue;
        }
        if (token.fraco) continue;
        const sinonimo = token.grupos.some((g) => campo.grupos.has(g));
        if (sinonimo) {
          const peso = campo.peso * 0.6;
          if (!melhor || peso > melhor.peso) melhor = { peso, exato: false, topo: campo.topo };
        }
      }
      if (!melhor) continue;
      raw += melhor.peso;
      if (!token.fraco) {
        hitsFortes += 1;
        termos.push(token.exibicao);
        if (melhor.exato && melhor.topo && token.chaves.some((c) => c.length >= 5)) {
          exatoNoTopo = true;
        }
      }
    }

    const aceito = (hitsFortes >= 2 && raw >= PESO_TITULO)
      || (hitsFortes === 1 && exatoNoTopo && raw >= PESO_TITULO);
    if (!aceito) continue;

    candidatos.push({
      raw,
      item: {
        id: iniciativa.id,
        title: iniciativa.title,
        stage: iniciativa.stage,
        theme: iniciativa.theme,
        area_name: iniciativa.area_name,
        directorate: iniciativa.directorate,
        owner_name: iniciativa.owner_name,
        resumo: resumoIniciativa(iniciativa),
        termos,
        afinidade: Math.min(100, Math.max(1, Math.round((raw / teto) * 100))),
      },
    });
  }

  candidatos.sort((a, b) => b.raw - a.raw || a.item.title.localeCompare(b.item.title, 'pt'));
  const itens = candidatos.slice(0, MAX_MATCHES).map((c) => c.item);
  if (itens.length === 0) return { tipo: 'sem_match', varridas: iniciativas.length };
  return { tipo: 'com_match', varridas: iniciativas.length, itens };
}
