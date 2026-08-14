export const nf = new Intl.NumberFormat('pt-BR');
export const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

// Todo o sistema exibe datas no fuso do Brasil (America/São Paulo),
// independentemente do fuso do servidor onde a aplicação está hospedada.
const TZ = 'America/Sao_Paulo';

export const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
});

export function moeda(n: number | null | undefined) {
  return n == null ? '—' : brl.format(n);
}

export function horas(n: number | null | undefined) {
  return n == null ? '—' : `${nf1.format(n)} h`;
}

export function dataCurta(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: TZ }).format(new Date(iso));
}

export function dataHora(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: TZ,
  }).format(new Date(iso));
}

export function dataLonga(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full', timeStyle: 'short', timeZone: TZ,
  }).format(new Date(iso));
}

export function plural(n: number, um: string, muitos: string) {
  return `${nf.format(n)} ${n === 1 ? um : muitos}`;
}
