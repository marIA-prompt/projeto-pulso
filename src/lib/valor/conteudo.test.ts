import assert from 'node:assert/strict';
import { carregarConteudo, conteudoPainel, resultadoInterno } from './conteudo';
import {
  Meta,
  ResultadosEsperadosJson,
  SITUACAO_DE,
  Solucoes,
  validarJson,
} from './schemas';
import metaBruto from '../../../content/painel-de-valor/meta.json';
import normalizacaoBruto from '../../../content/painel-de-valor/normalizacao.json';
import solucoesBruto from '../../../content/painel-de-valor/solucoes.json';
import gestaoBruto from '../../../content/painel-de-valor/gestao.json';
import prioridadesBruto from '../../../content/painel-de-valor/prioridades.json';
import resultadosBruto from '../../../content/painel-de-valor/resultados-esperados.json';
import entregasBruto from '../../../content/painel-de-valor/entregas.json';
import usoIaBruto from '../../../content/painel-de-valor/uso-ia.json';

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

const brutoValido = {
  meta: metaBruto,
  normalizacao: normalizacaoBruto,
  solucoes: solucoesBruto,
  gestao: gestaoBruto,
  prioridades: prioridadesBruto,
  resultados: resultadosBruto,
  entregas: entregasBruto,
  usoIa: usoIaBruto,
};

caso('carrega e valida todos os JSON editoriais', () => {
  assert.equal(conteudoPainel.meta.data_base, '2026-10-06');
  assert.equal(conteudoPainel.solucoes.length, 9);
  assert.equal(conteudoPainel.prioridades.length, 7);
  assert.equal(conteudoPainel.resultadosEsperados.length, 9);
  assert.equal(conteudoPainel.entregas.entregas.length, 16);
  assert.equal(conteudoPainel.usoIa.contas, 12);
  assert.equal(conteudoPainel.usoIa.contas_com_uso, 11);
  assert.deepEqual(carregarConteudo(brutoValido).meta, conteudoPainel.meta);
});

caso('converte situacao do JSON para a forma interna', () => {
  assert.deepEqual(SITUACAO_DE, {
    Atendido: 'atendido',
    Parcial: 'parcial',
    Não: 'nao',
  });
  assert.equal(resultadoInterno({
    ordem: 1, resultado: 'x', situacao: 'Atendido', nota: 'n',
  }).situacao, 'atendido');
  const porSituacao = Object.fromEntries(
    ['atendido', 'parcial', 'nao'].map((s) => [
      s,
      conteudoPainel.resultadosEsperados.filter((r) => r.situacao === s).length,
    ]),
  );
  assert.deepEqual(porSituacao, { atendido: 1, parcial: 5, nao: 3 });
  assert.ok(conteudoPainel.resultadosEsperados.every(
    (r) => r.situacao === 'atendido' || r.situacao === 'parcial' || r.situacao === 'nao',
  ));
});

caso('pendente_de_confirmacao não entra nos mapas de normalização', () => {
  assert.equal('pendente_de_confirmacao' in conteudoPainel.normalizacao, false);
  assert.equal(conteudoPainel.normalizacao.diretoria.Jackeline, 'Jacqueline Pereira');
  assert.equal(conteudoPainel.normalizacao.diretoria[''], 'Não informado');
  assert.equal(conteudoPainel.normalizacao.tema[''], 'Sem tema');
});

caso('JSON propositalmente quebrado faz o schema falhar', () => {
  assert.throws(
    () => validarJson('meta.json', Meta, { ...metaBruto, data_base: '06/10/2026' }),
    /meta\.json inválido/,
  );
  assert.throws(
    () => validarJson('resultados-esperados.json', ResultadosEsperadosJson, [
      { ordem: 1, resultado: 'x', situacao: 'parcial', nota: 'n' },
    ]),
    /resultados-esperados\.json inválido/,
  );
  assert.throws(
    () => validarJson('solucoes.json', Solucoes, [
      { ...solucoesBruto[0], grupo: 'em-breve' },
    ]),
    /solucoes\.json inválido/,
  );
  assert.throws(
    () => carregarConteudo({
      ...brutoValido,
      entregas: {
        ...entregasBruto,
        entregas: [{ ...entregasBruto.entregas[0], frente: 'inexistente' }],
      },
    }),
    /entregas\.json inválido.*frente desconhecida/,
  );
  assert.throws(
    () => carregarConteudo({ ...brutoValido, meta: { ciclos: 'x' } }),
    /meta\.json inválido/,
  );
});

if (falhas) {
  console.error(`\n${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
