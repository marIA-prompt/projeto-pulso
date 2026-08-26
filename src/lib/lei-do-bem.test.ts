import assert from 'node:assert/strict';
import test from 'node:test';
import { classificarTriagem, type LeiDoBemResposta } from './lei-do-bem';

const todas = (resposta: LeiDoBemResposta): Array<LeiDoBemResposta | null> => (
  Array<LeiDoBemResposta | null>(12).fill(resposta)
);

test('todas Sim resultam em potencialmente elegível e índice 1', () => {
  const resultado = classificarTriagem(todas('sim'));
  assert.equal(resultado.classificacao, 'potencialmente_elegivel');
  assert.equal(resultado.indice, 1);
});

test('um Não em bloqueio duro prevalece sobre índice alto', () => {
  const respostas = todas('sim');
  respostas[4] = 'nao';
  const resultado = classificarTriagem(respostas);
  assert.equal(resultado.classificacao, 'baixo_potencial');
  assert.equal(resultado.indice, 22 / 24);
  assert.match(resultado.sintese, /Incerteza técnica não demonstrada/);
});

test('uma resposta Não sei resulta em informações insuficientes', () => {
  const respostas = todas('sim');
  respostas[1] = 'nao_sei';
  const resultado = classificarTriagem(respostas);
  assert.equal(resultado.classificacao, 'informacoes_insuficientes');
  assert.equal(resultado.indice, 22 / 24);
});

test('menos de 12 respostas resulta em pendente e índice nulo', () => {
  const respostas = todas('sim');
  respostas[11] = null;
  const resultado = classificarTriagem(respostas);
  assert.equal(resultado.classificacao, 'pendente');
  assert.equal(resultado.indice, null);
});

test('índice entre 0,5 e 0,75 sem bloqueio duro resulta em potencial parcial', () => {
  const respostas = todas('parcialmente');
  const resultado = classificarTriagem(respostas);
  assert.equal(resultado.classificacao, 'potencial_parcial');
  assert.equal(resultado.indice, 0.5);
});
