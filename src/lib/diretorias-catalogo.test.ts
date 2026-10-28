import assert from 'node:assert/strict';
import { DIRETORIAS_CADASTRO, nomesDiretoria, opcoesDiretoria } from './diretorias-catalogo';

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

caso('sem linhas no banco, o menu traz as 14 diretorias', () => {
  const lista: string[] = nomesDiretoria([]);
  assert.equal(lista.includes('Área Diretora de Vendas Varejo Expansão'), false);
  assert.deepEqual(lista, [...DIRETORIAS_CADASTRO]);
  assert.equal(lista.length, 14);
  assert.equal(lista[0], 'Área Vendas Varejo Expansão');
  assert.ok(lista.includes('Área de Seguros'));
  assert.ok(lista.includes('Área de RH'));
});

caso('o banco manda na ordem e sem nome repetido', () => {
  assert.deepEqual(nomesDiretoria([' Área de RH ', 'Área de RH', 'Área de Seguros']), [
    'Área de RH',
    'Área de Seguros',
  ]);
});

caso('texto antigo fora da lista continua selecionável na edição', () => {
  const opcoes = opcoesDiretoria(['Área de RH'], 'Diretoria TI');
  assert.deepEqual(opcoes, ['Área de RH', 'Diretoria TI']);
  assert.deepEqual(opcoesDiretoria(['Área de RH'], '  Área de RH  '), ['Área de RH']);
  assert.deepEqual(opcoesDiretoria(['Área de RH'], '   '), ['Área de RH']);
});

if (falhas) {
  console.error(`\n${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
