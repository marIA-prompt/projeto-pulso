import assert from 'node:assert/strict';
import {
  TEXTO_CONSULTA_CURTA,
  TEXTO_DUVIDAS,
  TEXTO_SEM_MATCH,
  consultaCurta,
  hrefCadastrarDoMatch,
  registroPulsenff,
  resultadoDoRegistro,
  problemaNormalizado,
  resumoIniciativa,
  textoVarredura,
  varrerIniciativas,
  type IniciativaParaMatch,
} from './match-solucoes';

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

function iniciativa(parcial: Partial<IniciativaParaMatch> & Pick<IniciativaParaMatch, 'id' | 'title'>): IniciativaParaMatch {
  return {
    stage: 'em_desenvolvimento',
    theme: null,
    area_name: null,
    directorate: null,
    description: null,
    objetivo_contexto: null,
    tools: null,
    notes: null,
    owner_name: null,
    ...parcial,
  };
}

const cobranca = iniciativa({
  id: 'cob',
  title: 'Cobrança automática de faturas',
  theme: 'Financeiro',
  area_name: 'Contas a receber',
  description: 'Boletos em atraso no financeiro, sem fila única de cobrança.',
  owner_name: 'Ana',
});

const fornecedor = iniciativa({
  id: 'for',
  title: 'Portal de fornecedores',
  description: 'Cadastro de novos fornecedores e documentos do contrato.',
  area_name: 'Compras',
  owner_name: 'Bruno',
});

const frota = iniciativa({
  id: 'fro',
  title: 'Controle de frota',
  description: 'Quilometragem e manutenção dos veículos.',
  area_name: 'Frota',
});

caso('consulta curta não varre a base', () => {
  assert.equal(consultaCurta('ajuda'), true);
  assert.equal(varrerIniciativas('ajuda', [cobranca]).tipo, 'curto');
  assert.equal(varrerIniciativas('oi', [cobranca]).tipo, 'curto');
  assert.equal(consultaCurta('Precisamos automatizar a cobrança das faturas'), false);
});

caso('frase genérica não casa com cobrança', () => {
  const r = varrerIniciativas('o sistema não funciona direito', [cobranca]);
  assert.equal(r.tipo, 'sem_match');
});

caso('problema de frota não casa com cobrança de faturas', () => {
  const r = varrerIniciativas(
    'Precisamos de um controle de frota dos veículos e da manutenção',
    [cobranca, fornecedor, frota],
  );
  assert.equal(r.tipo, 'com_match');
  if (r.tipo !== 'com_match') return;
  assert.deepEqual(r.itens.map((i) => i.id), ['fro']);
});

caso('cobrança de faturas ranqueia acima do portal de fornecedores', () => {
  const r = varrerIniciativas(
    'Precisamos automatizar a cobrança das faturas atrasadas do financeiro',
    [fornecedor, cobranca, frota],
  );
  assert.equal(r.tipo, 'com_match');
  if (r.tipo !== 'com_match') return;
  assert.equal(r.itens[0].id, 'cob');
  assert.ok(r.itens[0].afinidade >= 40);
  assert.ok(r.itens[0].termos.some((t) => t.includes('fatura') || t.includes('cobranç')));
  assert.equal(r.itens[0].owner_name, 'Ana');
  assert.ok(!r.itens.some((i) => i.id === 'for'));
  assert.ok(!r.itens.some((i) => i.id === 'fro'));
});

caso('acento não separa cobrança de cobranca', () => {
  const semAcento = iniciativa({
    id: 'sem',
    title: 'Cobranca de faturas vencidas',
    description: 'Fila de boletos.',
  });
  const r = varrerIniciativas('A cobrança das faturas vencidas está manual', [semAcento]);
  assert.equal(r.tipo, 'com_match');
  if (r.tipo !== 'com_match') return;
  assert.equal(r.itens[0].id, 'sem');
});

caso('sinônimo ajuda o segundo termo, mas não segura o match sozinho', () => {
  const r = varrerIniciativas('inadimplência e emissão de boletos todo mês', [cobranca]);
  assert.equal(r.tipo, 'com_match');
  if (r.tipo !== 'com_match') return;
  assert.equal(r.itens[0].id, 'cob');

  const soSinonimo = varrerIniciativas('a inadimplência dos consumidores cresceu', [cobranca]);
  assert.equal(soSinonimo.tipo, 'sem_match');
});

caso('um termo forte no título basta quando o resto é genérico', () => {
  const r = varrerIniciativas('Temos um problema com faturas no sistema interno', [cobranca, frota]);
  assert.equal(r.tipo, 'com_match');
  if (r.tipo !== 'com_match') return;
  assert.deepEqual(r.itens.map((i) => i.id), ['cob']);
});

caso('controle sozinho não puxa a frota para um problema de catraca', () => {
  const r = varrerIniciativas(
    'Precisamos de um controle de acesso físico nas catracas do prédio',
    [cobranca, fornecedor, frota],
  );
  assert.equal(r.tipo, 'sem_match');
});

caso('termos fracos não casam com uma iniciativa qualquer', () => {
  const r = varrerIniciativas(
    'O processo interno do sistema e da rotina manual precisa melhorar',
    [cobranca, fornecedor, frota],
  );
  assert.equal(r.tipo, 'sem_match');
  if (r.tipo !== 'sem_match') return;
  assert.equal(r.varridas, 3);
});

caso('devolve no máximo cinco, em ordem de título quando o peso empata', () => {
  const nomes = ['zeta', 'alfa', 'gama', 'epsilon', 'beta', 'delta'];
  const base = nomes.map((nome) => iniciativa({
    id: nome,
    title: `Alfândega recinto ${nome}`,
    description: 'Despacho aduaneiro do recinto.',
  }));
  const r = varrerIniciativas('despacho da alfândega no recinto', base);
  assert.equal(r.tipo, 'com_match');
  if (r.tipo !== 'com_match') return;
  assert.equal(r.itens.length, 5);
  assert.deepEqual(r.itens.map((i) => i.id), ['alfa', 'beta', 'delta', 'epsilon', 'gama']);
  assert.equal(r.varridas, 6);
});

caso('iniciativa cancelada continua visível: o histórico também é match', () => {
  const cancelada = iniciativa({
    id: 'can',
    title: 'Cobrança automática de faturas',
    stage: 'cancelado',
    description: 'Boletos em atraso.',
  });
  const r = varrerIniciativas('cobrança das faturas atrasadas', [cancelada]);
  assert.equal(r.tipo, 'com_match');
  if (r.tipo !== 'com_match') return;
  assert.equal(r.itens[0].stage, 'cancelado');
});

caso('resumo prefere o objetivo e corta em palavra', () => {
  const longo = `${'contexto '.repeat(40)}fim`;
  assert.ok(resumoIniciativa({
    objetivo_contexto: longo,
    description: 'não usar',
    theme: 'Tema',
  }).endsWith('…'));
  assert.equal(resumoIniciativa({
    objetivo_contexto: null,
    description: null,
    theme: 'Financeiro',
  }), 'Financeiro');
});

caso('textos do Pulsenff ficam estáveis', () => {
  assert.equal(
    TEXTO_SEM_MATCH,
    'Não há iniciativa parecida na base. Cadastre a solução e apresente na próxima reunião do Pulso.',
  );
  assert.equal(TEXTO_DUVIDAS, 'Mais dúvidas, consulte somente a Gerência de IA.');
  assert.equal(textoVarredura(0, 0), 'A base ainda não tem iniciativas para comparar.');
  assert.equal(textoVarredura(1, 0), 'Varri 1 iniciativa e não encontrei nada parecido.');
  assert.equal(textoVarredura(12, 1), 'Varri 12 iniciativas e encontrei 1 parecida.');
  assert.equal(textoVarredura(12, 3), 'Varri 12 iniciativas e encontrei 3 parecidas.');
});

caso('a prévia gravada é o que o Supabase mostra na tabela', () => {
  const com = registroPulsenff(
    'Precisamos automatizar a cobrança das faturas atrasadas do financeiro',
    varrerIniciativas(
      'Precisamos automatizar a cobrança das faturas atrasadas do financeiro',
      [fornecedor, cobranca, frota],
    ),
  );
  assert.equal(com.resultado, 'com_match');
  assert.equal(com.encontrados, 1);
  assert.equal(com.matches[0].project_id, 'cob');
  assert.match(com.previa, /^Cobrança automática de faturas \(\d+%\)$/);
  const deVolta = resultadoDoRegistro(com);
  assert.equal(deVolta.tipo, 'com_match');
  if (deVolta.tipo !== 'com_match') return;
  assert.equal(deVolta.itens[0].id, 'cob');
  assert.equal(deVolta.itens[0].title, com.matches[0].title);

  const sem = registroPulsenff(
    'Precisamos de um controle de acesso físico nas catracas do prédio',
    { tipo: 'sem_match', varridas: 3 },
  );
  assert.equal(sem.resultado, 'sem_match');
  assert.equal(sem.previa, TEXTO_SEM_MATCH);
  assert.deepEqual(sem.matches, []);

  const curto = registroPulsenff('ajuda', { tipo: 'curto' });
  assert.equal(curto.resultado, 'curto');
  assert.equal(curto.varridas, 0);
  assert.equal(curto.previa, TEXTO_CONSULTA_CURTA);
});

caso('o cadastro leva o problema descrito, sem estourar o tamanho', () => {
  assert.equal(hrefCadastrarDoMatch('   '), '/projetos/novo');
  const href = hrefCadastrarDoMatch('Cobrança de faturas atrasadas');
  assert.ok(href.startsWith('/projetos/novo?'));
  const problema = new URLSearchParams(href.split('?')[1]).get('problema');
  assert.equal(problema, 'Cobrança de faturas atrasadas');
  const enorme = problemaNormalizado(` ${'a'.repeat(5000)} `);
  assert.equal(enorme.length, 4000);
});

if (falhas) {
  console.error(`\n${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
