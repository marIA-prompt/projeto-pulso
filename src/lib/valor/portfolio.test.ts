import assert from 'node:assert/strict';
import iniciativasBruto from '../../../tests/fixtures/painel-de-valor/iniciativas-2026-10-06.json';
import esperado from '../../../tests/fixtures/painel-de-valor/esperado-2026-10-06.json';
import { conteudoPainel } from './conteudo';
import { indicadoresDirecionamento } from './direcionamento';
import {
  aplicarApelido,
  normalizarIniciativa,
  normalizarIniciativas,
  type IniciativaBruta,
} from './iniciativas';
import { indicadoresPortfolio } from './portfolio';

let falhas = 0;
function caso(nome: string, fn: () => void) {
  try {
    fn();
    console.log(`ok  ${nome}`);
  } catch (err) {
    falhas += 1;
    console.error(`FAIL ${nome}`);
    console.error(err);
  }
}

const mapas = conteudoPainel.normalizacao;
const premissas = {
  custo_hora: conteudoPainel.meta.premissas.custo_hora_padrao_brl,
  horas_mes_por_pessoa: conteudoPainel.meta.premissas.horas_mes_por_pessoa,
};

const lista = normalizarIniciativas(iniciativasBruto as IniciativaBruta[], mapas);
const calc = indicadoresPortfolio(lista, premissas);

caso('fixture 06/10: cada valor do esperado bate com o calculado', () => {
  const pares: [string, unknown, unknown][] = [
    ['total', esperado.total, calc.total],
    ['por_estagio', esperado.por_estagio, calc.por_estagio],
    ['ativas', esperado.ativas, calc.ativas],
    ['horas_devolvidas_mes', esperado.horas_devolvidas_mes, calc.horas_devolvidas_mes],
    ['horas_portfolio_mes', esperado.horas_portfolio_mes, calc.horas_portfolio_mes],
    ['horas_a_capturar_mes', esperado.horas_a_capturar_mes, calc.horas_a_capturar_mes],
    ['pct_horas_capturadas', esperado.pct_horas_capturadas, calc.pct_horas_capturadas],
    ['horas_devolvidas_ano', esperado.horas_devolvidas_ano, calc.horas_devolvidas_ano],
    ['pessoas_equivalentes', esperado.pessoas_equivalentes, calc.pessoas_equivalentes],
    ['concluidas_com_horas', esperado.concluidas_com_horas, calc.concluidas_com_horas],
    ['concluidas_sem_horas', esperado.concluidas_sem_horas, calc.concluidas_sem_horas],
    ['com_horas_informadas', esperado.com_horas_informadas, calc.com_horas_informadas],
    ['top5_horas', esperado.top5_horas, calc.top5_horas],
    ['pct_top5', esperado.pct_top5, calc.pct_top5],
    ['usa_ia', esperado.usa_ia, calc.usa_ia],
    ['usa_n8n', esperado.usa_n8n, calc.usa_n8n],
    ['novas_desde_lancamento', esperado.novas_desde_lancamento, calc.novas_desde_lancamento],
    ['novas_concluidas', esperado.novas_concluidas, calc.novas_concluidas],
    ['horas_novas_concluidas', esperado.horas_novas_concluidas, calc.horas_novas_concluidas],
    ['horas_por_tema_concluidas', esperado.horas_por_tema_concluidas, calc.horas_por_tema_concluidas],
    ['simulador.mes', esperado.simulador_custo_hora_50.mes, calc.simulador_custo_hora_50.mes],
    ['simulador.ano', esperado.simulador_custo_hora_50.ano, calc.simulador_custo_hora_50.ano],
    ['simulador.a_capturar_ano', esperado.simulador_custo_hora_50.a_capturar_ano, calc.simulador_custo_hora_50.a_capturar_ano],
  ];
  const linhas: string[] = [];
  for (const [nome, exp, obt] of pares) {
    linhas.push(`${nome}: esperado=${JSON.stringify(exp)} calculado=${JSON.stringify(obt)}`);
    assert.deepEqual(obt, exp, nome);
  }
  console.log(linhas.join('\n'));
});

caso('ativas segue a definição do Pulso (fora de concluido e cancelado)', () => {
  const comBacklog: IniciativaBruta[] = [
    ...(iniciativasBruto as IniciativaBruta[]),
    {
      title: 'Backlog extra',
      stage: 'backlog',
      theme: 'Sem tema',
      directorate: 'Não informado',
      uses_ai: false,
      uses_n8n: false,
      hours_saved_month: null,
      is_legacy_import: false,
    },
  ];
  const n = indicadoresPortfolio(normalizarIniciativas(comBacklog, mapas), premissas);
  assert.equal(n.ativas, esperado.ativas + 1);
  assert.equal(n.total, esperado.total + 1);
});

caso('apelidos de diretoria e tema; nulo vira o apelido de string vazia', () => {
  assert.equal(aplicarApelido('Jaqueline', mapas.diretoria), 'Jacqueline Pereira');
  assert.equal(aplicarApelido('Jackeline', mapas.diretoria), 'Jacqueline Pereira');
  assert.equal(aplicarApelido('Bruno', mapas.diretoria), 'Bruno Capobianco');
  assert.equal(aplicarApelido('Mauricio Rodrigues', mapas.diretoria), 'Maurício Rodrigues');
  assert.equal(aplicarApelido('CONTROLADORIA', mapas.diretoria), 'Controladoria');
  assert.equal(aplicarApelido('', mapas.diretoria), 'Não informado');
  assert.equal(aplicarApelido(null, mapas.diretoria), 'Não informado');
  assert.equal(aplicarApelido(undefined, mapas.diretoria), 'Não informado');
  assert.equal(
    aplicarApelido('Eficiência Operacional / Automação de Preocessos', mapas.tema),
    'Eficiência Operacional',
  );
  assert.equal(aplicarApelido('', mapas.tema), 'Sem tema');
  assert.equal(aplicarApelido(null, mapas.tema), 'Sem tema');
  assert.equal(aplicarApelido('Tema desconhecido', mapas.tema), 'Tema desconhecido');
  assert.equal(aplicarApelido('Bruno Capobianco', mapas.diretoria), 'Bruno Capobianco');
});

caso('pendente_de_confirmacao não entra na lógica de apelidos', () => {
  assert.equal('pendente_de_confirmacao' in mapas, false);
  const n = normalizarIniciativa({
    title: 'x',
    stage: 'ideia',
    theme: 'Eficiência Operacional / Automação de Preocessos',
    directorate: 'Jackeline',
    uses_ai: false,
    uses_n8n: false,
    hours_saved_month: null,
    is_legacy_import: false,
  }, mapas);
  assert.equal(n.directorate, 'Jacqueline Pereira');
  assert.equal(n.theme, 'Eficiência Operacional');
  assert.equal(n.stage, 'ideia');
});

caso('zero informado conta; nulo não conta como horas', () => {
  const base: IniciativaBruta = {
    title: 'a',
    stage: 'concluido',
    theme: 'Sem tema',
    directorate: 'Não informado',
    uses_ai: false,
    uses_n8n: false,
    hours_saved_month: 0,
    is_legacy_import: true,
  };
  const comZero = indicadoresPortfolio(normalizarIniciativas([base], mapas), premissas);
  const semHora = indicadoresPortfolio(
    normalizarIniciativas([{ ...base, hours_saved_month: null }], mapas),
    premissas,
  );
  assert.equal(comZero.com_horas_informadas, 1);
  assert.equal(comZero.horas_devolvidas_mes, 0);
  assert.equal(semHora.com_horas_informadas, 0);
  assert.equal(semHora.concluidas_sem_horas, 1);
});

caso('direcionamento: prioridades, resultados e régua', () => {
  const d = indicadoresDirecionamento({
    prioridades: conteudoPainel.prioridades,
    resultadosEsperados: conteudoPainel.resultadosEsperados,
    entregas: conteudoPainel.entregas.entregas,
  });
  assert.equal(d.prioridades_total, 7);
  assert.equal(d.prioridades_em_curso, 5);
  assert.equal(d.prioridades_concluidas, 0);
  assert.equal(d.resultados_total, 9);
  assert.equal(d.resultados_atendido, 1);
  assert.equal(d.resultados_parcial, 5);
  assert.equal(d.resultados_nao, 3);
  assert.equal(d.entregas_total, 16);
  assert.equal(d.em_producao, 5);
  assert.equal(d.com_resultado_medido, 0);
});

if (falhas) {
  console.error(`\n${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
