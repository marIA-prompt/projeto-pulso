import { clsx } from '@/lib/clsx';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
};

export function Button({ variant = 'primary', className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-s px-4 py-2 text-sm font-semibold',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-[var(--blue)] text-white hover:bg-[var(--blue-2)]',
        variant === 'ghost' && 'border border-g40 bg-[var(--white)] text-g80 hover:bg-g20',
        variant === 'danger' && 'border border-[var(--sig-crit)] text-[var(--sig-crit)] hover:bg-[var(--sig-crit-bg)]',
        className,
      )}
    />
  );
}
