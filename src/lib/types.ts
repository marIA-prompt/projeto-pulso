export type Role = 'leitor' | 'participante' | 'editor' | 'gerencial' | 'administrador';

export const PAPEIS: Role[] = ['leitor', 'participante', 'editor', 'gerencial', 'administrador'];

export const ROLE_LABEL: Record<Role, string> = {
  leitor: 'Leitor',
  participante: 'Participante',
  editor: 'Editor',
  gerencial: 'Gerencial',
  administrador: 'Administrador',
};
export type AttendanceStatus = 'pending' | 'present' | 'absent';
export type Signal = 'ok' | 'warn' | 'crit' | 'done';

export const STAGES = [
  'ideia', 'backlog', 'priorizacao', 'em_desenvolvimento',
  'em_teste', 'concluido', 'showcase', 'cancelado',
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  ideia: 'Ideia',
  backlog: 'Backlog',
  priorizacao: 'Priorização',
  em_desenvolvimento: 'Em Desenvolvimento',
  em_teste: 'Em Teste',
  concluido: 'Concluído',
  showcase: 'Showcase',
  cancelado: 'Cancelado',
};

/** Linha da view v_projects_dashboard. */
export type DashboardRow = {
  id: string;
  title: string;
  stage: Stage;
  theme: string | null;
  directorate: string | null;
  area_name: string | null;
  uses_ai: boolean | null;
  uses_n8n: boolean | null;
  hours_saved_month: number | null;
  score_final: number | null;
  scoring_source: 'matriz_4_eixos' | 'legado' | 'nao_pontuado';
  legacy_priority: string | null;
  last_activity_at: string;
  dias_sem_atualizacao: number;
  sinal: Signal;
  alerta_14_dias: boolean;
  description: string | null;
  cost_saved_month: number | null;
};

export type PortfolioKpis = {
  total_iniciativas: number;
  concluidas: number;
  ativas: number;
  horas_mes_devolvidas: number;
  horas_mes_portfolio_total: number;
  areas_com_iniciativa: number;
  com_uso_de_ia: number;
};

export type AttendanceKpi = {
  meeting_id: string;
  title: string;
  scheduled_at: string;
  convidados: number;
  confirmaram: number;
  presentes: number;
  taxa_confirmacao: number | null;
  taxa_presenca: number | null;
};

export type ExperienceLevel = 'iniciante' | 'intermediario' | 'avancado' | 'especialista';

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'iniciante', 'intermediario', 'avancado', 'especialista',
];

export const EXPERIENCE_LABEL: Record<ExperienceLevel, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
  especialista: 'Especialista',
};

/** Perfil de comunidade (Hub). Reúne os campos de profiles usados no Hub. */
export type HubProfile = {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  experience_level: ExperienceLevel | null;
  languages: string[];
  automations: string[];
  interests: string[];
  projects_done: string | null;
  contact: string | null;
  available: boolean;
  role: Role;
  area_name: string | null;
};

export const ROLE_RANK: Record<Role, number> = {
  leitor: 1,
  participante: 2,
  editor: 3,
  gerencial: 4,
  administrador: 5,
};

export function hasRoleAtLeast(role: Role | string | null | undefined, min: Role): boolean {
  return (ROLE_RANK[role as Role] ?? 0) >= ROLE_RANK[min];
}