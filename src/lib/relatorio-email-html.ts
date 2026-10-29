/**
 * HTML do e-mail mensal, no visual claro do Pulso.
 * O nó "Montar e-mails" de n8n/w6-relatorio-mensal.json repete este desenho
 * (clientes de e-mail não carregam o CSS da aplicação). Se o visual mudar,
 * atualize os dois.
 */
import type { GanhosArea, MetricasArea, ValorArea } from './relatorio-mensal';
import { STAGE_LABEL, type Stage } from './types';

export type ItemEmail = {
  title: string;
  stage: string;
  area_name: string | null;
  owner_name: string;
  hours_saved_month: number | null;
  cost_saved_month: number | null;
  created_at: string;
  last_activity_at: string;
};

export type RelatorioEmail = {
  nome: string;
  diretor_nome: string | null;
  metricas: MetricasArea;
  ganhos: GanhosArea;
  valor: ValorArea;
  criadas: ItemEmail[];
  atualizadas: ItemEmail[];
};

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
});
const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function horas(n: number | null | undefined) {
  return `${nf1.format(Number(n) || 0)} h`;
}

function dataCurta(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(iso));
}

function plural(n: number | null | undefined, um: string, muitos: string) {
  const v = Number(n) || 0;
  return `${v} ${v === 1 ? um : muitos}`;
}

function esc(valor: unknown) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}

function estagio(stage: string) {
  return STAGE_LABEL[stage as Stage] ?? stage;
}

function kpi(valor: string, rotulo: string, nota?: string) {
  const detalhe = `<div style="margin-top:6px;min-height:4.4em;font-size:12px;line-height:1.45;color:#8A9199;">${nota ? esc(nota) : '&nbsp;'}</div>`;
  return `<td width="50%" valign="top" style="width:50%;height:100%;padding:6px;">`
    + `<table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" style="width:100%;height:100%;background:#FFFFFF;border:1px solid #DADFE5;border-radius:14px;">`
    + `<tr><td valign="top" height="100%" style="height:100%;padding:16px 16px 14px;">`
    + `<div style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:22px;line-height:1;font-weight:600;color:#0F2467;">${esc(valor)}</div>`
    + `<div style="margin-top:8px;font-size:14px;line-height:1.35;font-weight:500;color:#4C5156;">${esc(rotulo)}</div>`
    + detalhe
    + `</td></tr></table></td>`;
}

function grade(itens: Array<[string, string, string?]>) {
  const linhas: string[] = [];
  for (let i = 0; i < itens.length; i += 2) {
    const par = itens.slice(i, i + 2).map((item) => kpi(item[0], item[1], item[2])).join('');
    const completa = itens[i + 1] ? par : `${par}<td width="50%" style="width:50%;padding:6px;"></td>`;
    linhas.push(`<tr>${completa}</tr>`);
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin:0 -6px 8px;table-layout:fixed;">${linhas.join('')}</table>`;
}

function secao(titulo: string) {
  return `<h2 style="margin:28px 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8A9199;">${esc(titulo)}</h2>`;
}

function celula(texto: string, extra = '') {
  return `<td style="padding:10px 12px;border-bottom:1px solid #EDEFF3;font-size:13px;line-height:1.4;color:#26292C;${extra}">${texto}</td>`;
}

function tabela(titulo: string, itens: ItemEmail[], quando: 'criacao' | 'atualizacao') {
  const cabeca = secao(titulo);
  if (itens.length === 0) {
    const vazio = quando === 'criacao'
      ? 'Nenhuma iniciativa criada neste mês.'
      : 'Nenhuma iniciativa atualizada neste mês.';
    return `${cabeca}<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#686D73;">${vazio}</p>`;
  }
  const rotuloData = quando === 'criacao' ? 'Criada em' : 'Atualizada em';
  const cab = ['Iniciativa', 'Estágio', 'Área', 'Proprietário', 'Horas/mês', 'Valor/mês', rotuloData]
    .map((nome) => `<th align="left" style="padding:10px 12px;border-bottom:1px solid #DADFE5;font-size:11px;letter-spacing:0.04em;text-transform:uppercase;color:#8A9199;">${nome}</th>`)
    .join('');
  const corpo = itens.map((item) => {
    const data = dataCurta(quando === 'criacao' ? item.created_at : item.last_activity_at);
    const horasTxt = item.hours_saved_month == null ? '—' : horas(item.hours_saved_month);
    const valorTxt = item.cost_saved_month == null ? '—' : brl.format(item.cost_saved_month);
    return '<tr>'
      + celula(esc(item.title), 'font-weight:600;')
      + celula(esc(estagio(item.stage)))
      + celula(esc(item.area_name || '—'), 'color:#686D73;')
      + celula(esc(item.owner_name || '—'), 'color:#686D73;')
      + celula(esc(horasTxt), "font-family:'IBM Plex Mono',Consolas,monospace;")
      + celula(esc(valorTxt), "font-family:'IBM Plex Mono',Consolas,monospace;")
      + celula(esc(data), "font-family:'IBM Plex Mono',Consolas,monospace;color:#686D73;")
      + '</tr>';
  }).join('');
  return cabeca
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #DADFE5;border-radius:14px;border-collapse:separate;background:#FFFFFF;">`
    + `<tr>${cab}</tr>${corpo}</table>`;
}

export function assuntoEmail(nome: string, rotulo: string) {
  return `Pulso — ${nome} — ${rotulo}`;
}

export function htmlEmailRelatorio(
  rel: RelatorioEmail,
  ctx: { rotulo: string; dashboardUrl?: string | null },
) {
  const m = rel.metricas;
  const g = rel.ganhos;
  const v = rel.valor;
  const painel = ctx.dashboardUrl
    ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.6;"><a href="${esc(ctx.dashboardUrl)}" style="color:#1D58EE;">Abrir o painel do Pulso</a></p>`
    : '';
  const ola = rel.diretor_nome
    ? `<p style="margin:0 0 4px;font-size:14px;line-height:1.6;color:#4C5156;">Olá, ${esc(rel.diretor_nome)}</p>`
    : '';
  const diretor = rel.diretor_nome
    ? `<p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#4C5156;">Diretor: ${esc(rel.diretor_nome)}</p>`
    : '';

  return '<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;padding:0;background:#F6F7F9;">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F7F9;"><tr><td align="center" style="padding:24px 12px;">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;background:#FFFFFF;border:1px solid #DADFE5;border-radius:14px;">'
    + '<tr><td style="padding:22px 28px;background:#0F2467;border-radius:14px 14px 0 0;">'
    + '<div style="font-family:Poppins,Segoe UI,sans-serif;font-size:18px;font-weight:700;color:#FFFFFF;">Pulso</div>'
    + '<div style="margin-top:4px;font-family:Poppins,Segoe UI,sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#90D0FF;">Relatório mensal</div>'
    + '</td></tr>'
    + '<tr><td style="padding:28px;font-family:Poppins,Segoe UI,sans-serif;color:#26292C;">'
    + ola
    + `<h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:700;color:#0F2467;">${esc(rel.nome)}</h1>`
    + diretor
    + `<p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#686D73;">Posição de ${esc(ctx.rotulo)}. Cada coleção recebe as iniciativas criadas no mês e, em separado, as que já existiam e foram atualizadas.</p>`
    + '<p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#686D73;">'
    + `${esc(plural(m.criadas_no_mes, 'iniciativa criada', 'iniciativas criadas'))} e `
    + `${esc(plural(m.atualizadas_no_mes, 'atualizada', 'atualizadas'))}`
    + ' neste mês. Criadas não se repetem na segunda lista. A carga legada não entra como criação.</p>'
    + secao('Métricas')
    + grade([
      [String(m.iniciativas || 0), 'Iniciativas da área', `${m.ativas || 0} ativas · ${m.concluidas || 0} concluídas`],
      [String(m.criadas_no_mes || 0), 'Criadas no mês'],
      [String(m.atualizadas_no_mes || 0), 'Atualizadas no mês'],
      [String(m.em_alerta || 0), 'Em alerta', 'Ativas sem atualização há mais de 14 dias.'],
      [String(m.concluidas_no_mes || 0), 'Concluídas no mês'],
      [String(m.com_ia || 0), 'Com uso de IA'],
      [String(m.canceladas || 0), 'Canceladas'],
      [String(m.ativas || 0), 'Ativas agora'],
    ])
    + secao('Ganhos')
    + grade([
      [horas(g.horas_devolvidas_mes), 'Horas devolvidas por mês', 'Só iniciativas concluídas. É o ganho realizado da área.'],
      [horas(g.horas_concluidas_no_mes), 'Horas das concluídas no mês'],
      [horas(g.horas_criadas), 'Horas nas criadas no mês'],
      [horas(g.horas_atualizadas), 'Horas nas atualizadas no mês'],
    ])
    + `<p style="margin:4px 0 0;font-size:12px;line-height:1.5;color:#8A9199;">${esc(`${m.com_horas || 0} de ${m.iniciativas || 0} iniciativas com horas informadas. O portfólio inteiro da área soma ${horas(g.horas_portfolio)}/mês, em qualquer estágio.`)}</p>`
    + secao('Valor para a área')
    + grade([
      [brl.format(v.mensal_realizado || 0), 'Realizado por mês', 'Soma do R$/mês das concluídas.'],
      [brl.format(v.anual_realizado || 0), 'Realizado por ano', 'O realizado mensal vezes 12.'],
      [brl.format(v.mensal_concluidas_no_mes || 0), 'Concluídas neste mês'],
      [brl.format(v.mensal_movimento || 0), 'Movimento do mês', `${brl.format(v.mensal_criadas || 0)} nas criadas e ${brl.format(v.mensal_atualizadas || 0)} nas atualizadas. Não soma com o realizado.`],
    ])
    + `<p style="margin:4px 0 0;font-size:12px;line-height:1.5;color:#8A9199;">${esc(`${m.com_valor || 0} de ${m.iniciativas || 0} iniciativas com valor em R$ informado.`)}</p>`
    + tabela('Iniciativas criadas no mês', rel.criadas, 'criacao')
    + tabela('Iniciativas atualizadas no mês', rel.atualizadas, 'atualizacao')
    + painel
    + '</td></tr></table>'
    + '<p style="max-width:720px;margin:12px auto 0;font-family:Poppins,Segoe UI,sans-serif;font-size:12px;line-height:1.5;color:#8A9199;">Pulso · Senff. Transparência interna.</p>'
    + '</td></tr></table></body></html>';
}
