import type { IniciativaNormalizada } from './iniciativas';

/** Estágios que a view `v_portfolio_kpis` não conta como ativas. */
export const ESTAGIOS_NAO_ATIVOS = ['concluido', 'cancelado'] as const;

export type PremissasCalculo = {
  custo_hora: number;
  horas_mes_por_pessoa: number;
};

export type GrupoHoras = {
  nome: string;
  horas: number;
  com_horas: number;
  concluidas: number;
};

export type SimuladorCusto = {
  mes: number;
  ano: number;
  a_capturar_ano: number;
};

export type IndicadoresPortfolio = {
  total: number;
  por_estagio: Record<string, number>;
  ativas: number;
  horas_devolvidas_mes: number;
  horas_portfolio_mes: number;
  horas_a_capturar_mes: number;
  pct_horas_capturadas: number | null;
  horas_devolvidas_ano: number;
  pessoas_equivalentes: number;
  concluidas_com_horas: number;
  concluidas_sem_horas: number;
  com_horas_informadas: number;
  top5_horas: number;
  pct_top5: number | null;
  usa_ia: number;
  usa_n8n: number;
  novas_desde_lancamento: number;
  novas_concluidas: number;
  horas_novas_concluidas: number;
  horas_por_tema_concluidas: Record<string, number>;
  horas_por_diretoria_concluidas: GrupoHoras[];
  simulador_custo_hora_50: SimuladorCusto;
};

/** Soma em décimos de hora — a precisão do cadastro — para não arrastar lixo binário. */
export function decimo(n: number): number {
  return Math.round(n * 10) / 10;
}

export function percentual(numerador: number, denominador: number): number | null {
  if (denominador === 0) return null;
  return Math.round((100 * numerador) / denominador);
}

export function somaHoras(lista: IniciativaNormalizada[]): number {
  let s = 0;
  for (const i of lista) {
    if (i.hours_saved_month != null) s += i.hours_saved_month;
  }
  return decimo(s);
}

export function concluidasDe(lista: IniciativaNormalizada[]): IniciativaNormalizada[] {
  return lista.filter((i) => i.stage === 'concluido');
}

export function ativasDe(lista: IniciativaNormalizada[]): IniciativaNormalizada[] {
  return lista.filter((i) => i.stage !== 'concluido' && i.stage !== 'cancelado');
}

export function comHorasDe(lista: IniciativaNormalizada[]): IniciativaNormalizada[] {
  return lista.filter((i) => i.hours_saved_month != null);
}

export function novasDe(lista: IniciativaNormalizada[]): IniciativaNormalizada[] {
  return lista.filter((i) => i.is_legacy_import === false);
}

export function porEstagio(lista: IniciativaNormalizada[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const i of lista) {
    m[i.stage] = (m[i.stage] ?? 0) + 1;
  }
  return m;
}

export function topHoras(lista: IniciativaNormalizada[], n: number): number {
  const valores = comHorasDe(lista)
    .map((i) => i.hours_saved_month as number)
    .sort((a, b) => b - a)
    .slice(0, n);
  return decimo(valores.reduce((s, v) => s + v, 0));
}

export function horasPorCampo(
  lista: IniciativaNormalizada[],
  campo: 'theme' | 'directorate',
): GrupoHoras[] {
  const grupos = new Map<string, GrupoHoras>();
  for (const i of concluidasDe(lista)) {
    const nome = i[campo];
    const g = grupos.get(nome) ?? { nome, horas: 0, com_horas: 0, concluidas: 0 };
    g.concluidas += 1;
    if (i.hours_saved_month != null) {
      g.com_horas += 1;
      g.horas += i.hours_saved_month;
    }
    grupos.set(nome, g);
  }
  return [...grupos.values()]
    .map((g) => ({ ...g, horas: decimo(g.horas) }))
    .sort((a, b) => b.horas - a.horas || b.concluidas - a.concluidas || a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function simularCusto(
  horasDevolvidasMes: number,
  horasACapturarMes: number,
  custoHora: number,
): SimuladorCusto {
  const mes = Math.round(horasDevolvidasMes * custoHora);
  return {
    mes,
    ano: mes * 12,
    a_capturar_ano: Math.round(horasACapturarMes * custoHora * 12),
  };
}

export function indicadoresPortfolio(
  lista: IniciativaNormalizada[],
  premissas: PremissasCalculo,
): IndicadoresPortfolio {
  const concluidas = concluidasDe(lista);
  const novas = novasDe(lista);
  const novasConcluidas = concluidasDe(novas);
  const horasDevolvidas = somaHoras(concluidas);
  const horasPortfolio = somaHoras(lista);
  const horasACapturar = decimo(horasPortfolio - horasDevolvidas);
  const top5 = topHoras(concluidas, 5);
  const porTema = horasPorCampo(lista, 'theme');
  const concluidasComHoras = comHorasDe(concluidas).length;

  return {
    total: lista.length,
    por_estagio: porEstagio(lista),
    ativas: ativasDe(lista).length,
    horas_devolvidas_mes: horasDevolvidas,
    horas_portfolio_mes: horasPortfolio,
    horas_a_capturar_mes: horasACapturar,
    pct_horas_capturadas: percentual(horasDevolvidas, horasPortfolio),
    horas_devolvidas_ano: decimo(horasDevolvidas * 12),
    pessoas_equivalentes: decimo(horasDevolvidas / premissas.horas_mes_por_pessoa),
    concluidas_com_horas: concluidasComHoras,
    concluidas_sem_horas: concluidas.length - concluidasComHoras,
    com_horas_informadas: comHorasDe(lista).length,
    top5_horas: top5,
    pct_top5: percentual(top5, horasDevolvidas),
    usa_ia: lista.filter((i) => i.uses_ai).length,
    usa_n8n: lista.filter((i) => i.uses_n8n).length,
    novas_desde_lancamento: novas.length,
    novas_concluidas: novasConcluidas.length,
    horas_novas_concluidas: somaHoras(novasConcluidas),
    horas_por_tema_concluidas: Object.fromEntries(porTema.map((g) => [g.nome, g.horas])),
    horas_por_diretoria_concluidas: horasPorCampo(lista, 'directorate'),
    simulador_custo_hora_50: simularCusto(horasDevolvidas, horasACapturar, premissas.custo_hora),
  };
}
