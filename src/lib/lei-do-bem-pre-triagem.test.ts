import assert from 'node:assert/strict';
import {
  auditoriaDoPerfil,
  perfilPreTriagem,
  preTriar,
  RESPOSTAS_POR_PERFIL,
  type PerfilPreTriagem,
} from './lei-do-bem-pre-triagem';
import { classificarTriagem } from './lei-do-bem';

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

caso('classificador de e-mails → experimental → potencialmente elegível → enquadrado', () => {
  const r = preTriar({
    title: 'Classificador de e-mails da Cobrança',
    description: 'Separar automaticamente o motivo do contato e o público afetado.',
    uses_ai: true,
  });
  assert.equal(r.perfil, 'experimental');
  assert.equal(r.triagem.classificacao, 'potencialmente_elegivel');
  assert.ok((r.triagem.indice ?? 0) >= 0.75);
  assert.equal(r.status, 'enquadrado');
  assert.equal(r.prioridade, 'alta');
});

caso('OCR / extração inteligente → experimental', () => {
  assert.equal(perfilPreTriagem({ title: 'OCR de documentos de crédito PJ' }), 'experimental');
  assert.equal(perfilPreTriagem({ title: 'Extração inteligente de notas fiscais' }), 'experimental');
});

caso('Copilot / implantar ferramenta → pronto → baixo potencial → não enquadrado', () => {
  const r = preTriar({ title: 'Implantar Copilot no Atendimento', uses_ai: true });
  assert.equal(r.perfil, 'pronto');
  assert.equal(r.triagem.classificacao, 'baixo_potencial');
  assert.equal(r.status, 'nao_enquadrado');
});

caso('dashboard / Power BI / planilha → pronto', () => {
  assert.equal(perfilPreTriagem({ title: 'Dashboard Power BI de inadimplência', theme: 'Dados, BI e Relatórios' }), 'pronto');
  assert.equal(perfilPreTriagem({ title: 'Planilha de conciliação da Tesouraria' }), 'pronto');
});

caso('n8n / RPA / chatbot → parcial → potencial parcial → em avaliação', () => {
  const r = preTriar({ title: 'Automação n8n de boletos', uses_n8n: true });
  assert.equal(r.perfil, 'parcial');
  assert.equal(r.triagem.classificacao, 'potencial_parcial');
  assert.equal(r.status, 'em_avaliacao_interna');
  assert.equal(r.prioridade, 'media');
});

caso('uses_ai sem palavra-chave de P&D cai em parcial, não em experimental', () => {
  assert.equal(perfilPreTriagem({ title: 'Assistente interno da Controladoria', uses_ai: true }), 'parcial');
});

caso('classificador + implantar: experimental vence (há desenvolvimento)', () => {
  assert.equal(
    perfilPreTriagem({ title: 'Implantar classificador de chamados do SAC' }),
    'experimental',
  );
});

caso('sem sinal → incerto → backlog', () => {
  const r = preTriar({ title: 'Melhoria no onboarding' });
  assert.equal(r.perfil, 'incerto');
  assert.equal(r.triagem.classificacao, 'baixo_potencial');
  assert.equal(r.status, 'backlog');
});

caso('os quatro perfis batem com a fórmula B27–B30', () => {
  const esperado: Record<PerfilPreTriagem, string> = {
    experimental: 'potencialmente_elegivel',
    parcial: 'potencial_parcial',
    pronto: 'baixo_potencial',
    incerto: 'baixo_potencial',
  };
  for (const perfil of Object.keys(esperado) as PerfilPreTriagem[]) {
    const t = classificarTriagem(RESPOSTAS_POR_PERFIL[perfil]);
    assert.equal(t.classificacao, esperado[perfil], perfil);
    const aud = auditoriaDoPerfil(perfil);
    if (perfil === 'experimental') assert.equal(aud.status, 'enquadrado');
    if (perfil === 'parcial') assert.equal(aud.status, 'em_avaliacao_interna');
    if (perfil === 'pronto') assert.equal(aud.status, 'nao_enquadrado');
    if (perfil === 'incerto') assert.equal(aud.status, 'backlog');
  }
});

caso('vocabulário ampliado cobre IA, automática, integração e scoring', () => {
  assert.equal(perfilPreTriagem({ title: 'IA para cobrança' }), 'parcial');
  assert.equal(perfilPreTriagem({ title: 'Conciliação automática de boletos' }), 'parcial');
  assert.equal(perfilPreTriagem({ title: 'Integração API do consignado' }), 'parcial');
  assert.equal(perfilPreTriagem({ title: 'Scoring de crédito PJ' }), 'experimental');
  assert.equal(perfilPreTriagem({ title: 'Leitura automática de contratos' }), 'experimental');
});

caso('tag IA/LLM em tools não vira enquadrado; bert não casa dentro de aberto', () => {
  assert.equal(
    perfilPreTriagem({ title: 'Principal - Email - Clientes PB', tools: 'Email / SMTP; IA / LLM', uses_ai: true }),
    'parcial',
  );
  assert.equal(
    perfilPreTriagem({ title: 'Cobranças De Chamados Em Aberto Do Jira' }),
    'incerto',
  );
});

caso('experimental sem descrição relaxa só o item 2 e continua elegível', () => {
  const r = preTriar({ title: 'Modelo preditivo de churn PF', uses_ai: true });
  assert.equal(r.respostas.triagem_02, 'parcialmente');
  assert.equal(r.triagem.classificacao, 'potencialmente_elegivel');
});

const PORTFOLIO_ILUSTRATIVO = [
  { title: 'Classificador de e-mails da Cobrança', uses_ai: true, description: 'Triagem do motivo do contato.' },
  { title: 'Modelo preditivo de inadimplência PF', uses_ai: true, description: 'Score interno de risco.' },
  { title: 'OCR de contratos de crédito PJ', uses_ai: true },
  { title: 'Extração inteligente de notas fiscais', uses_ai: true },
  { title: 'Motor de recomendação de oferta consignado', uses_ai: true },
  { title: 'Implantar Copilot no Atendimento', uses_ai: true },
  { title: 'ChatGPT para o time comercial', uses_ai: true },
  { title: 'Dashboard Power BI de horas do portfólio', theme: 'Dados, BI e Relatórios' },
  { title: 'Planilha de conciliação da Tesouraria' },
  { title: 'Configurar Bitrix da Controladoria' },
  { title: 'Treinamento de prompt engineering — DHO' },
  { title: 'Automação n8n de boletos', uses_n8n: true },
  { title: 'RPA de baixas da Cobrança' },
  { title: 'Chatbot WhatsApp do SAC', uses_ai: true },
  { title: 'Fluxo de onboarding no n8n', uses_n8n: true },
  { title: 'Assistente interno da Controladoria', uses_ai: true },
  { title: 'Melhoria no onboarding de correspondentes' },
  { title: 'Revisão de alçadas de crédito PF' },
  { title: 'Padronizar pasta de evidências do compliance' },
];

caso('portfólio ilustrativo: há enquadrados, em avaliação, não enquadrados e backlog', () => {
  const contagem = { enquadrado: 0, em_avaliacao_interna: 0, nao_enquadrado: 0, backlog: 0 };
  for (const p of PORTFOLIO_ILUSTRATIVO) {
    const r = preTriar(p);
    contagem[r.status] += 1;
    console.log(`  ${r.status.padEnd(22)} ${r.perfil.padEnd(13)} ${p.title}`);
  }
  assert.ok(contagem.enquadrado >= 1);
  assert.ok(contagem.em_avaliacao_interna >= 1);
  assert.ok(contagem.nao_enquadrado >= 1);
  assert.ok(contagem.backlog >= 1);
});

if (falhas) {
  console.error(`\n${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log('\ntodos os casos passaram');
