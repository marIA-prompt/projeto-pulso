import assert from 'node:assert/strict';
import { linksDaNav } from './nav';
import { hasRoleAtLeast, PAPEIS, type Role } from './types';

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

function hrefs(papel: Role) {
  return linksDaNav({
    isGerencial: hasRoleAtLeast(papel, 'gerencial'),
    isAdmin: papel === 'administrador',
  }).map((l) => l.href);
}

caso('leitor, participante e editor não veem Rankings, Lei do Bem nem Admin', () => {
  for (const papel of ['leitor', 'participante', 'editor'] as const) {
    const h = hrefs(papel);
    assert.ok(!h.includes('/rankings'), papel);
    assert.ok(!h.includes('/lei-do-bem'), papel);
    assert.ok(!h.includes('/admin'), papel);
    assert.ok(h.includes('/projetos'), papel);
  }
});

caso('gerencial vê Rankings e Lei do Bem e não vê Relatórios nem Admin', () => {
  const h = hrefs('gerencial');
  assert.ok(h.includes('/rankings'));
  assert.ok(!h.includes('/relatorios'));
  assert.ok(h.includes('/lei-do-bem'));
  assert.ok(!h.includes('/admin'));
  const iDash = h.indexOf('/dashboard');
  const iRank = h.indexOf('/rankings');
  const iIniciativas = h.indexOf('/projetos');
  const iLei = h.indexOf('/lei-do-bem');
  const iComunidade = h.indexOf('/comunidade');
  assert.ok(iDash < iRank && iRank < iIniciativas && iIniciativas < iLei && iLei < iComunidade);
});

caso('leitor, participante, editor e gerencial não veem Relatórios', () => {
  for (const papel of ['leitor', 'participante', 'editor', 'gerencial'] as const) {
    assert.ok(!hrefs(papel).includes('/relatorios'), papel);
  }
});

caso('administrador vê Rankings, Relatórios, Lei do Bem e Admin', () => {
  const h = hrefs('administrador');
  assert.ok(h.includes('/rankings'));
  assert.ok(h.includes('/relatorios'));
  assert.ok(h.includes('/lei-do-bem'));
  assert.ok(h.includes('/admin'));
  const iRank = h.indexOf('/rankings');
  const iRel = h.indexOf('/relatorios');
  const iIniciativas = h.indexOf('/projetos');
  assert.ok(iRank < iRel && iRel < iIniciativas);
});

caso('os cinco papéis cobrem o gate gerencial+', () => {
  assert.deepEqual(PAPEIS, ['leitor', 'participante', 'editor', 'gerencial', 'administrador']);
  assert.equal(hasRoleAtLeast('editor', 'gerencial'), false);
  assert.equal(hasRoleAtLeast('gerencial', 'gerencial'), true);
  assert.equal(hasRoleAtLeast('administrador', 'gerencial'), true);
});

if (falhas) {
  console.error(`\n${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
