import assert from 'node:assert/strict';
import { TEXTO_DUVIDAS } from './match-solucoes';
import { DUVIDAS_FREQUENTES } from './faq-pulso';

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

caso('o FAQ cobre acesso, iniciativa, match, reunião e Lei do Bem', () => {
  const texto = DUVIDAS_FREQUENTES.map((d) => `${d.pergunta} ${d.resposta}`).join(' ').toLowerCase();
  for (const termo of ['convite', 'iniciativa', 'match', 'reunião', 'lei do bem', '14 dias']) {
    assert.ok(texto.includes(termo), termo);
  }
  assert.ok(DUVIDAS_FREQUENTES.length >= 6);
  for (const d of DUVIDAS_FREQUENTES) {
    assert.ok(d.pergunta.trim().length > 8);
    assert.ok(d.resposta.trim().length > 20);
  }
});

caso('dúvida fora da lista vai para a Gerência de IA', () => {
  const ultima = DUVIDAS_FREQUENTES[DUVIDAS_FREQUENTES.length - 1];
  assert.equal(ultima.resposta, TEXTO_DUVIDAS);
});

if (falhas) {
  console.error(`\n${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
