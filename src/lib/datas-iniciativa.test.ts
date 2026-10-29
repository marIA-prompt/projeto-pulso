import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dataParaMes, mesParaData, rotuloMesInicio } from './datas-iniciativa';

const sql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../supabase/migrations/0022_inicio_e_conclusao.sql'),
  'utf8',
);

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

caso('mês vira o dia 1 e a data volta para o input', () => {
  assert.equal(mesParaData('2026-10'), '2026-10-01');
  assert.equal(mesParaData(' 2026-01 '), '2026-01-01');
  assert.equal(dataParaMes('2026-10-26'), '2026-10');
  assert.equal(dataParaMes('2026-10-01'), '2026-10');
  assert.equal(rotuloMesInicio('2026-10-26'), 'Outubro de 2026');
  assert.equal(rotuloMesInicio(null), null);
});

caso('mês inválido não grava', () => {
  assert.equal(mesParaData(''), null);
  assert.equal(mesParaData('2026-13'), null);
  assert.equal(mesParaData('26/10/2026'), null);
  assert.equal(dataParaMes(null), '');
});

caso('a migration usa a data de criação e não mexe na conclusão real nem no semáforo', () => {
  assert.match(sql, /date_trunc\('month', timezone\('America\/Sao_Paulo', created_at\)\)::date/);
  assert.match(sql, /set start_date =/);
  assert.doesNotMatch(sql, /concluded_at\s*=/);
  assert.match(sql, /Data de conclusão prevista/);
  assert.match(sql, /new\.start_date\s+is distinct from old\.start_date/);
  assert.ok(sql.includes('disable trigger projects_touch'));
  assert.ok(sql.includes('disable trigger projects_bump_activity'));
  assert.ok(sql.includes('enable trigger projects_touch'));
  assert.ok(sql.includes('enable trigger projects_bump_activity'));
});

if (falhas) {
  console.error(`\n${falhas} falha(s)`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
