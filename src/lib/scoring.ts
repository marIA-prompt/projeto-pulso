/**
 * Matriz de Priorização de 4 Eixos (Metodologia Executiva §5).
 * O cálculo também existe como coluna GENERATED no Postgres; esta cópia
 * serve para o preview em tempo real no formulário. As duas precisam
 * concordar — mudou aqui, muda na migration.
 */
export const PESOS = {
  impacto: 0.35,
  viabilidade: 0.25,
  alinhamento: 0.25,
  urgencia: 0.15,
} as const;

export const EIXOS = [
  { key: 'impacto', label: 'Impacto no Negócio', peso: 35,
    ajuda: 'Horas/mês economizadas, receita influenciada, risco mitigado, nº de áreas beneficiadas.' },
  { key: 'viabilidade', label: 'Viabilidade Técnica', peso: 25,
    ajuda: 'Complexidade, dependências externas, maturidade da ferramenta, disponibilidade de dados.' },
  { key: 'alinhamento', label: 'Alinhamento Estratégico', peso: 25,
    ajuda: 'Aderência aos pilares da Senff: eficiência, experiência do cliente, compliance, inovação.' },
  { key: 'urgencia', label: 'Urgência / Custo da Inação', peso: 15,
    ajuda: 'Janela de oportunidade, impacto de não fazer, pressão regulatória ou competitiva.' },
] as const;

export type EixoKey = (typeof EIXOS)[number]['key'];

export function scoreFinal(n: Partial<Record<EixoKey, number | null>>): number | null {
  const { impacto, viabilidade, alinhamento, urgencia } = n;
  if (impacto == null || viabilidade == null || alinhamento == null || urgencia == null) {
    return null;
  }
  const s =
    impacto * PESOS.impacto +
    viabilidade * PESOS.viabilidade +
    alinhamento * PESOS.alinhamento +
    urgencia * PESOS.urgencia;
  return Math.round(s * 100) / 100;
}

export function classificar(score: number | null) {
  if (score == null) return { label: 'Não pontuada', tone: 'g50' as const };
  if (score >= 4.0) return { label: 'Prioridade alta', tone: 'sig-crit' as const };
  if (score >= 3.0) return { label: 'Prioridade média', tone: 'sig-warn' as const };
  return { label: 'Backlog', tone: 'g60' as const };
}

/** Gate da Metodologia Executiva §9.1: Backlog → Em Desenvolvimento exige ≥ 3,0. */
export const GATE_DESENVOLVIMENTO = 3.0;
