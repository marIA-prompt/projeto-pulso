/**
 * De-para das áreas antigas do portfólio para a diretoria canônica.
 *
 * A área operacional continua com o nome herdado (Operações, Comercial PF…).
 * A diretoria da iniciativa — filtro do acompanhamento, cadastro e Lei do Bem —
 * sai daqui. Os slugs são os da tabela `diretorias` (migrations 0017–0019).
 *
 * Grafia unificada: "Área de Rh" fica "Área de RH" e
 * "Áre Pós Vendas Private Label" fica "Área Pós Vendas Private Label".
 */

import { DIRETORIAS_CADASTRO } from './diretorias-catalogo';

export const MAPA_AREA_DIRETORIA: readonly (readonly [string, string, string])[] = [
  ['Comercial PF', 'Área Adquirência e Marketplace', 'adquirencia-marketplace'],
  ['Fraudes', 'Área Tecnologia da Informação', 'tecnologia-informacao'],
  ['Crédito PF', 'Área Crédito/Cobrança', 'credito-cobranca'],
  ['Credenciamento', 'Área Adquirência e Marketplace', 'adquirencia-marketplace'],
  ['Jurídico', 'Área de RH', 'recursos-humanos'],
  ['Compras, Manutenção e Zeladoria', 'Área de RH', 'recursos-humanos'],
  ['Private Label', 'Área Vendas Varejo Expansão', 'vendas-varejo-expansao'],
  ['DHO', 'Área de RH', 'recursos-humanos'],
  ['RH', 'Área de RH', 'recursos-humanos'],
  ['Cobrança', 'Área Crédito/Cobrança', 'credito-cobranca'],
  ['Seguros', 'Área de Seguros', 'seguros'],
  ['Pós Vendas - Private Label', 'Área Pós Vendas Private Label', 'pos-vendas-private-label'],
  ['Departamento Controladoria - Riscos', 'Área Controladoria', 'controladoria'],
  ['Produtos Financeiros', 'Área de Tesouraria e Captação', 'tesouraria-captacao'],
  ['Comercial PJ', 'Área Comercial PJ', 'comercial-pj'],
  ['Financeiro / Contas a Receber', 'Área Controladoria', 'controladoria'],
  ['Atendimento', 'Área Operações e Atendimento', 'operacoes-atendimento'],
  ['Departamento Controladoria - Controladoria', 'Área Controladoria', 'controladoria'],
  ['Operações', 'Área Operações e Atendimento', 'operacoes-atendimento'],
  ['Consignado', 'Área Consignado', 'consignado'],
  ['Crédito PJ', 'Área Crédito/Cobrança', 'credito-cobranca'],
  ['Portfólio Projetos Estratégicos', 'Área Tecnologia da Informação', 'tecnologia-informacao'],
  ['Financeiro - Tesouraria', 'Área de Tesouraria e Captação', 'tesouraria-captacao'],
  ['Departamento Controladoria - Carteiras e Regulatórios', 'Área Controladoria', 'controladoria'],
  ['Banco PJ', 'Área Comercial PJ', 'comercial-pj'],
  ['Frota', 'Área de RH', 'recursos-humanos'],
  ['TI', 'Área Tecnologia da Informação', 'tecnologia-informacao'],
  ['Departamento Controladoria - Fiscal', 'Área Controladoria', 'controladoria'],
  ['Marketplace', 'Área Adquirência e Marketplace', 'adquirencia-marketplace'],
  ['Marketing', 'Área Adquirência e Marketplace', 'adquirencia-marketplace'],
  ['Departamento Controladoria - Contabilidade', 'Área Controladoria', 'controladoria'],
  ['Compliance', 'Área de RH', 'recursos-humanos'],
];

/** Grafias legadas que já apontam para uma área canônica no banco. */
export const ALIASES_AREA: readonly (readonly [string, string])[] = [
  ['BANCO PJ', 'Banco PJ'],
  ['COMPLIANCE', 'Compliance'],
  ['Credito PJ', 'Crédito PJ'],
  ['Rh', 'RH'],
  ['FROTA', 'Frota'],
  ['COMPRAS, FROTA E ZELADORIA', 'Compras, Manutenção e Zeladoria'],
  ['Compras, Frota e Zeladoria', 'Compras, Manutenção e Zeladoria'],
  ['COMPRAS, MANUENÇÃO E ZELADORIA', 'Compras, Manutenção e Zeladoria'],
  ['MANUTENÇÃO/COMPRAS  E ZELADORIA', 'Compras, Manutenção e Zeladoria'],
  ['ZELADORIA E COMPRAS', 'Compras, Manutenção e Zeladoria'],
  ['Produtos Financeiros / Produtos Financeiros', 'Produtos Financeiros'],
  ['Produtos Financeiros / Consignado', 'Consignado'],
];

/** Texto livre que já é a diretoria, com grafia torta. */
const APELIDOS_DIRETORIA: readonly (readonly [string, string])[] = [
  ['Áre Pós Vendas Private Label', 'Área Pós Vendas Private Label'],
  ['Área de Rh', 'Área de RH'],
  ['Controladoria', 'Área Controladoria'],
  ['CONTROLADORIA', 'Área Controladoria'],
  ['Pós Vendas Private Label', 'Área Pós Vendas Private Label'],
  ['Crédito / Cobrança', 'Área Crédito/Cobrança'],
  ['Crédito Cobrança', 'Área Crédito/Cobrança'],
  ['Operações e Atendimento', 'Área Operações e Atendimento'],
  ['Tecnologia da Informação', 'Área Tecnologia da Informação'],
  ['Vendas Varejo Expansão', 'Área Vendas Varejo Expansão'],
  ['Tesouraria', 'Área de Tesouraria e Captação'],
  ['Tesouraria e Captação', 'Área de Tesouraria e Captação'],
  ['Recursos Humanos', 'Área de RH'],
  ['Área Recursos Humanos', 'Área de RH'],
];

export function chaveArea(valor: string | null | undefined): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const porArea = new Map<string, string>();
for (const [area, diretoria] of MAPA_AREA_DIRETORIA) {
  porArea.set(chaveArea(area), diretoria);
}
for (const [alias, canon] of ALIASES_AREA) {
  const diretoria = porArea.get(chaveArea(canon));
  if (diretoria) porArea.set(chaveArea(alias), diretoria);
}

export const DIRETORIAS: readonly string[] = Array.from(
  new Set(MAPA_AREA_DIRETORIA.map(([, diretoria]) => diretoria)),
).sort((a, b) => a.localeCompare(b, 'pt-BR'));

const porDiretoria = new Map<string, string>();
for (const nome of DIRETORIAS_CADASTRO) porDiretoria.set(chaveArea(nome), nome);
for (const diretoria of DIRETORIAS) porDiretoria.set(chaveArea(diretoria), diretoria);
for (const [apelido, diretoria] of APELIDOS_DIRETORIA) {
  porDiretoria.set(chaveArea(apelido), diretoria);
}

/** Diretoria da área, ou null se a área não está no de-para. */
export function diretoriaDaArea(area: string | null | undefined): string | null {
  const chave = chaveArea(area);
  if (!chave) return null;
  return porArea.get(chave) ?? null;
}

/**
 * Aceita a diretoria já canônica, um apelido dela, ou o nome antigo da área
 * (e os aliases de grafia). Nome de pessoa e texto solto viram null.
 */
export function diretoriaDeTexto(valor: string | null | undefined): string | null {
  const chave = chaveArea(valor);
  if (!chave) return null;
  return porDiretoria.get(chave) ?? porArea.get(chave) ?? null;
}

/** A área manda. O texto da diretoria só entra quando a área não tem de-para. */
export function diretoriaExibida(
  area: string | null | undefined,
  diretoria: string | null | undefined,
): string | null {
  return diretoriaDaArea(area) ?? diretoriaDeTexto(diretoria);
}

/**
 * O que gravar em projects.directorate.
 * Área mapeada substitui o texto (nome de pessoa, grafia antiga).
 * Sem área, preserva diretoria canônica ou o texto que não reconhecemos.
 */
export function diretoriaParaGravar(
  area: string | null | undefined,
  diretoria: string | null | undefined,
): string | null {
  const daArea = diretoriaDaArea(area);
  if (daArea) return daArea;
  const doTexto = diretoriaDeTexto(diretoria);
  if (doTexto) return doTexto;
  const texto = diretoria?.trim();
  return texto ? texto : null;
}
