import { clsx } from '@/lib/clsx';
import {
  LDB_CLASSIFICACAO_LABEL, LDB_CLASSIFICACAO_TONE,
  LDB_STATUS_LABEL, LDB_STATUS_TONE,
  LDB_PRIORIDADE_LABEL,
  type LdbClassificacao, type LdbStatus, type LdbPrioridade,
} from '@/lib/leiDoBem';

/** Paleta semântica já existente no app (semáforo) — nenhum hex novo. */
const TONE_CLASS = {
  ok: 'bg-[var(--sig-ok-bg)] text-[var(--sig-ok)]',
  warn: 'bg-[var(--sig-warn-bg)] text-[var(--sig-warn)]',
  crit: 'bg-[var(--sig-crit-bg)] text-[var(--sig-crit)]',
  done: 'bg-[var(--sig-done-bg)] text-[var(--sig-done)]',
  neutro: 'bg-g20 text-g60',
} as const;

export function BadgeClassificacao({
  classificacao, className,
}: { classificacao: LdbClassificacao | null; className?: string }) {
  const c = classificacao ?? 'pendente';
  return (
    <span className={clsx(
      'inline-flex items-center whitespace-nowrap rounded-s px-2 py-0.5 text-xs font-medium',
      TONE_CLASS[LDB_CLASSIFICACAO_TONE[c]], className,
    )}>
      {LDB_CLASSIFICACAO_LABEL[c]}
    </span>
  );
}

export function BadgeStatus({ status, className }: { status: LdbStatus; className?: string }) {
  return (
    <span className={clsx(
      'inline-flex items-center whitespace-nowrap rounded-s px-2 py-0.5 text-xs font-medium',
      TONE_CLASS[LDB_STATUS_TONE[status]], className,
    )}>
      {LDB_STATUS_LABEL[status]}
    </span>
  );
}

export function BadgePrioridade({
  prioridade, className,
}: { prioridade: LdbPrioridade | null; className?: string }) {
  if (!prioridade) return <span className={clsx('text-xs text-g50', className)}>—</span>;
  const tone = prioridade === 'alta' ? 'crit' : prioridade === 'media' ? 'warn' : 'neutro';
  return (
    <span className={clsx(
      'inline-flex items-center whitespace-nowrap rounded-s px-2 py-0.5 text-xs font-medium',
      TONE_CLASS[tone], className,
    )}>
      {LDB_PRIORIDADE_LABEL[prioridade]}
    </span>
  );
}
