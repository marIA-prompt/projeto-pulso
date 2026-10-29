import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIRETORIAS_CADASTRO } from './diretorias-catalogo';
import {
  ALIASES_AREA,
  DIRETORIAS,
  MAPA_AREA_DIRETORIA,
  chaveArea,
  diretoriaDaArea,
  diretoriaDeTexto,
  diretoriaExibida,
  diretoriaParaGravar,
} from './diretorias';

const sql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../supabase/migrations/0021_projetos_diretoria_por_area.sql'),
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

caso('cada área antiga do pedido aponta para uma diretoria', () => {
  const esperado: Record<string, string> = {
    'Comercial PF': 'Área Adquirência e Marketplace',
    Fraudes: 'Área Tecnologia da Informação',
    'Crédito PF': 'Área Crédito/Cobrança',
    Credenciamento: 'Área Adquirência e Marketplace',
    Jurídico: 'Área de RH',
    'Compras, Manutenção e Zeladoria': 'Área de RH',
    'Private Label': 'Área Vendas Varejo Expansão',
    DHO: 'Área de RH',
    RH: 'Área de RH',
    Cobrança: 'Área Crédito/Cobrança',
    Seguros: 'Área de Seguros',
    'Pós Vendas - Private Label': 'Área Pós Vendas Private Label',
    'Departamento Controladoria - Riscos': 'Área Controladoria',
    'Produtos Financeiros': 'Área de Tesouraria e Captação',
    'Comercial PJ': 'Área Comercial PJ',
    'Financeiro / Contas a Receber': 'Área Controladoria',
    Atendimento: 'Área Operações e Atendimento',
    'Departamento Controladoria - Controladoria': 'Área Controladoria',
    Operações: 'Área Operações e Atendimento',
    Consignado: 'Área Consignado',
    'Crédito PJ': 'Área Crédito/Cobrança',
    'Portfólio Projetos Estratégicos': 'Área Tecnologia da Informação',
    'Financeiro - Tesouraria': 'Área de Tesouraria e Captação',
    'Departamento Controladoria - Carteiras e Regulatórios': 'Área Controladoria',
    'Banco PJ': 'Área Comercial PJ',
    Frota: 'Área de RH',
    TI: 'Área Tecnologia da Informação',
    'Departamento Controladoria - Fiscal': 'Área Controladoria',
    Marketplace: 'Área Adquirência e Marketplace',
    Marketing: 'Área Adquirência e Marketplace',
    'Departamento Controladoria - Contabilidade': 'Área Controladoria',
    Compliance: 'Área de RH',
  };
  assert.equal(MAPA_AREA_DIRETORIA.length, Object.keys(esperado).length);
  for (const [area, diretoria] of Object.entries(esperado)) {
    assert.equal(diretoriaDaArea(area), diretoria, area);
    assert.ok(
      (DIRETORIAS_CADASTRO as readonly string[]).includes(diretoria),
      `${diretoria} fora do catálogo`,
    );
  }
});

caso('a área vence o texto solto, inclusive nome de pessoa', () => {
  assert.equal(
    diretoriaExibida('Operações', 'Bruno Capobianco'),
    'Área Operações e Atendimento',
  );
  assert.equal(diretoriaExibida('Fraudes', 'CONTROLADORIA'), 'Área Tecnologia da Informação');
  assert.equal(diretoriaParaGravar('Operações', 'Bruno Capobianco'), 'Área Operações e Atendimento');
  assert.equal(diretoriaDeTexto('Bruno Capobianco'), null);
  assert.equal(diretoriaDeTexto('Dir. de Pessoas'), null);
  assert.equal(diretoriaExibida(null, 'Bruno Capobianco'), null);
  assert.equal(diretoriaParaGravar(null, 'Bruno Capobianco'), 'Bruno Capobianco');
  assert.equal(diretoriaParaGravar(null, 'Área de Processos'), 'Área de Processos');
});

caso('aceita caixa, acento, espaço e as grafias legadas', () => {
  assert.equal(diretoriaDaArea('  credito pf '), 'Área Crédito/Cobrança');
  assert.equal(diretoriaDaArea('OPERAÇÕES'), 'Área Operações e Atendimento');
  assert.equal(diretoriaDeTexto('Área de Rh'), 'Área de RH');
  assert.equal(diretoriaDeTexto('Áre Pós Vendas Private Label'), 'Área Pós Vendas Private Label');
  assert.equal(diretoriaDeTexto('FROTA'), 'Área de RH');
  assert.equal(diretoriaDeTexto('BANCO PJ'), 'Área Comercial PJ');
  assert.equal(diretoriaDeTexto('Credito PJ'), 'Área Crédito/Cobrança');
  assert.equal(diretoriaDeTexto('Rh'), 'Área de RH');
  assert.equal(diretoriaDeTexto('MANUTENÇÃO/COMPRAS  E ZELADORIA'), 'Área de RH');
  assert.equal(diretoriaDeTexto('Produtos Financeiros / Consignado'), 'Área Consignado');
  assert.equal(diretoriaDeTexto('CONTROLADORIA'), 'Área Controladoria');
  assert.equal(diretoriaDeTexto('Área Dados e Infraestrutura'), 'Área Dados e Infraestrutura');
  assert.equal(chaveArea('Área de RH'), chaveArea('Área de Rh'));
});

caso('lista canônica não repete diretoria e cobre o mapa', () => {
  assert.equal(new Set(DIRETORIAS).size, DIRETORIAS.length);
  for (const [, diretoria] of MAPA_AREA_DIRETORIA) {
    assert.ok(DIRETORIAS.includes(diretoria), diretoria);
    assert.equal(diretoriaDeTexto(diretoria), diretoria);
  }
  assert.equal(DIRETORIAS[0], [...DIRETORIAS].sort((a, b) => a.localeCompare(b, 'pt-BR'))[0]);
});

caso('aliases conhecidos apontam para área que está no mapa', () => {
  for (const [, canon] of ALIASES_AREA) {
    assert.ok(diretoriaDaArea(canon), canon);
  }
});

caso('a migration repete cada par área → slug e não mexe no semáforo', () => {
  for (const [area, , slug] of MAPA_AREA_DIRETORIA) {
    const trecho = `('${area}', '${slug}')`;
    assert.ok(sql.includes(trecho), trecho);
  }
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
