/**
 * Carrega e valida os JSON editoriais do Painel de Valor.
 * O parse do Zod corre na carga do módulo: JSON inválido derruba o import
 * (e, com `prebuild`, o `next build`).
 */
import metaBruto from '../../../content/painel-de-valor/meta.json';
import normalizacaoBruto from '../../../content/painel-de-valor/normalizacao.json';
import solucoesBruto from '../../../content/painel-de-valor/solucoes.json';
import gestaoBruto from '../../../content/painel-de-valor/gestao.json';
import prioridadesBruto from '../../../content/painel-de-valor/prioridades.json';
import resultadosBruto from '../../../content/painel-de-valor/resultados-esperados.json';
import entregasBruto from '../../../content/painel-de-valor/entregas.json';
import usoIaBruto from '../../../content/painel-de-valor/uso-ia.json';
import {
  Entregas,
  Gestao,
  Meta,
  Normalizacao,
  Prioridades,
  ResultadosEsperadosJson,
  SITUACAO_DE,
  Solucoes,
  UsoIa,
  validarJson,
  type MapasNormalizacao,
  type Meta as MetaTipo,
  type Gestao as GestaoTipo,
  type Prioridade,
  type ResultadoEsperadoJson,
  type SituacaoInterna,
  type Solucao,
  type Entregas as EntregasTipo,
  type UsoIa as UsoIaTipo,
} from './schemas';

export type ResultadoEsperado = Omit<ResultadoEsperadoJson, 'situacao'> & {
  situacao: SituacaoInterna;
};

export type ConteudoPainel = {
  meta: MetaTipo;
  normalizacao: MapasNormalizacao;
  solucoes: Solucao[];
  gestao: GestaoTipo;
  prioridades: Prioridade[];
  resultadosEsperados: ResultadoEsperado[];
  entregas: EntregasTipo;
  usoIa: UsoIaTipo;
};

export function resultadoInterno(r: ResultadoEsperadoJson): ResultadoEsperado {
  return { ...r, situacao: SITUACAO_DE[r.situacao] };
}

/** Usado pelos testes para validar um conjunto bruto sem reler o disco. */
export function carregarConteudo(bruto: {
  meta: unknown;
  normalizacao: unknown;
  solucoes: unknown;
  gestao: unknown;
  prioridades: unknown;
  resultados: unknown;
  entregas: unknown;
  usoIa: unknown;
}): ConteudoPainel {
  const normalizacao = validarJson('normalizacao.json', Normalizacao, bruto.normalizacao);
  return {
    meta: validarJson('meta.json', Meta, bruto.meta),
    normalizacao: {
      diretoria: normalizacao.diretoria,
      tema: normalizacao.tema,
      estagio: normalizacao.estagio,
    },
    solucoes: validarJson('solucoes.json', Solucoes, bruto.solucoes),
    gestao: validarJson('gestao.json', Gestao, bruto.gestao),
    prioridades: validarJson('prioridades.json', Prioridades, bruto.prioridades),
    resultadosEsperados: validarJson(
      'resultados-esperados.json',
      ResultadosEsperadosJson,
      bruto.resultados,
    ).map(resultadoInterno),
    entregas: validarJson('entregas.json', Entregas, bruto.entregas),
    usoIa: validarJson('uso-ia.json', UsoIa, bruto.usoIa),
  };
}

export const conteudoPainel = carregarConteudo({
  meta: metaBruto,
  normalizacao: normalizacaoBruto,
  solucoes: solucoesBruto,
  gestao: gestaoBruto,
  prioridades: prioridadesBruto,
  resultados: resultadosBruto,
  entregas: entregasBruto,
  usoIa: usoIaBruto,
});
