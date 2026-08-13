import { clsx } from '@/lib/clsx';

export function Card({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={clsx('card p-4', className)} />;
}

export function Empty({ titulo, acao }: { titulo: string; acao?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <p className="text-sm text-g60">{titulo}</p>
      {acao}
    </div>
  );
}

export function ErroBox({ mensagem }: { mensagem: string }) {
  return (
    <p
      role="alert"
      className="rounded-s border border-[var(--sig-crit)] bg-[var(--sig-crit-bg)] px-3 py-2 text-sm text-[var(--sig-crit)]"
    >
      {mensagem}
    </p>
  );
}
