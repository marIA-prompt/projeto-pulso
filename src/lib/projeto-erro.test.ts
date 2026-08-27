import assert from 'node:assert/strict';
import {
  eGateEstagio,
  mensagemErroCriarProjeto,
  mensagemErroMoverEstagio,
  mensagemErroSalvarProjeto,
} from './projeto-erro';

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

caso('reconhece a recusa do gate de Em Desenvolvimento', () => {
  assert.equal(
    eGateEstagio('Pontue os 4 eixos da Matriz de Priorização antes de mover para Em Desenvolvimento.'),
    true,
  );
  assert.equal(
    eGateEstagio('Score 2.40 está abaixo do mínimo de 3,0 exigido pelo gate da Metodologia Executiva.'),
    true,
  );
  assert.equal(eGateEstagio('duplicate key'), false);
  assert.equal(eGateEstagio(undefined), false);
});

caso('salvar aponta o campo Estágio, não uma mensagem genérica', () => {
  const msg = mensagemErroSalvarProjeto({
    message: 'Pontue os 4 eixos da Matriz de Priorização antes de mover para Em Desenvolvimento.',
  });
  assert.ok(msg.includes('Estágio no pipeline'));
  assert.ok(msg.includes('Em Desenvolvimento'));
  assert.equal(mensagemErroSalvarProjeto({ message: 'boom' }), 'Não foi possível salvar as alterações.');
});

caso('criar e mover usam o mesmo diagnóstico de campo', () => {
  const gate = { message: 'Pontue os 4 eixos da Matriz de Priorização.' };
  assert.ok(mensagemErroCriarProjeto(gate).includes('Estágio no pipeline'));
  assert.ok(mensagemErroMoverEstagio(gate).includes('Em Desenvolvimento'));
});

if (falhas) {
  console.error(`\n${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
