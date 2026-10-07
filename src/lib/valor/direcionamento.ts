import type { ResultadoEsperado } from './conteudo';
import type { Entregas, Prioridade, SituacaoInterna } from './schemas';

export type IndicadoresDirecionamento = {
  prioridades_total: number;
  prioridades_em_curso: number;
  prioridades_concluidas: number;
  resultados_total: number;
  resultados_atendido: number;
  resultados_parcial: number;
  resultados_nao: number;
  entregas_total: number;
  entregas_por_etapa: Record<number, number>;
  em_producao: number;
  com_resultado_medido: number;
};

export function contarSituacao(
  resultados: Pick<ResultadoEsperado, 'situacao'>[],
  situacao: SituacaoInterna,
): number {
  return resultados.filter((r) => r.situacao === situacao).length;
}

export function indicadoresDirecionamento(entrada: {
  prioridades: Pick<Prioridade, 'etapa'>[];
  resultadosEsperados: Pick<ResultadoEsperado, 'situacao'>[];
  entregas: Pick<Entregas['entregas'][number], 'etapa'>[];
}): IndicadoresDirecionamento {
  const entregasPorEtapa: Record<number, number> = {};
  for (const e of entrada.entregas) {
    entregasPorEtapa[e.etapa] = (entregasPorEtapa[e.etapa] ?? 0) + 1;
  }
  return {
    prioridades_total: entrada.prioridades.length,
    prioridades_em_curso: entrada.prioridades.filter((p) => p.etapa > 0).length,
    prioridades_concluidas: entrada.prioridades.filter((p) => p.etapa === 5).length,
    resultados_total: entrada.resultadosEsperados.length,
    resultados_atendido: contarSituacao(entrada.resultadosEsperados, 'atendido'),
    resultados_parcial: contarSituacao(entrada.resultadosEsperados, 'parcial'),
    resultados_nao: contarSituacao(entrada.resultadosEsperados, 'nao'),
    entregas_total: entrada.entregas.length,
    entregas_por_etapa: entregasPorEtapa,
    em_producao: entrada.entregas.filter((e) => e.etapa >= 4).length,
    com_resultado_medido: entrada.entregas.filter((e) => e.etapa === 5).length,
  };
}
