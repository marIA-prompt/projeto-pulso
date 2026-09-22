import assert from 'node:assert/strict';
import {
  ETAPAS_CADASTRO,
  destinoEtapaCadastro,
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

caso('o wizard não tem Avaliação técnica; Cadastro do projeto só entra com opt-in', () => {
  const ids = ETAPAS_CADASTRO.map((e) => e.id);
  assert.deepEqual(ids, ['dados', 'optin', 'cadastro', 'triagem', 'revisao']);
  assert.equal(ETAPAS_CADASTRO.length, 5);
  assert.ok(!ids.includes('tecnica' as never));
});

caso('sem opção, Continuar em Lei do Bem não sai da tela (o loop antigo)', () => {
  assert.deepEqual(etapasCadastroIniciativa('').map((e) => e.id), ['dados', 'optin']);
  assert.equal(proximaEtapaCadastro('optin', ''), 'optin');
});

caso('Sim, seguir para a triagem avança para o cadastro do projeto', () => {
  assert.equal(proximaEtapaCadastro('optin', 'sim'), 'cadastro');
  assert.deepEqual(
    etapasCadastroIniciativa('sim').map((e) => e.id),
    ['dados', 'optin', 'cadastro', 'triagem', 'revisao'],
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

caso('Continuar em cadastro do projeto vai para a triagem', () => {
  assert.equal(proximaEtapaCadastro('cadastro', 'sim'), 'triagem');
});

caso('pular Cadastro do projeto pela barra volta para o cadastro se o escopo está incompleto', () => {
  assert.equal(destinoEtapaCadastro('triagem', 'sim', false), 'cadastro');
  assert.equal(destinoEtapaCadastro('revisao', 'sim', false), 'cadastro');
  assert.equal(destinoEtapaCadastro('triagem', 'sim', true), 'triagem');
  assert.equal(destinoEtapaCadastro('revisao', 'sim', true), 'revisao');
  assert.equal(destinoEtapaCadastro('cadastro', 'sim', false), 'cadastro');
  assert.equal(destinoEtapaCadastro('optin', 'sim', false), 'optin');
});

caso('destino inexistente ou sem opt-in não inventa etapa', () => {
  assert.equal(destinoEtapaCadastro('triagem', '', false), 'dados');
  assert.equal(destinoEtapaCadastro('cadastro', 'nao', true), 'dados');
  assert.equal(destinoEtapaCadastro('revisao', 'nao', false), 'revisao');
});

caso('voltar a partir da triagem retorna ao cadastro do projeto', () => {
  assert.equal(etapaAnteriorCadastro('triagem', 'sim'), 'cadastro');
  assert.equal(etapaAnteriorCadastro('cadastro', 'sim'), 'optin');
  assert.equal(etapaAnteriorCadastro('revisao', 'nao'), 'optin');
  assert.equal(etapaAnteriorCadastro('dados', ''), 'dados');
});

if (falhas) {
  console.error(`\n${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
