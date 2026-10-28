import { timingSafeEqual } from 'node:crypto';

/** Compara o segredo do cron sem curto-circuitar no conteúdo. */
export function segredoConfere(informado: string | null | undefined, esperado: string | null | undefined): boolean {
  if (!informado || !esperado) return false;
  const a = Buffer.from(informado);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
