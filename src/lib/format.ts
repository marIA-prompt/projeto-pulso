export const nf = new Intl.NumberFormat('pt-BR');
export const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export function horas(n: number | null | undefined) {
  return n == null ? '—' : `${nf1.format(n)} h`;
}

export function dataCurta(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso));
}

export function dataLonga(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full', timeStyle: 'short',
  }).format(new Date(iso));
}

export function plural(n: number, um: string, muitos: string) {
  return `${nf.format(n)} ${n === 1 ? um : muitos}`;
}
