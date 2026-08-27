import assert from 'node:assert/strict';
import {
  ETAPAS_CADASTRO,
  etapaAnteriorCadastro,
  etapasCadastroIniciativa,
  proximaEtapaCadastro,
} from './cadastro-iniciativa';

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

caso('o wizard não tem Cadastro do projeto nem Avaliação técnica', () => {
  const ids = ETAPAS_CADASTRO.map((e) => e.id);
  assert.deepEqual(ids, ['dados', 'optin', 'triagem', 'revisao']);
  assert.equal(ETAPAS_CADASTRO.length, 4);
});

caso('sem opção, Continuar em Lei do Bem não sai da tela (o loop antigo)', () => {
  assert.deepEqual(etapasCadastroIniciativa('').map((e) => e.id), ['dados', 'optin']);
  assert.equal(proximaEtapaCadastro('optin', ''), 'optin');
});

caso('Sim, seguir para a triagem avança para a triagem preliminar', () => {
  assert.equal(proximaEtapaCadastro('optin', 'sim'), 'triagem');
  assert.deepEqual(
    etapasCadastroIniciativa('sim').map((e) => e.id),
    ['dados', 'optin', 'triagem', 'revisao'],
  );
});

caso('Não, só cadastrar avança para a revisão', () => {
  assert.equal(proximaEtapaCadastro('optin', 'nao'), 'revisao');
  assert.deepEqual(
    etapasCadastroIniciativa('nao').map((e) => e.id),
    ['dados', 'optin', 'revisao'],
  );
});

caso('Continuar em Dados vai para Lei do Bem', () => {
  assert.equal(proximaEtapaCadastro('dados', ''), 'optin');
  assert.equal(proximaEtapaCadastro('dados', 'sim'), 'optin');
});

caso('voltar a partir da triagem retorna à Lei do Bem', () => {
  assert.equal(etapaAnteriorCadastro('triagem', 'sim'), 'optin');
  assert.equal(etapaAnteriorCadastro('revisao', 'nao'), 'optin');
  assert.equal(etapaAnteriorCadastro('dados', ''), 'dados');
});

if (falhas) {
  console.error(`\n${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
