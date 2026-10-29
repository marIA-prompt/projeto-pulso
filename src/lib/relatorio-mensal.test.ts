import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copiaVisivel, separarEmailsCopia } from './emails-copia';
import { assuntoEmail, htmlEmailRelatorio } from './relatorio-email-html';
import { paraIniciativa } from './relatorio-mensal-dados';
import {
  calendarioSP,
  chaveMes,
  intervaloMes,
  mesAnterior,
  mesAtual,
  mesPedido,
  montarRelatorioMensal,
  normalizarDiretoria,
  type DiretoriaCatalogo,
  type IniciativaRelatorio,
} from './relatorio-mensal';
import { segredoConfere } from './segredo-cron';
import type { Stage } from './types';

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

const COLECOES = [
  'Área Diretora de Vendas Varejo Expansão',
  'Área Vendas Varejo Expansão',
  'Área Dados e Infraestrutura',
  'Área Operações e Atendimento',
  'Área Consignado',
  'Área Tecnologia da Informação',
  'Área Pós Vendas Private Label',
  'Área Controladoria',
  'Área Crédito / Cobrança',
  'Área Comercial PJ',
  'Área Adquirência e Marketplace',
  'Área Tesouraria e Captação',
  'Área Processos',
  'Área Recursos Humanos',
];

const DIRS: DiretoriaCatalogo[] = [
  { id: 'cons', slug: 'consignado', nome: 'Área Consignado', ordem: 50 },
  { id: 'ctrl', slug: 'controladoria', nome: 'Área Controladoria', ordem: 80 },
  { id: 'cred', slug: 'credito-cobranca', nome: 'Área Crédito / Cobrança', ordem: 90 },
  { id: 'vend', slug: 'vendas-varejo-expansao', nome: 'Área Vendas Varejo Expansão', ordem: 20 },
];

function ini(p: Partial<IniciativaRelatorio> & Pick<IniciativaRelatorio, 'id' | 'title'>): IniciativaRelatorio {
  return {
    stage: 'em_desenvolvimento' as Stage,
    area_name: 'Consignado',
    diretoria_id: 'cons',
    directorate: null,
    owner_name: 'Maria',
    hours_saved_month: null,
    cost_saved_month: null,
    uses_ai: false,
    created_at: '2026-08-01T15:00:00.000Z',
    last_activity_at: '2026-08-01T15:00:00.000Z',
    concluded_at: null,
    is_legacy_import: false,
    ...p,
  };
}

const AGORA = new Date('2026-10-28T15:00:00.000Z'); // 28 out 2026, 12:00 em São Paulo

caso('o mês de São Paulo não vira no UTC', () => {
  const quase = new Date('2026-11-01T02:30:00.000Z');
  const virou = new Date('2026-11-01T03:00:00.000Z');
  assert.deepEqual(calendarioSP(quase), { ano: 2026, mes: 10, dia: 31 });
  assert.deepEqual(calendarioSP(virou), { ano: 2026, mes: 11, dia: 1 });
  assert.deepEqual(mesAtual(quase), { ano: 2026, mes: 10 });
  assert.deepEqual(mesAnterior(virou), { ano: 2026, mes: 10 });
  const out = intervaloMes(2026, 10);
  assert.equal(out.inicio.toISOString(), '2026-10-01T03:00:00.000Z');
  assert.equal(out.fim.toISOString(), '2026-11-01T03:00:00.000Z');
  assert.equal(chaveMes(2026, 10), '2026-10');
});

caso('o pedido vazio usa o fallback e o mês mal formado falha', () => {
  assert.deepEqual(mesPedido({ mes: '' }, { ano: 2026, mes: 9 }), { ano: 2026, mes: 9 });
  assert.deepEqual(mesPedido({ mes: '2026-10' }, { ano: 2026, mes: 9 }), { ano: 2026, mes: 10 });
  assert.deepEqual(mesPedido({ mes: '2026-13' }, { ano: 2026, mes: 9 }), { erro: 'Informe o mês como AAAA-MM.' });
});

caso('criada no mês não se repete em atualizadas', () => {
  const pacote = montarRelatorioMensal({
    ano: 2026,
    mes: 10,
    diretorias: DIRS,
    agora: AGORA,
    iniciativas: [
      ini({
        id: 'nova',
        title: 'Nova',
        created_at: '2026-10-05T15:00:00.000Z',
        last_activity_at: '2026-10-20T15:00:00.000Z',
        hours_saved_month: 10,
        cost_saved_month: 1000,
      }),
      ini({
        id: 'antiga',
        title: 'Antiga',
        created_at: '2026-07-01T15:00:00.000Z',
        last_activity_at: '2026-10-10T15:00:00.000Z',
        hours_saved_month: 4,
        cost_saved_month: 500,
        stage: 'backlog',
      }),
      ini({
        id: 'parada',
        title: 'Parada',
        created_at: '2026-07-01T15:00:00.000Z',
        last_activity_at: '2026-07-01T15:00:00.000Z',
        hours_saved_month: 99,
      }),
    ],
  });
  const rel = pacote.relatorios.find((r) => r.slug === 'consignado')!;
  assert.deepEqual(rel.criadas.map((i) => i.title), ['Nova']);
  assert.deepEqual(rel.atualizadas.map((i) => i.title), ['Antiga']);
  assert.equal(rel.metricas.iniciativas, 3);
  assert.equal(rel.metricas.ativas, 3);
  assert.equal(rel.ganhos.horas_criadas, 10);
  assert.equal(rel.ganhos.horas_atualizadas, 4);
  assert.equal(rel.ganhos.horas_portfolio, 113);
  assert.equal(rel.valor.mensal_criadas, 1000);
  assert.equal(rel.valor.mensal_atualizadas, 500);
  assert.equal(rel.valor.mensal_movimento, 1500);
  assert.equal(rel.valor.mensal_realizado, 0);
  const [parteCriadas, parteAtualizadas] = rel.texto.split('Iniciativas atualizadas no mês');
  assert.match(parteCriadas, /Iniciativas criadas no mês/);
  assert.ok(parteCriadas.includes('Nova'));
  assert.ok(!parteCriadas.includes('Antiga'));
  assert.ok(parteAtualizadas.includes('Antiga'));
  assert.ok(!parteAtualizadas.includes('Nova'));
  assert.ok(!rel.texto.includes('Parada'));
});

caso('carga legada do mês da importação não entra em nenhum dos dois blocos', () => {
  const pacote = montarRelatorioMensal({
    ano: 2026,
    mes: 10,
    diretorias: DIRS,
    agora: AGORA,
    iniciativas: [
      ini({
        id: 'leg',
        title: 'Acervo',
        is_legacy_import: true,
        created_at: '2026-10-02T15:00:00.000Z',
        last_activity_at: '2026-10-02T15:00:00.000Z',
        stage: 'concluido',
        hours_saved_month: 8,
        cost_saved_month: 200,
      }),
    ],
  });
  const rel = pacote.relatorios.find((r) => r.slug === 'consignado')!;
  assert.equal(rel.criadas.length, 0);
  assert.equal(rel.atualizadas.length, 0);
  assert.equal(rel.metricas.concluidas, 1);
  assert.equal(rel.ganhos.horas_devolvidas_mes, 8);
  assert.equal(rel.valor.mensal_realizado, 200);
  assert.equal(rel.valor.anual_realizado, 2400);
  assert.match(rel.texto, /Nenhuma iniciativa criada neste mês/);
  assert.match(rel.texto, /Nenhuma iniciativa atualizada neste mês/);
});

caso('legado atualizado num mês seguinte entra só em atualizadas', () => {
  const pacote = montarRelatorioMensal({
    ano: 2026,
    mes: 11,
    diretorias: DIRS,
    agora: new Date('2026-11-15T15:00:00.000Z'),
    iniciativas: [
      ini({
        id: 'leg',
        title: 'Acervo',
        is_legacy_import: true,
        created_at: '2026-10-02T15:00:00.000Z',
        last_activity_at: '2026-11-04T15:00:00.000Z',
      }),
    ],
  });
  const rel = pacote.relatorios.find((r) => r.slug === 'consignado')!;
  assert.deepEqual(rel.atualizadas.map((i) => i.id), ['leg']);
  assert.equal(rel.criadas.length, 0);
});

caso('virada do mês em São Paulo separa criação e atualização', () => {
  const pacote = montarRelatorioMensal({
    ano: 2026,
    mes: 10,
    diretorias: DIRS,
    agora: AGORA,
    iniciativas: [
      ini({
        id: 'ainda',
        title: 'Ainda outubro',
        created_at: '2026-11-01T02:30:00.000Z',
        last_activity_at: '2026-11-01T02:30:00.000Z',
      }),
      ini({
        id: 'ja',
        title: 'Já novembro',
        created_at: '2026-11-01T03:00:00.000Z',
        last_activity_at: '2026-11-01T03:00:00.000Z',
      }),
    ],
  });
  const rel = pacote.relatorios.find((r) => r.slug === 'consignado')!;
  assert.deepEqual(rel.criadas.map((i) => i.title), ['Ainda outubro']);
});

caso('texto livre da diretoria cai na coleção e o vínculo da área prevalece', () => {
  const pacote = montarRelatorioMensal({
    ano: 2026,
    mes: 10,
    diretorias: DIRS,
    agora: AGORA,
    iniciativas: [
      ini({
        id: 'txt',
        title: 'Pelo texto',
        area_name: null,
        diretoria_id: null,
        directorate: 'crédito / cobrança',
        created_at: '2026-10-03T15:00:00.000Z',
        last_activity_at: '2026-10-03T15:00:00.000Z',
      }),
      ini({
        id: 'fk',
        title: 'Pelo vínculo',
        diretoria_id: 'ctrl',
        directorate: 'Área Consignado',
        area_name: 'Controladoria',
        created_at: '2026-10-04T15:00:00.000Z',
        last_activity_at: '2026-10-04T15:00:00.000Z',
      }),
      ini({
        id: 'solta',
        title: 'Solta',
        diretoria_id: null,
        directorate: 'Vendas Varejo',
        area_name: 'Marketing',
      }),
    ],
  });
  const credito = pacote.relatorios.find((r) => r.slug === 'credito-cobranca')!;
  const ctrl = pacote.relatorios.find((r) => r.slug === 'controladoria')!;
  const sem = pacote.relatorios.find((r) => r.slug === 'sem-diretoria')!;
  assert.deepEqual(credito.criadas.map((i) => i.title), ['Pelo texto']);
  assert.deepEqual(ctrl.criadas.map((i) => i.title), ['Pelo vínculo']);
  assert.equal(sem.metricas.iniciativas, 1);
  assert.equal(normalizarDiretoria('Área Crédito / Cobrança'), normalizarDiretoria('credito / cobranca'));
});

caso('diretoria sem movimento ainda sai no pacote, na ordem da coleção', () => {
  const pacote = montarRelatorioMensal({
    ano: 2026,
    mes: 10,
    diretorias: DIRS,
    agora: AGORA,
    iniciativas: [],
  });
  assert.deepEqual(pacote.relatorios.map((r) => r.slug), [
    'vendas-varejo-expansao', 'consignado', 'controladoria', 'credito-cobranca',
  ]);
  assert.equal(pacote.relatorios[0].metricas.iniciativas, 0);
  assert.ok(!pacote.relatorios.some((r) => r.slug === 'sem-diretoria'));
});

caso('concluída no mês e alerta usam o fim do mês como referência', () => {
  const pacote = montarRelatorioMensal({
    ano: 2026,
    mes: 9,
    diretorias: DIRS,
    agora: AGORA,
    iniciativas: [
      ini({
        id: 'feita',
        title: 'Feita',
        stage: 'concluido',
        concluded_at: '2026-09-15T15:00:00.000Z',
        created_at: '2026-06-01T15:00:00.000Z',
        last_activity_at: '2026-09-15T15:00:00.000Z',
        hours_saved_month: 6,
        cost_saved_month: 300,
      }),
      ini({
        id: 'fria',
        title: 'Fria',
        stage: 'em_teste',
        created_at: '2026-01-01T15:00:00.000Z',
        last_activity_at: '2026-09-01T15:00:00.000Z',
      }),
      ini({
        id: 'ok',
        title: 'Em dia',
        stage: 'em_teste',
        created_at: '2026-01-01T15:00:00.000Z',
        last_activity_at: '2026-09-20T15:00:00.000Z',
      }),
    ],
  });
  const rel = pacote.relatorios.find((r) => r.slug === 'consignado')!;
  assert.equal(rel.metricas.concluidas_no_mes, 1);
  assert.equal(rel.ganhos.horas_concluidas_no_mes, 6);
  assert.equal(rel.valor.mensal_concluidas_no_mes, 300);
  assert.equal(rel.ganhos.horas_devolvidas_mes, 6);
  assert.equal(rel.metricas.em_alerta, 1);
  assert.equal(rel.metricas.ativas, 2);
  assert.deepEqual(rel.atualizadas.map((i) => i.title), ['Em dia', 'Feita', 'Fria']);
});

caso('o texto declara a amostra de horas e de valor', () => {
  const pacote = montarRelatorioMensal({
    ano: 2026,
    mes: 10,
    diretorias: DIRS,
    agora: AGORA,
    dashboardUrl: 'https://pulso.exemplo/dashboard',
    iniciativas: [
      ini({ id: 'a', title: 'Com valor', hours_saved_month: 1, cost_saved_month: 10, stage: 'concluido' }),
      ini({ id: 'b', title: 'Sem valor' }),
    ],
  });
  const rel = pacote.relatorios.find((r) => r.slug === 'consignado')!;
  assert.match(rel.texto, /1 de 2 com horas informadas/);
  assert.match(rel.texto, /1 de 2 com valor em R\$ informado/);
  assert.match(rel.texto, /Painel: https:\/\/pulso\.exemplo\/dashboard/);
  assert.match(rel.texto, /Valor para a área/);
  assert.match(rel.texto, /Ganhos/);
  assert.match(rel.texto, /Métricas/);
});

caso('área de rh e área de tesouraria normalizam sem o "de"', () => {
  assert.equal(normalizarDiretoria('Área de RH'), 'rh');
  assert.equal(normalizarDiretoria('RH'), 'rh');
  assert.equal(normalizarDiretoria('Área de Tesouraria e Captação'), 'tesouraria e captacao');
  assert.equal(normalizarDiretoria('Área Tesouraria e Captação'), 'tesouraria e captacao');
});

caso('alias de recursos humanos cai em RH e o diretor entra no texto', () => {
  const pacote = montarRelatorioMensal({
    ano: 2026,
    mes: 10,
    agora: AGORA,
    diretorias: [{
      id: 'rh',
      slug: 'recursos-humanos',
      nome: 'Área de RH',
      ordem: 140,
      diretor_nome: 'Christian',
      diretor_email: 'christian@senff.com.br',
      aliases: ['Recursos Humanos', 'RH'],
    }],
    iniciativas: [
      ini({
        id: 'jur',
        title: 'Parecer trabalhista',
        diretoria_id: null,
        directorate: 'Recursos Humanos',
        area_name: 'Jurídico',
        created_at: '2026-10-08T15:00:00.000Z',
        last_activity_at: '2026-10-08T15:00:00.000Z',
      }),
    ],
  });
  const rel = pacote.relatorios.find((r) => r.slug === 'recursos-humanos')!;
  assert.deepEqual(rel.criadas.map((i) => i.title), ['Parecer trabalhista']);
  assert.equal(rel.diretor_nome, 'Christian');
  assert.match(rel.texto, /Diretor: Christian/);
  assert.deepEqual(rel.emails_copia, []);
});

caso('a migration semeia as 14 coleções e não chama o fluxo de W5', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/0017_relatorio_mensal.sql', import.meta.url), 'utf8');
  for (const nome of COLECOES) assert.ok(sql.includes(`'${nome}'`), nome);
  assert.equal(COLECOES.length, 14);
  assert.ok(sql.includes('Consignado'));
  assert.ok(sql.includes('Departamento Controladoria - %'));
  assert.ok(!sql.includes('W5'));
});

caso('linha do banco coerente com IA em qualquer modalidade e área vinculada', () => {
  const item = paraIniciativa({
    id: '1',
    title: 'Agente',
    stage: 'ideia',
    directorate: 'outra',
    area_id: 'a1',
    owner_id: 'u1',
    hours_saved_month: '12.5',
    cost_saved_month: null,
    uses_ai: false,
    uses_ai_tradicional: false,
    uses_ai_generativa: true,
    created_at: '2026-10-01T03:00:00.000Z',
    last_activity_at: '2026-10-01T03:00:00.000Z',
    concluded_at: null,
    is_legacy_import: false,
    profiles: [{ full_name: 'João' }],
  }, { name: 'Crédito PF', diretoria_id: 'cred' });
  assert.equal(item.uses_ai, true);
  assert.equal(item.hours_saved_month, 12.5);
  assert.equal(item.diretoria_id, 'cred');
  assert.equal(item.area_name, 'Crédito PF');
  assert.equal(item.owner_name, 'João');
});

caso('os diretores e o vínculo de RH e Seguros estão na migration do envio', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/0018_diretores_relatorio_mensal.sql', import.meta.url), 'utf8');
  const pares = [
    ['Adriele', 'vendas-varejo-expansao'],
    ['Alexandro Lima', 'dados-infraestrutura'],
    ['Bruno', 'operacoes-atendimento'],
    ['Cristiano', 'consignado'],
    ['Everton', 'tecnologia-informacao'],
    ['Fernanda', 'pos-vendas-private-label'],
    ['Jacqueline', 'controladoria'],
    ['Genaro', 'credito-cobranca'],
    ['Marcelino', 'comercial-pj'],
    ['Marco Senff', 'adquirencia-marketplace'],
    ['Mauricio Rodrigues', 'tesouraria-captacao'],
    ['Pollyana', 'processos'],
    ['Bruna', 'seguros'],
    ['Christian', 'recursos-humanos'],
  ];
  for (const [diretor, slug] of pares) {
    assert.ok(sql.includes(`'${diretor}'`), diretor);
    assert.ok(sql.includes(`'${slug}'`), slug);
  }
  assert.ok(sql.includes("'Jurídico'"));
  assert.ok(sql.includes("'Compliance'"));
  assert.ok(sql.includes('Área de Seguros'));
  assert.ok(sql.includes('Área de RH'));
  assert.match(sql, /delete from public\.diretorias where slug = 'diretora-vendas-varejo-expansao'/);
  assert.ok(sql.includes('relatorio_mensal_envio'));
});

caso('o fluxo n8n busca o Supabase e envia um e-mail por diretor', () => {
  const wf = JSON.parse(readFileSync(new URL('../../n8n/w6-relatorio-mensal.json', import.meta.url), 'utf8'));
  const tipos = wf.nodes.map((n: { type: string }) => n.type);
  assert.ok(tipos.includes('n8n-nodes-base.scheduleTrigger'));
  assert.ok(tipos.includes('n8n-nodes-base.httpRequest'));
  assert.ok(tipos.includes('n8n-nodes-base.emailSend'));
  const http = wf.nodes.find((n: { name: string }) => n.name === 'Buscar no Supabase');
  assert.match(http.parameters.url, /relatorio_mensal_envio/);
  assert.equal(wf.settings.timezone, 'America/Sao_Paulo');
  const code = wf.nodes.find((n: { name: string }) => n.name === 'Montar e-mails').parameters.jsCode as string;
  assert.match(code, /Iniciativas criadas no mês/);
  assert.match(code, /Iniciativas atualizadas no mês/);
  assert.match(code, /Olá, /);
  assert.equal(wf.active, false);
  const email = wf.nodes.find((n: { name: string }) => n.name === 'Enviar e-mail');
  assert.equal(email.credentials.smtp.name, 'Zoho Mail');
  assert.equal(email.parameters.emailFormat, 'html');
  assert.match(email.parameters.html, /\$json\.html/);
  assert.equal(email.parameters.options.ccEmail, '={{ $json.copia }}');
  assert.match(code, /function listaCopia/);
  assert.match(code, /emails_copia/);
  const sticky = wf.nodes.find((n: { name: string }) => n.name === 'Como ligar');
  assert.match(sticky.parameters.content, /emails_copia/);
  assert.match(sticky.parameters.content, /smtp\.zoho\.com/);
  assert.match(sticky.parameters.content, /465/);
  assert.match(code, /<table/);
  assert.match(code, /Métricas/);
  assert.match(code, /Iniciativas criadas no mês/);
  assert.match(code, /Iniciativas atualizadas no mês/);
  assert.match(code, /Olá, /);
});

caso('a migration 0019 corrige as áreas e grava o e-mail de cada diretor', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/0019_areas_emails_diretoria.sql', import.meta.url), 'utf8');
  const pares: Array<[string, string, string]> = [
    ['Comercial PF', 'adquirencia-marketplace', 'a.moura@senff.com.br'],
    ['Fraudes', 'tecnologia-informacao', 'e.dzikovicz@senff.com.br'],
    ['Crédito PF', 'credito-cobranca', 'j.genaro@senff.com.br'],
    ['Private Label', 'vendas-varejo-expansao', 'a.moura@senff.com.br'],
    ['Jurídico', 'recursos-humanos', 'dpo@senff.com.br'],
    ['Compliance', 'recursos-humanos', 'dpo@senff.com.br'],
    ['Compras, Manutenção e Zeladoria', 'recursos-humanos', 'dpo@senff.com.br'],
    ['Frota', 'recursos-humanos', 'dpo@senff.com.br'],
    ['Pós Vendas - Private Label', 'pos-vendas-private-label', 'f.silva@senff.com.br'],
    ['Financeiro / Contas a Receber', 'controladoria', 'j.pereira@senff.com.br'],
    ['Produtos Financeiros', 'tesouraria-captacao', 'm.rodrigues@senff.com.br'],
    ['Marketing', 'adquirencia-marketplace', 'marco@senff.com.br'],
    ['Seguros', 'seguros', 'b.camargo@senff.com.br'],
    ['Portfólio Projetos Estratégicos', 'tecnologia-informacao', 'e.dzikovicz@senff.com.br'],
  ];
  for (const [area, slug, email] of pares) {
    assert.ok(sql.includes(`'${area}'`), area);
    assert.ok(sql.includes(`'${slug}'`), slug);
    assert.ok(sql.includes(`'${email}'`), email);
  }
  assert.ok(sql.includes('p.pereira@senff.com.br'));
  assert.ok(sql.includes('bruno.capobianco@senff.com.br'));
  assert.equal(sql.includes('senff.com.brr'), false);
});

caso('a migration 0020 devolve a cópia no pacote do n8n', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/0020_emails_copia_relatorio.sql', import.meta.url), 'utf8');
  assert.match(sql, /emails_copia text\[\] not null default '\{\}'/);
  assert.match(sql, /grant update \(emails_copia\) on public\.diretorias to authenticated/);
  assert.ok(sql.includes("'emails_copia'"));
  assert.ok(sql.includes("'copia'"));
  assert.match(sql, /array_to_string\(d\.emails_copia, ', '\)/);
  assert.match(sql, /group by d\.id, d\.slug, d\.name, d\.sort_order, d\.diretor_nome, d\.diretor_email, d\.emails_copia/);
});

caso('cópias aceitam lista separada e tiram o e-mail do diretor', () => {
  const ok = separarEmailsCopia(' Ana@Senff.com.br, ana@senff.com.br\njuridico@senff.com.br; ');
  assert.equal(ok.ok, true);
  if (!ok.ok) return;
  assert.deepEqual(ok.emails, ['ana@senff.com.br', 'juridico@senff.com.br']);
  assert.deepEqual(copiaVisivel(ok.emails, 'ANA@senff.com.br'), ['juridico@senff.com.br']);
  assert.equal(separarEmailsCopia('sem-arroba').ok, false);
  assert.equal(separarEmailsCopia('').ok, true);
});

caso('a prévia do e-mail traz o texto corrido, a tabela e o assunto', () => {
  const pacote = montarRelatorioMensal({
    ano: 2026,
    mes: 10,
    agora: AGORA,
    dashboardUrl: 'https://pulso.exemplo/dashboard',
    diretorias: [{
      id: 'ctrl',
      slug: 'controladoria',
      nome: 'Área Controladoria',
      ordem: 70,
      diretor_nome: 'Jacqueline',
      diretor_email: 'j.pereira@senff.com.br',
      emails_copia: ['j.pereira@senff.com.br', 'financeiro@senff.com.br'],
    }],
    iniciativas: [
      ini({
        id: 'c1',
        title: 'Fechamento <mensal>',
        diretoria_id: 'ctrl',
        area_name: 'Controladoria',
        owner_name: 'Ana',
        stage: 'concluido',
        hours_saved_month: 4,
        cost_saved_month: 800,
        created_at: '2026-10-04T15:00:00.000Z',
        last_activity_at: '2026-10-04T15:00:00.000Z',
      }),
    ],
  });
  const rel = pacote.relatorios.find((r) => r.slug === 'controladoria')!;
  assert.deepEqual(rel.emails_copia, ['j.pereira@senff.com.br', 'financeiro@senff.com.br']);
  assert.deepEqual(copiaVisivel(rel.emails_copia, rel.diretor_email), ['financeiro@senff.com.br']);
  assert.equal(assuntoEmail(rel.nome, pacote.rotulo), 'Pulso — Área Controladoria — outubro de 2026');
  const html = htmlEmailRelatorio(rel, { rotulo: pacote.rotulo, dashboardUrl: pacote.dashboard_url });
  assert.match(html, /Olá, Jacqueline/);
  assert.match(html, /A carga legada não entra como criação\./);
  assert.match(html, /<table/);
  assert.match(html, /Iniciativas criadas no mês/);
  assert.match(html, /Fechamento &lt;mensal&gt;/);
  assert.match(html, /https:\/\/pulso\.exemplo\/dashboard/);
});

caso('segredo do cron exige o mesmo tamanho e o mesmo conteúdo', () => {
  assert.equal(segredoConfere('abc', 'abc'), true);
  assert.equal(segredoConfere('abc', 'abd'), false);
  assert.equal(segredoConfere('abc', 'abcd'), false);
  assert.equal(segredoConfere(null, 'abc'), false);
});

if (falhas) {
  console.error(`\n${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
