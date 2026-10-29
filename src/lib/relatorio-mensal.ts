/**
 * Relatório mensal por diretoria (workflow W6).
 *
 * Duas seções, sem repetir iniciativa:
 *   - criadas no mês: nasceram no mês e não são carga legada;
 *   - atualizadas no mês: já existiam e tiveram atualização substantiva
 *     (`last_activity_at`) dentro do mês.
 *
 * A carga legada entra com `created_at` no mês da importação. Contá-la como
 * criação inflaria o primeiro relatório com o acervo inteiro. Ela só aparece
 * em "atualizadas" num mês posterior, quando o dono mexe de verdade.
 *
 * O mês é o calendário de America/Sao_Paulo (UTC−3, sem horário de verão).
 * Ganhos e valor realizados seguem a Metodologia Executiva: horas e R$/mês
 * das iniciativas concluídas. O movimento do mês é outro recorte — não soma
 * com o realizado.
 */
import { dataCurta, horas, moeda, plural } from './format';
import { STAGE_LABEL, type Stage } from './types';

const SP_OFFSET_MS = 3 * 60 * 60 * 1000;
const DIA_MS = 86_400_000;

export const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
] as const;

export type DiretoriaCatalogo = {
  id: string;
  slug: string;
  nome: string;
  ordem: number;
  diretor_nome?: string | null;
  diretor_email?: string | null;
  /** Cópias (CC) do e-mail mensal. Vazio = ninguém em cópia. */
  emails_copia?: string[];
  /** Nomes extras que também caem nesta coleção (ex.: "Recursos Humanos" → RH). */
  aliases?: string[];
};

export type IniciativaRelatorio = {
  id: string;
  title: string;
  stage: Stage;
  area_name: string | null;
  diretoria_id: string | null;
  directorate: string | null;
  owner_name: string;
  hours_saved_month: number | null;
  cost_saved_month: number | null;
  uses_ai: boolean;
  created_at: string;
  last_activity_at: string;
  concluded_at: string | null;
  is_legacy_import: boolean;
};

export type ItemRelatorio = {
  id: string;
  title: string;
  stage: Stage;
  area_name: string | null;
  owner_name: string;
  hours_saved_month: number | null;
  cost_saved_month: number | null;
  valor_anual: number | null;
  created_at: string;
  last_activity_at: string;
};

export type MetricasArea = {
  iniciativas: number;
  ativas: number;
  concluidas: number;
  canceladas: number;
  criadas_no_mes: number;
  atualizadas_no_mes: number;
  concluidas_no_mes: number;
  em_alerta: number;
  com_ia: number;
  com_horas: number;
  com_valor: number;
};

export type GanhosArea = {
  /** Σ horas/mês das concluídas — número realizado da área. */
  horas_devolvidas_mes: number;
  /** Σ horas/mês de todo o portfólio da área, qualquer estágio. */
  horas_portfolio: number;
  horas_criadas: number;
  horas_atualizadas: number;
  /** Horas/mês das que foram concluídas dentro do mês. */
  horas_concluidas_no_mes: number;
};

export type ValorArea = {
  mensal_realizado: number;
  anual_realizado: number;
  mensal_criadas: number;
  mensal_atualizadas: number;
  /** Criadas + atualizadas. Não inclui o realizado, para não somar duas vezes. */
  mensal_movimento: number;
  anual_movimento: number;
  mensal_concluidas_no_mes: number;
};

export type RelatorioDiretoria = {
  id: string;
  slug: string;
  nome: string;
  ordem: number;
  diretor_nome: string | null;
  diretor_email: string | null;
  emails_copia: string[];
  metricas: MetricasArea;
  ganhos: GanhosArea;
  valor: ValorArea;
  criadas: ItemRelatorio[];
  atualizadas: ItemRelatorio[];
  texto: string;
};

export type PacoteRelatorio = {
  ano: number;
  mes: number;
  rotulo: string;
  inicio: string;
  fim: string;
  referencia: string;
  gerado_em: string;
  dashboard_url: string | null;
  relatorios: RelatorioDiretoria[];
};

const SEM_DIRETORIA: DiretoriaCatalogo = {
  id: 'sem-diretoria',
  slug: 'sem-diretoria',
  nome: 'Sem diretoria vinculada',
  ordem: Number.MAX_SAFE_INTEGER,
};

export function calendarioSP(instante: Date): { ano: number; mes: number; dia: number } {
  const deslocado = new Date(instante.getTime() - SP_OFFSET_MS);
  return {
    ano: deslocado.getUTCFullYear(),
    mes: deslocado.getUTCMonth() + 1,
    dia: deslocado.getUTCDate(),
  };
}

export function mesAtual(agora = new Date()): { ano: number; mes: number } {
  const c = calendarioSP(agora);
  return { ano: c.ano, mes: c.mes };
}

export function deslocarMes(ano: number, mes: number, delta: number): { ano: number; mes: number } {
  const d = new Date(Date.UTC(ano, mes - 1 + delta, 1));
  return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 };
}

export function mesAnterior(agora = new Date()): { ano: number; mes: number } {
  const atual = mesAtual(agora);
  return deslocarMes(atual.ano, atual.mes, -1);
}

export function chaveMes(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}`;
}

export function parseMes(valor: string | null | undefined): { ano: number; mes: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec((valor ?? '').trim());
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  if (ano < 2000 || ano > 2100 || mes < 1 || mes > 12) return null;
  return { ano, mes };
}

/** Mês explícito em AAAA-MM, ou o fallback quando o parâmetro vem vazio. */
export function mesPedido(
  params: { mes?: string | null },
  fallback: { ano: number; mes: number },
): { ano: number; mes: number } | { erro: string } {
  if (params.mes == null || params.mes.trim() === '') return fallback;
  const parsed = parseMes(params.mes);
  if (!parsed) return { erro: 'Informe o mês como AAAA-MM.' };
  return parsed;
}

export function rotuloMes(ano: number, mes: number): string {
  return `${MESES[mes - 1]} de ${ano}`;
}

/** [início, fim) em instantes UTC. 00:00 em São Paulo = 03:00 UTC. */
export function intervaloMes(ano: number, mes: number): { inicio: Date; fim: Date } {
  const inicio = new Date(Date.UTC(ano, mes - 1, 1, 3, 0, 0, 0));
  const proximo = deslocarMes(ano, mes, 1);
  const fim = new Date(Date.UTC(proximo.ano, proximo.mes - 1, 1, 3, 0, 0, 0));
  return { inicio, fim };
}

/** Fim do mês pedido, ou agora se o mês ainda não fechou. */
export function referenciaDoMes(ano: number, mes: number, agora = new Date()): Date {
  const { fim } = intervaloMes(ano, mes);
  return new Date(Math.min(agora.getTime(), fim.getTime() - 1));
}

export function normalizarDiretoria(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/^area\s+/, '')
    .replace(/^de\s+/, '');
}

export function numeroOuNulo(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function soma(valores: Array<number | null | undefined>): number {
  const total = valores.reduce<number>((acc, n) => acc + (n ?? 0), 0);
  return Math.round(total * 100) / 100;
}

function noIntervalo(iso: string | null | undefined, inicio: Date, fim: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t >= inicio.getTime() && t < fim.getTime();
}

function diasEntre(iso: string, ref: Date): number | null {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const a = calendarioSP(new Date(t));
  const b = calendarioSP(ref);
  const ua = Date.UTC(a.ano, a.mes - 1, a.dia);
  const ub = Date.UTC(b.ano, b.mes - 1, b.dia);
  return Math.round((ub - ua) / DIA_MS);
}

function emAlerta(i: IniciativaRelatorio, ref: Date): boolean {
  if (i.stage === 'concluido' || i.stage === 'cancelado') return false;
  const dias = diasEntre(i.last_activity_at, ref);
  return dias != null && dias > 14;
}

function valorAnual(mensal: number | null): number | null {
  if (mensal == null) return null;
  return Math.round(mensal * 12 * 100) / 100;
}

function paraItem(i: IniciativaRelatorio): ItemRelatorio {
  return {
    id: i.id,
    title: i.title,
    stage: i.stage,
    area_name: i.area_name,
    owner_name: i.owner_name,
    hours_saved_month: i.hours_saved_month,
    cost_saved_month: i.cost_saved_month,
    valor_anual: valorAnual(i.cost_saved_month),
    created_at: i.created_at,
    last_activity_at: i.last_activity_at,
  };
}

function porInstanteDesc(campo: 'created_at' | 'last_activity_at') {
  return (a: IniciativaRelatorio, b: IniciativaRelatorio) => {
    const d = new Date(b[campo]).getTime() - new Date(a[campo]).getTime();
    if (d !== 0) return d;
    return a.title.localeCompare(b.title, 'pt-BR');
  };
}

function resolverDiretoria(
  i: IniciativaRelatorio,
  porId: Map<string, DiretoriaCatalogo>,
  porChave: Map<string, DiretoriaCatalogo>,
): DiretoriaCatalogo | null {
  if (i.diretoria_id) {
    const ligada = porId.get(i.diretoria_id);
    if (ligada) return ligada;
  }
  const texto = i.directorate?.trim();
  if (!texto) return null;
  return porChave.get(normalizarDiretoria(texto)) ?? null;
}

function linhaItem(i: ItemRelatorio, quando: string): string {
  const ganho = i.hours_saved_month == null ? 'horas não informadas' : `${horas(i.hours_saved_month)}/mês`;
  const valor = i.cost_saved_month == null ? 'valor não informado' : `${moeda(i.cost_saved_month)}/mês`;
  const area = i.area_name ? ` · ${i.area_name}` : '';
  return `- ${i.title} — ${STAGE_LABEL[i.stage]}${area} — ${i.owner_name} — ${ganho} — ${valor} — ${quando}`;
}

export function textoRelatorio(
  rel: Omit<RelatorioDiretoria, 'texto'>,
  ctx: { rotulo: string; dashboardUrl?: string | null },
): string {
  const { metricas: m, ganhos: g, valor: v } = rel;
  const bloco = (titulo: string, itens: ItemRelatorio[], vazio: string, quando: (i: ItemRelatorio) => string) => {
    if (itens.length === 0) return `${titulo}\n${vazio}`;
    return [titulo, ...itens.map((i) => linhaItem(i, quando(i)))].join('\n');
  };

  const linhas = [
    `Relatório mensal — ${rel.nome}`,
    ...(rel.diretor_nome ? [`Diretor: ${rel.diretor_nome}`] : []),
    `Período: ${ctx.rotulo}`,
    '',
    'Métricas',
    `- ${plural(m.iniciativas, 'iniciativa no portfólio', 'iniciativas no portfólio')} (${plural(m.ativas, 'ativa', 'ativas')}, ${plural(m.concluidas, 'concluída', 'concluídas')}, ${plural(m.canceladas, 'cancelada', 'canceladas')})`,
    `- ${plural(m.criadas_no_mes, 'criada no mês', 'criadas no mês')}`,
    `- ${plural(m.atualizadas_no_mes, 'atualizada no mês', 'atualizadas no mês')}`,
    `- ${plural(m.concluidas_no_mes, 'concluída no mês', 'concluídas no mês')}`,
    `- ${plural(m.em_alerta, 'em alerta', 'em alerta')} (sem atualização há mais de 14 dias)`,
    `- ${plural(m.com_ia, 'com uso de IA', 'com uso de IA')}`,
    '',
    'Ganhos',
    `- ${horas(g.horas_devolvidas_mes)}/mês devolvidas (iniciativas concluídas)`,
    `- ${horas(g.horas_concluidas_no_mes)}/mês nas concluídas deste mês`,
    `- ${horas(g.horas_criadas)}/mês nas iniciativas criadas no mês`,
    `- ${horas(g.horas_atualizadas)}/mês nas iniciativas atualizadas no mês`,
    `- ${horas(g.horas_portfolio)}/mês no portfólio inteiro da área`,
    `- ${m.com_horas} de ${m.iniciativas} com horas informadas`,
    '',
    'Valor para a área',
    `- ${moeda(v.mensal_realizado)}/mês realizados · ${moeda(v.anual_realizado)}/ano`,
    `- ${moeda(v.mensal_concluidas_no_mes)}/mês nas concluídas deste mês`,
    `- ${moeda(v.mensal_movimento)}/mês associados ao movimento (${moeda(v.mensal_criadas)} nas criadas, ${moeda(v.mensal_atualizadas)} nas atualizadas)`,
    `- ${m.com_valor} de ${m.iniciativas} com valor em R$ informado`,
    '',
    bloco(
      'Iniciativas criadas no mês',
      rel.criadas,
      'Nenhuma iniciativa criada neste mês.',
      (i) => `criada em ${dataCurta(i.created_at)}`,
    ),
    '',
    bloco(
      'Iniciativas atualizadas no mês',
      rel.atualizadas,
      'Nenhuma iniciativa atualizada neste mês.',
      (i) => `atualizada em ${dataCurta(i.last_activity_at)}`,
    ),
    '',
    'Criadas no mês não se repetem em atualizadas. A carga legada não entra como criação.',
  ];

  if (ctx.dashboardUrl) linhas.push('', `Painel: ${ctx.dashboardUrl}`);
  return linhas.join('\n');
}

export function montarRelatorioMensal(input: {
  ano: number;
  mes: number;
  diretorias: DiretoriaCatalogo[];
  iniciativas: IniciativaRelatorio[];
  agora?: Date;
  dashboardUrl?: string | null;
}): PacoteRelatorio {
  const agora = input.agora ?? new Date();
  const { inicio, fim } = intervaloMes(input.ano, input.mes);
  const referencia = referenciaDoMes(input.ano, input.mes, agora);
  const rotulo = rotuloMes(input.ano, input.mes);

  const catalogo = [...input.diretorias].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'));
  const porId = new Map(catalogo.map((d) => [d.id, d]));
  const porChave = new Map<string, DiretoriaCatalogo>();
  for (const d of catalogo) porChave.set(normalizarDiretoria(d.nome), d);
  for (const d of catalogo) {
    for (const alias of d.aliases ?? []) {
      const chave = normalizarDiretoria(alias);
      if (chave && !porChave.has(chave)) porChave.set(chave, d);
    }
  }

  const grupos = new Map<string, IniciativaRelatorio[]>();
  for (const d of catalogo) grupos.set(d.id, []);
  const sem: IniciativaRelatorio[] = [];

  for (const iniciativa of input.iniciativas) {
    const dest = resolverDiretoria(iniciativa, porId, porChave);
    if (!dest) sem.push(iniciativa);
    else grupos.get(dest.id)!.push(iniciativa);
  }

  const montar = (dir: DiretoriaCatalogo, lista: IniciativaRelatorio[]): RelatorioDiretoria => {
    const criadas = lista.filter((i) => !i.is_legacy_import && noIntervalo(i.created_at, inicio, fim)).sort(porInstanteDesc('created_at'));
    const atualizadas = lista
      .filter((i) => noIntervalo(i.last_activity_at, inicio, fim) && !noIntervalo(i.created_at, inicio, fim))
      .sort(porInstanteDesc('last_activity_at'));
    const concluidasNoMes = lista.filter((i) => i.stage === 'concluido' && noIntervalo(i.concluded_at, inicio, fim));
    const concluidas = lista.filter((i) => i.stage === 'concluido');

    const metricas: MetricasArea = {
      iniciativas: lista.length,
      ativas: lista.filter((i) => i.stage !== 'concluido' && i.stage !== 'cancelado').length,
      concluidas: concluidas.length,
      canceladas: lista.filter((i) => i.stage === 'cancelado').length,
      criadas_no_mes: criadas.length,
      atualizadas_no_mes: atualizadas.length,
      concluidas_no_mes: concluidasNoMes.length,
      em_alerta: lista.filter((i) => emAlerta(i, referencia)).length,
      com_ia: lista.filter((i) => i.uses_ai).length,
      com_horas: lista.filter((i) => i.hours_saved_month != null).length,
      com_valor: lista.filter((i) => i.cost_saved_month != null).length,
    };

    const ganhos: GanhosArea = {
      horas_devolvidas_mes: soma(concluidas.map((i) => i.hours_saved_month)),
      horas_portfolio: soma(lista.map((i) => i.hours_saved_month)),
      horas_criadas: soma(criadas.map((i) => i.hours_saved_month)),
      horas_atualizadas: soma(atualizadas.map((i) => i.hours_saved_month)),
      horas_concluidas_no_mes: soma(concluidasNoMes.map((i) => i.hours_saved_month)),
    };

    const mensalCriadas = soma(criadas.map((i) => i.cost_saved_month));
    const mensalAtualizadas = soma(atualizadas.map((i) => i.cost_saved_month));
    const mensalRealizado = soma(concluidas.map((i) => i.cost_saved_month));
    const mensalMovimento = soma([mensalCriadas, mensalAtualizadas]);
    const valor: ValorArea = {
      mensal_realizado: mensalRealizado,
      anual_realizado: valorAnual(mensalRealizado) ?? 0,
      mensal_criadas: mensalCriadas,
      mensal_atualizadas: mensalAtualizadas,
      mensal_movimento: mensalMovimento,
      anual_movimento: valorAnual(mensalMovimento) ?? 0,
      mensal_concluidas_no_mes: soma(concluidasNoMes.map((i) => i.cost_saved_month)),
    };

    const base = {
      id: dir.id,
      slug: dir.slug,
      nome: dir.nome,
      ordem: dir.ordem,
      diretor_nome: dir.diretor_nome ?? null,
      diretor_email: dir.diretor_email ?? null,
      emails_copia: (dir.emails_copia ?? []).filter((email) => email.trim()),
      metricas,
      ganhos,
      valor,
      criadas: criadas.map(paraItem),
      atualizadas: atualizadas.map(paraItem),
    };
    return { ...base, texto: textoRelatorio(base, { rotulo, dashboardUrl: input.dashboardUrl }) };
  };

  const relatorios = catalogo.map((d) => montar(d, grupos.get(d.id) ?? []));
  if (sem.length > 0) relatorios.push(montar(SEM_DIRETORIA, sem));

  return {
    ano: input.ano,
    mes: input.mes,
    rotulo,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    referencia: referencia.toISOString(),
    gerado_em: agora.toISOString(),
    dashboard_url: input.dashboardUrl ?? null,
    relatorios,
  };
}

/** Corpo do webhook W6 no disparo manual: uma diretoria, já com destinatários. */
export type CargaDisparoManual = {
  origem: 'manual';
  ano: number;
  mes: number;
  diretoria: string;
  diretoria_nome: string;
  diretor_nome: string | null;
  diretor_email: string;
  emails_copia: string[];
};

export function cargaDisparoManual(
  pedido: { ano: number; mes: number },
  rel: Pick<RelatorioDiretoria, 'slug' | 'nome' | 'diretor_nome' | 'diretor_email' | 'emails_copia'>,
): CargaDisparoManual {
  const para = (rel.diretor_email ?? '').trim().toLowerCase();
  const vistos = new Set<string>();
  const copia: string[] = [];
  for (const item of rel.emails_copia ?? []) {
    const email = String(item ?? '').trim().toLowerCase();
    if (!email || email === para || vistos.has(email)) continue;
    vistos.add(email);
    copia.push(email);
  }
  return {
    origem: 'manual',
    ano: pedido.ano,
    mes: pedido.mes,
    diretoria: rel.slug,
    diretoria_nome: rel.nome,
    diretor_nome: rel.diretor_nome,
    diretor_email: para,
    emails_copia: copia,
  };
}
