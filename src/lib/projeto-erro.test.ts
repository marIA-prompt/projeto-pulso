import assert from 'node:assert/strict';
import {
  eColunaAusente,
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

caso('reconhece coluna nova ausente no schema cache', () => {
  assert.equal(
    eColunaAusente("Could not find the 'objetivo_contexto' column of 'projects' in the schema cache"),
    true,
  );
  assert.equal(eColunaAusente('duplicate key'), false);
});

caso('criar aponta Estágio quando o gate da Matriz ainda dispara', () => {
  const msg = mensagemErroCriarProjeto({
    message: 'Pontue os 4 eixos da Matriz de Priorização antes de mover para Em Desenvolvimento.',
  });
  assert.ok(msg.includes('Estágio no pipeline'));
  assert.ok(msg.includes('Em Desenvolvimento'));
  assert.equal(
    mensagemErroCriarProjeto({ message: 'boom' }),
    'Não foi possível salvar a iniciativa. Revise os campos e tente de novo.',
  );
});

caso('criar aponta migration quando falta coluna nova', () => {
  const msg = mensagemErroCriarProjeto({
    message: "Could not find the 'uses_ai_tradicional' column of 'projects' in the schema cache",
  });
  assert.ok(msg.includes('migrations'));
});

caso('salvar e mover usam o mesmo diagnóstico de gate', () => {
  const gate = { message: 'Pontue os 4 eixos da Matriz de Priorização.', details: '' };
  assert.ok(mensagemErroSalvarProjeto(gate).includes('Estágio no pipeline'));
  assert.ok(mensagemErroMoverEstagio(gate).includes('Estágio no pipeline'));
});

if (falhas) {
  console.error(`\n${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
