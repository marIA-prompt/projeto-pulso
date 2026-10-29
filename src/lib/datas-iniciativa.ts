/** Mês de início (YYYY-MM) ↔ data gravada no dia 1. */

export function mesParaData(mes: string | null | undefined): string | null {
  const t = (mes ?? '').trim();
  const m = /^(\d{4})-(\d{2})$/.exec(t);
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return `${m[1]}-${m[2]}-01`;
}

/** Aceita YYYY-MM ou YYYY-MM-DD e devolve o valor do input type="month". */
export function dataParaMes(data: string | null | undefined): string {
  const m = /^(\d{4}-\d{2})/.exec((data ?? '').trim());
  return m ? m[1] : '';
}

/** "Outubro de 2026", ou null se a data não tiver mês. */
export function rotuloMesInicio(data: string | null | undefined): string | null {
  const mes = dataParaMes(data);
  if (!mes) return null;
  const [y, m] = mes.split('-').map(Number);
  const rotulo = new Intl.DateTimeFormat('pt-BR', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, 1)));
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
}
