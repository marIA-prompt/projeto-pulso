import type { ExperienceLevel, Stage } from '@/lib/types';
import { diaISO, nf, nf1, plural } from '@/lib/format';

export const RANKING_TOP = 10;
export const RANKING_MESES = 3;

/** Nunca entram no placar — pedido explícito da gestão. */
export const RANKING_EXCLUIDOS = [
  'everton dzikovicz',
  'maria clara morais',
] as const;

export type RankingCategoria = 'entregas' | 'especialistas' | 'colaboradores';

export type RankingPessoa = {
  id: string;
  nome: string;
  avatar_url: string | null;
  area_name: string | null;
  valor: number;
  detalhe: string;
};

export type RankingsColaboradores = {
  entregas: RankingPessoa[];
  especialistas: RankingPessoa[];
  colaboradores: RankingPessoa[];
  /** YYYY-MM-DD da janela no fuso de São Paulo. */
  corteDesde: string;
  /** YYYY-MM-DD do fim da janela no fuso de São Paulo. */
  corteAte: string;
  /** False quando o ranking de entregas caiu para o histórico (sem data na janela). */
  entregasNaJanela: boolean;
};

export type PeriodoRanking = {
  desde: Date;
  ate: Date;
};

export type PresencaEncontro = {
  user_id: string;
  scheduled_at: string;
  status: string;
};

export type KpisScorecard = {
  entregasNoPeriodo: number;
  indiceMedio: number;
  campeaoEntregas: RankingPessoa | null;
  campeaoEspecialista: RankingPessoa | null;
  campeaoColaboracao: RankingPessoa | null;
};

export type ProjetoRanking = {
  id: string;
  title: string | null;
  owner_id: string | null;
  stage: Stage;
  concluded_at: string | null;
  last_activity_at: string;
  is_legacy_import: boolean | null;
  tool_tags: string[] | null;
  hours_saved_month: number | null;
  uses_ai: boolean | null;
  uses_n8n: boolean | null;
  uses_ai_generativa: boolean | null;
  score_final: number | null;
  dev_hours: number | null;
};

export type PessoaRanking = {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  experience_level: ExperienceLevel | null;
  languages: string[] | null;
  automations: string[] | null;
  available: boolean | null;
  bio: string | null;
  contact: string | null;
  area_name: string | null;
};

export type PresencaRanking = {
  user_id: string;
  presentes_3m: number;
  convites_3m: number;
};

export type PartesComplexidade = {
  base: number;
  tags: number;
  ia: number;
  n8n: number;
  horas: number;
  dev: number;
  matriz: number;
  total: number;
};

export type PartesColaboracao = {
  presenca: number;
  disponibilidade: number;
  ativas: number;
  perfil: number;
  indice: number;
};

export type AuditoriaIniciativa = {
  id: string;
  title: string;
  stage: Stage;
  data: string | null;
  hours_saved_month: number | null;
  complexidade: PartesComplexidade;
  uses_ai: boolean;
  uses_n8n: boolean;
  uses_ai_generativa: boolean;
  tool_tags: string[];
  score_final: number | null;
  dev_hours: number | null;
  noPeriodo: boolean;
};

export type AuditoriaPessoa = {
  id: string;
  nome: string;
  avatar_url: string | null;
  area_name: string | null;
  linguagens: string[];
  automacoes: string[];
  volumeHabilidades: number;
  scoreEspecialista: number;
  complexidadeTotal: number;
  entregasQtd: number;
  horasMes: number;
  entregas: AuditoriaIniciativa[];
  ativas: AuditoriaIniciativa[];
  colaboracao: PartesColaboracao & {
    presentes: number;
    convites: number;
    available: boolean;
    iniciativasAtivas: number;
    temBio: boolean;
    temContato: boolean;
  };
  corteDesde: string;
  corteAte: string;
  entregasNaJanela: boolean;
};

const ESTAGIOS_ENTREGA: ReadonlySet<Stage> = new Set(['concluido', 'showcase']);
const ESTAGIOS_ATIVOS: ReadonlySet<Stage> = new Set([
  'ideia', 'backlog', 'priorizacao', 'em_desenvolvimento', 'em_teste',
]);

export function nomeRanking(p: Pick<PessoaRanking, 'full_name' | 'nickname'>): string {
  const nome = p.full_name?.trim();
  if (nome) return nome;
  const apelido = p.nickname?.trim();
  if (apelido) return apelido;
  return 'Sem nome';
}

function nomeNormalizado(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

export function excluidaDoRanking(p: Pick<PessoaRanking, 'full_name' | 'nickname'>): boolean {
  const nomes = [p.full_name, p.nickname, nomeRanking(p)]
    .filter((n): n is string => Boolean(n?.trim()))
    .map(nomeNormalizado);
  return RANKING_EXCLUIDOS.some((ex) => nomes.some((n) => n === ex || n.includes(ex)));
}

/** Meio-dia UTC: o dia civil em São Paulo (UTC−3) coincide com o YMD. */
export function ymdUtcMeioDia(ymd: string): Date {
  return new Date(`${ymd}T12:00:00.000Z`);
}

/** Recorte padrão do placar: últimos 3 meses civis até hoje, em São Paulo. */
export function ymdPeriodoPadrao(agora = new Date()): { de: string; ate: string } {
  return {
    de: diaISO(corteMeses(agora).toISOString()),
    ate: diaISO(agora.toISOString()),
  };
}

export function datasDoPeriodo(de: string, ate: string, agora = new Date()): PeriodoRanking {
  const padrao = ymdPeriodoPadrao(agora);
  const deY = de || padrao.de;
  const ateY = ate || padrao.ate;
  return {
    desde: ymdUtcMeioDia(deY),
    ate: ymdUtcMeioDia(ateY),
  };
}

/** Recua N meses civis no fuso de São Paulo — janela dos rankings. */
export function corteMeses(agora: Date, meses = RANKING_MESES): Date {
  const ymd = diaISO(agora.toISOString());
  const [y, m, d] = ymd.split('-').map(Number);
  let mes = m - meses;
  let ano = y;
  while (mes <= 0) {
    mes += 12;
    ano -= 1;
  }
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const dia = Math.min(d, ultimo);
  return ymdUtcMeioDia(
    `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
  );
}

export function normalizarFerramenta(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function ferramentasDe(p: PessoaRanking): string[] {
  return [...(p.languages ?? []), ...(p.automations ?? [])]
    .map(normalizarFerramenta)
    .filter(Boolean);
}

function unicasOriginais(valores: string[] | null, seen: Set<string>): string[] {
  const out: string[] = [];
  for (const raw of valores ?? []) {
    const n = normalizarFerramenta(raw);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(raw.trim());
  }
  return out;
}

/** Habilidades do Hub na grafia original, sem repetir. */
export function habilidadesDoHub(p: PessoaRanking): { linguagens: string[]; automacoes: string[] } {
  const seen = new Set<string>();
  return {
    linguagens: unicasOriginais(p.languages, seen),
    automacoes: unicasOriginais(p.automations, seen),
  };
}

/** Quantidade de habilidades únicas no Hub (linguagens + automações). */
export function volumeHabilidades(p: PessoaRanking): number {
  return new Set(ferramentasDe(p)).size;
}

/**
 * Complexidade de uma iniciativa: stack (IA / n8n / tags), esforço
 * (`dev_hours`), impacto em horas e score da matriz quando existe.
 */
export function partesComplexidade(p: ProjetoRanking): PartesComplexidade {
  const tags = [...new Set((p.tool_tags ?? []).map(normalizarFerramenta).filter(Boolean))].length;
  const ia = p.uses_ai_generativa ? 16 : p.uses_ai ? 10 : 0;
  const n8n = p.uses_n8n ? 8 : 0;
  const horas = Math.min(30, Math.round(Number(p.hours_saved_month) || 0));
  const dev = Math.min(20, Math.round((Number(p.dev_hours) || 0) / 4));
  const matriz = p.score_final == null ? 0 : Math.round(Number(p.score_final) * 6);
  const base = 4;
  return {
    base, tags, ia, n8n, horas, dev, matriz,
    total: base + tags * 5 + ia + n8n + horas + dev + matriz,
  };
}

export function complexidadeEntrega(p: ProjetoRanking): number {
  return partesComplexidade(p).total;
}

export function scoreEspecialista(volume: number, complexidade: number): number {
  return volume * 10 + complexidade;
}

/**
 * Data em que a iniciativa virou entrega. Iniciativas herdadas sem
 * `concluded_at` ficam de fora: o go-live reescreveu `last_activity_at`
 * e contá-las inflaria o ranking dos últimos 3 meses.
 */
export function dataEntrega(p: ProjetoRanking): Date | null {
  if (!ESTAGIOS_ENTREGA.has(p.stage)) return null;
  if (p.concluded_at) {
    const d = new Date(p.concluded_at);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (p.is_legacy_import) return null;
  const d = new Date(p.last_activity_at);
  return Number.isNaN(d.getTime()) ? null : d;
}

function noPeriodo(d: Date, desde: Date, ate: Date): boolean {
  const dia = diaISO(d.toISOString());
  const de = diaISO(desde.toISOString());
  const ateD = diaISO(ate.toISOString());
  if (!dia || !de || !ateD) return false;
  return dia >= de && dia <= ateD;
}

function topN(pessoas: RankingPessoa[], n = RANKING_TOP): RankingPessoa[] {
  return pessoas
    .filter((p) => p.valor > 0)
    .sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome, 'pt-BR'))
    .slice(0, n);
}

function ehEncontro(p: PresencaRanking | PresencaEncontro): p is PresencaEncontro {
  return 'scheduled_at' in p;
}

function agregarPresencas(
  presencas: Array<PresencaRanking | PresencaEncontro>,
  desde: Date,
  ate: Date,
): Map<string, { presentes: number; convites: number }> {
  const map = new Map<string, { presentes: number; convites: number }>();
  for (const p of presencas) {
    if (ehEncontro(p)) {
      const d = new Date(p.scheduled_at);
      if (Number.isNaN(d.getTime()) || !noPeriodo(d, desde, ate)) continue;
      const atual = map.get(p.user_id) ?? { presentes: 0, convites: 0 };
      atual.convites += 1;
      if (p.status === 'present') atual.presentes += 1;
      map.set(p.user_id, atual);
    } else {
      map.set(p.user_id, { presentes: p.presentes_3m, convites: p.convites_3m });
    }
  }
  return map;
}

function resolverPeriodo(agoraOuPeriodo: Date | PeriodoRanking): PeriodoRanking {
  if (agoraOuPeriodo instanceof Date) {
    return { desde: corteMeses(agoraOuPeriodo), ate: agoraOuPeriodo };
  }
  return agoraOuPeriodo;
}

export function kpisDoScorecard(r: RankingsColaboradores): KpisScorecard {
  const indiceMedio = r.colaboradores.length === 0
    ? 0
    : Math.round(r.colaboradores.reduce((s, p) => s + p.valor, 0) / r.colaboradores.length);
  return {
    entregasNoPeriodo: r.entregas.reduce((s, p) => s + p.valor, 0),
    indiceMedio,
    campeaoEntregas: r.entregas[0] ?? null,
    campeaoEspecialista: r.especialistas[0] ?? null,
    campeaoColaboracao: r.colaboradores[0] ?? null,
  };
}

/**
 * Índice 0–100 de ajuda e colaboração:
 *   presença nos encontros (até 40) + disponibilidade (20)
 *   + iniciativas ativas (até 20) + perfil encontrável (até 20).
 */
export function partesColaboracao(opts: {
  presentes3m: number;
  convites3m: number;
  available: boolean;
  iniciativasAtivas: number;
  ferramentas: number;
  temBio: boolean;
  temContato: boolean;
}): PartesColaboracao {
  const taxa = opts.convites3m > 0 ? opts.presentes3m / opts.convites3m : 0;
  const presenca = Math.round(40 * Math.min(1, taxa));
  const disponibilidade = opts.available ? 20 : 0;
  const ativas = Math.min(20, opts.iniciativasAtivas * 7);
  const perfil = Math.min(
    20,
    opts.ferramentas * 3 + (opts.temBio ? 4 : 0) + (opts.temContato ? 4 : 0),
  );
  return {
    presenca,
    disponibilidade,
    ativas,
    perfil,
    indice: Math.min(100, presenca + disponibilidade + ativas + perfil),
  };
}

export function indiceColaboracao(opts: {
  presentes3m: number;
  convites3m: number;
  available: boolean;
  iniciativasAtivas: number;
  ferramentas: number;
  temBio: boolean;
  temContato: boolean;
}): number {
  return partesColaboracao(opts).indice;
}

export function montarRankings(
  pessoas: PessoaRanking[],
  projetos: ProjetoRanking[],
  presencas: Array<PresencaRanking | PresencaEncontro>,
  agoraOuPeriodo: Date | PeriodoRanking,
  opts: { fallbackHistorico?: boolean } = {},
): RankingsColaboradores {
  const { desde, ate } = resolverPeriodo(agoraOuPeriodo);
  const corteDesde = diaISO(desde.toISOString());
  const corteAte = diaISO(ate.toISOString());
  const elegiveis = pessoas.filter((p) => !excluidaDoRanking(p));
  const porId = new Map(elegiveis.map((p) => [p.id, p]));
  const presencaPorId = agregarPresencas(presencas, desde, ate);
  const fallbackHistorico = opts.fallbackHistorico ?? agoraOuPeriodo instanceof Date;

  const entregasAcc = new Map<string, { qtd: number; horas: number }>();
  const historicoAcc = new Map<string, { qtd: number; horas: number }>();
  const ativasAcc = new Map<string, number>();
  const complexidadeAcc = new Map<string, number>();
  const complexidadeHist = new Map<string, number>();

  for (const proj of projetos) {
    if (!proj.owner_id || !porId.has(proj.owner_id)) continue;
    const entrega = dataEntrega(proj);
    if (entrega && noPeriodo(entrega, desde, ate)) {
      const atual = entregasAcc.get(proj.owner_id) ?? { qtd: 0, horas: 0 };
      atual.qtd += 1;
      atual.horas += Number(proj.hours_saved_month) || 0;
      entregasAcc.set(proj.owner_id, atual);
      complexidadeAcc.set(
        proj.owner_id,
        (complexidadeAcc.get(proj.owner_id) ?? 0) + complexidadeEntrega(proj),
      );
    }
    if (ESTAGIOS_ENTREGA.has(proj.stage)) {
      const hist = historicoAcc.get(proj.owner_id) ?? { qtd: 0, horas: 0 };
      hist.qtd += 1;
      hist.horas += Number(proj.hours_saved_month) || 0;
      historicoAcc.set(proj.owner_id, hist);
      complexidadeHist.set(
        proj.owner_id,
        (complexidadeHist.get(proj.owner_id) ?? 0) + complexidadeEntrega(proj),
      );
    }
    if (ESTAGIOS_ATIVOS.has(proj.stage)) {
      ativasAcc.set(proj.owner_id, (ativasAcc.get(proj.owner_id) ?? 0) + 1);
    }
  }

  const entregasNaJanela = [...entregasAcc.values()].some((v) => v.qtd > 0);
  const volumePorId = (!entregasNaJanela && fallbackHistorico) ? historicoAcc : entregasAcc;
  const complexidadePorId = (!entregasNaJanela && fallbackHistorico) ? complexidadeHist : complexidadeAcc;

  const entregas: RankingPessoa[] = [];
  const especialistas: RankingPessoa[] = [];
  const colaboradores: RankingPessoa[] = [];

  for (const p of elegiveis) {
    const nome = nomeRanking(p);
    const base = {
      id: p.id,
      nome,
      avatar_url: p.avatar_url,
      area_name: p.area_name,
    };

    const vol = volumePorId.get(p.id);
    if (vol) {
      entregas.push({
        ...base,
        valor: vol.qtd,
        detalhe: vol.horas > 0
          ? `${plural(vol.qtd, 'entrega', 'entregas')} · ${nf1.format(vol.horas)} h/mês`
          : plural(vol.qtd, 'entrega', 'entregas'),
      });
    }

    const volume = volumeHabilidades(p);
    const complexidade = complexidadePorId.get(p.id) ?? 0;
    const scoreEsp = scoreEspecialista(volume, complexidade);
    if (scoreEsp > 0) {
      const pedacoHabilidade = plural(volume, 'habilidade', 'habilidades');
      especialistas.push({
        ...base,
        valor: scoreEsp,
        detalhe: complexidade > 0
          ? `${pedacoHabilidade} · complexidade ${nf.format(complexidade)}`
          : pedacoHabilidade,
      });
    }

    const pres = presencaPorId.get(p.id);
    const indice = indiceColaboracao({
      presentes3m: pres?.presentes ?? 0,
      convites3m: pres?.convites ?? 0,
      available: p.available === true,
      iniciativasAtivas: ativasAcc.get(p.id) ?? 0,
      ferramentas: volume,
      temBio: Boolean(p.bio?.trim()),
      temContato: Boolean(p.contact?.trim()),
    });
    if (indice > 0) {
      colaboradores.push({
        ...base,
        valor: indice,
        detalhe: p.available
          ? `índice ${nf.format(indice)} · disponível`
          : `índice ${nf.format(indice)}`,
      });
    }
  }

  return {
    entregas: topN(entregas),
    especialistas: topN(especialistas),
    colaboradores: topN(colaboradores),
    corteDesde,
    corteAte,
    entregasNaJanela,
  };
}

function tituloProjeto(p: ProjetoRanking): string {
  const t = p.title?.trim();
  return t || 'Sem título';
}

function iniciativaAuditoria(
  proj: ProjetoRanking,
  desde: Date,
  ate: Date,
): AuditoriaIniciativa {
  const entrega = dataEntrega(proj);
  return {
    id: proj.id,
    title: tituloProjeto(proj),
    stage: proj.stage,
    data: entrega ? diaISO(entrega.toISOString()) : null,
    hours_saved_month: proj.hours_saved_month == null ? null : Number(proj.hours_saved_month),
    complexidade: partesComplexidade(proj),
    uses_ai: proj.uses_ai === true,
    uses_n8n: proj.uses_n8n === true,
    uses_ai_generativa: proj.uses_ai_generativa === true,
    tool_tags: [...new Set((proj.tool_tags ?? []).map((t) => t.trim()).filter(Boolean))],
    score_final: proj.score_final == null ? null : Number(proj.score_final),
    dev_hours: proj.dev_hours == null ? null : Number(proj.dev_hours),
    noPeriodo: Boolean(entrega && noPeriodo(entrega, desde, ate)),
  };
}

/** Detalhe da pontuação de uma pessoa para auditoria gerencial. */
export function auditoriaPessoa(
  id: string,
  pessoas: PessoaRanking[],
  projetos: ProjetoRanking[],
  presencas: Array<PresencaRanking | PresencaEncontro>,
  agoraOuPeriodo: Date | PeriodoRanking,
  opts: { fallbackHistorico?: boolean } = {},
): AuditoriaPessoa | null {
  const pessoa = pessoas.find((p) => p.id === id);
  if (!pessoa || excluidaDoRanking(pessoa)) return null;

  const { desde, ate } = resolverPeriodo(agoraOuPeriodo);
  const fallbackHistorico = opts.fallbackHistorico ?? agoraOuPeriodo instanceof Date;
  const rankings = montarRankings(pessoas, projetos, presencas, agoraOuPeriodo, { fallbackHistorico });
  const presencaPorId = agregarPresencas(presencas, desde, ate);
  const pres = presencaPorId.get(id);
  const hub = habilidadesDoHub(pessoa);
  const volume = volumeHabilidades(pessoa);

  const minhas = projetos.filter((proj) => proj.owner_id === id);
  const entregasPeriodo = minhas
    .map((proj) => iniciativaAuditoria(proj, desde, ate))
    .filter((i) => ESTAGIOS_ENTREGA.has(i.stage) && i.noPeriodo);
  const entregasHist = minhas
    .map((proj) => iniciativaAuditoria(proj, desde, ate))
    .filter((i) => ESTAGIOS_ENTREGA.has(i.stage));
  const usarHistorico = !rankings.entregasNaJanela && fallbackHistorico;
  const entregas = usarHistorico ? entregasHist : entregasPeriodo;
  const ativas = minhas
    .filter((proj) => ESTAGIOS_ATIVOS.has(proj.stage))
    .map((proj) => iniciativaAuditoria(proj, desde, ate));

  const horasMes = entregas.reduce((s, i) => s + (Number(i.hours_saved_month) || 0), 0);
  const complexidadeTotal = entregas.reduce((s, i) => s + i.complexidade.total, 0);
  const temBio = Boolean(pessoa.bio?.trim());
  const temContato = Boolean(pessoa.contact?.trim());
  const colaboracao = partesColaboracao({
    presentes3m: pres?.presentes ?? 0,
    convites3m: pres?.convites ?? 0,
    available: pessoa.available === true,
    iniciativasAtivas: ativas.length,
    ferramentas: volume,
    temBio,
    temContato,
  });

  return {
    id: pessoa.id,
    nome: nomeRanking(pessoa),
    avatar_url: pessoa.avatar_url,
    area_name: pessoa.area_name,
    linguagens: hub.linguagens,
    automacoes: hub.automacoes,
    volumeHabilidades: volume,
    scoreEspecialista: scoreEspecialista(volume, complexidadeTotal),
    complexidadeTotal,
    entregasQtd: entregas.length,
    horasMes,
    entregas,
    ativas,
    colaboracao: {
      ...colaboracao,
      presentes: pres?.presentes ?? 0,
      convites: pres?.convites ?? 0,
      available: pessoa.available === true,
      iniciativasAtivas: ativas.length,
      temBio,
      temContato,
    },
    corteDesde: rankings.corteDesde,
    corteAte: rankings.corteAte,
    entregasNaJanela: rankings.entregasNaJanela,
  };
}
