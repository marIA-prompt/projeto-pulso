import assert from 'node:assert/strict';
import {
  classificarTriagem,
  TRIAGEM_CAMPOS,
  TRIAGEM_ITENS,
  SINTESSE_PENDENTE,
  SINTESSE_INSUFICIENTE,
  SINTESSE_SEM_BLOQUEIO,
  PROXIMA_ACAO,
  type LeiDoBemResposta,
  type RespostasTriagem,
} from './lei-do-bem';

function preencher(valor: LeiDoBemResposta | Record<string, LeiDoBemResposta>): RespostasTriagem {
  if (typeof valor === 'string') {
    const r: RespostasTriagem = {};
    for (const c of TRIAGEM_CAMPOS) r[c] = valor;
    return r;
  }
  const r: RespostasTriagem = {};
  for (const c of TRIAGEM_CAMPOS) r[c] = 'sim';
  return { ...r, ...valor };
}

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

caso('todas Sim → potencialmente elegível, índice 1.00', () => {
  const r = classificarTriagem(preencher('sim'));
  assert.equal(r.classificacao, 'potencialmente_elegivel');
  assert.equal(r.indice, 1);
  assert.equal(r.sintese, SINTESSE_SEM_BLOQUEIO);
  assert.equal(r.proximaAcao, PROXIMA_ACAO.potencialmente_elegivel);
});

caso('todas Parcialmente → potencial parcial, índice 0.50', () => {
  const r = classificarTriagem(preencher('parcialmente'));
  assert.equal(r.classificacao, 'potencial_parcial');
  assert.equal(r.indice, 0.5);
  assert.equal(r.sintese, SINTESSE_SEM_BLOQUEIO);
});

caso('bloqueio duro em Não (item 5) mesmo com o resto Sim → baixo potencial', () => {
  const r = classificarTriagem(preencher({ triagem_05: 'nao' }));
  assert.equal(r.classificacao, 'baixo_potencial');
  assert.equal(r.indice, 0.92);
  assert.ok(r.sintese.includes('Incerteza técnica não demonstrada.'));
  assert.equal(r.proximaAcao, PROXIMA_ACAO.baixo_potencial);
});

caso('bloqueio duro item 11 → frase da planilha', () => {
  const r = classificarTriagem(preencher({ triagem_11: 'nao' }));
  assert.equal(r.classificacao, 'baixo_potencial');
  assert.ok(r.sintese.includes('O projeto aparenta limitar-se a solução pronta.'));
});

caso('uma resposta Não sei → informações insuficientes', () => {
  const r = classificarTriagem(preencher({ triagem_02: 'nao_sei' }));
  assert.equal(r.classificacao, 'informacoes_insuficientes');
  assert.equal(r.sintese, SINTESSE_INSUFICIENTE);
  assert.equal(r.proximaAcao, PROXIMA_ACAO.informacoes_insuficientes);
  assert.ok(r.indice != null);
});

caso('Não sei tem precedência sobre bloqueio duro', () => {
  const r = classificarTriagem(preencher({ triagem_05: 'nao', triagem_12: 'nao_sei' }));
  assert.equal(r.classificacao, 'informacoes_insuficientes');
});

caso('menos de 12 respostas → pendente, índice nulo', () => {
  const r = classificarTriagem({ triagem_01: 'sim', triagem_02: 'sim' });
  assert.equal(r.classificacao, 'pendente');
  assert.equal(r.indice, null);
  assert.equal(r.sintese, SINTESSE_PENDENTE);
  assert.equal(r.proximaAcao, PROXIMA_ACAO.pendente);
});

caso('vazio → pendente', () => {
  const r = classificarTriagem({});
  assert.equal(r.classificacao, 'pendente');
  assert.equal(r.indice, null);
});

caso('Não em item sem bloqueio duro não derruba elegibilidade se índice ≥ 0,75', () => {
  const r = classificarTriagem(preencher({ triagem_01: 'nao' }));
  assert.equal(r.classificacao, 'potencialmente_elegivel');
  assert.equal(r.indice, 0.92);
  assert.ok(r.sintese.includes('Vínculo estratégico'));
});

caso('índice < 0,5 sem bloqueio duro → baixo potencial', () => {
  // 5 Não (itens 1,2,7,8,12 — sem bloqueio) + 7 Parcialmente
  const r = classificarTriagem(preencher({
    triagem_01: 'nao',
    triagem_02: 'nao',
    triagem_03: 'parcialmente',
    triagem_04: 'parcialmente',
    triagem_05: 'parcialmente',
    triagem_06: 'parcialmente',
    triagem_07: 'nao',
    triagem_08: 'nao',
    triagem_09: 'parcialmente',
    triagem_10: 'parcialmente',
    triagem_11: 'parcialmente',
    triagem_12: 'nao',
  }));
  assert.equal(r.indice, 0.29);
  assert.equal(r.classificacao, 'baixo_potencial');
});

caso('fronteira 0,75: 9 Sim + 3 Parcialmente = 0,875 → elegível', () => {
  const r = classificarTriagem(preencher({
    triagem_10: 'parcialmente',
    triagem_11: 'parcialmente',
    triagem_12: 'parcialmente',
  }));
  assert.equal(r.indice, 0.88); // 21/24 = 0.875 → 0.88
  assert.equal(r.classificacao, 'potencialmente_elegivel');
});

caso('fronteira exata 9 Sim + 0 Parcial + 3 Não (sem bloqueio) = 18/24 = 0,75', () => {
  const r = classificarTriagem(preencher({
    triagem_01: 'nao',
    triagem_02: 'nao',
    triagem_12: 'nao',
  }));
  assert.equal(r.indice, 0.75);
  assert.equal(r.classificacao, 'potencialmente_elegivel');
});

caso('síntese concatena Não na ordem 1→12', () => {
  const r = classificarTriagem(preencher({
    triagem_05: 'nao',
    triagem_11: 'nao',
    triagem_01: 'nao',
  }));
  const i1 = r.sintese.indexOf('Vínculo estratégico');
  const i5 = r.sintese.indexOf('Incerteza técnica não demonstrada.');
  const i11 = r.sintese.indexOf('O projeto aparenta limitar-se a solução pronta.');
  assert.ok(i1 >= 0 && i5 > i1 && i11 > i5);
});

caso('os 7 itens de bloqueio duro são 3,4,5,6,9,10,11', () => {
  const duros = TRIAGEM_ITENS.filter((i) => i.bloqueioDuro).map((i) => i.n);
  assert.deepEqual(duros, [3, 4, 5, 6, 9, 10, 11]);
});

caso('cada item de bloqueio duro em Não sozinho classifica baixo potencial', () => {
  for (const item of TRIAGEM_ITENS.filter((i) => i.bloqueioDuro)) {
    const r = classificarTriagem(preencher({ [item.campo]: 'nao' }));
    assert.equal(r.classificacao, 'baixo_potencial', `item ${item.n}`);
  }
});

if (falhas) {
  console.error(`\n${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
