import { z } from 'zod';

const Email = z.string().email();
const LIMITE = 20;

/** Lista digitada no formulário: vírgula, ponto e vírgula ou quebra de linha. */
export function separarEmailsCopia(bruto: string): { ok: true; emails: string[] } | { ok: false } {
  const partes = bruto
    .split(/[,;\n]+/)
    .map((parte) => parte.trim().toLowerCase())
    .filter(Boolean);
  if (partes.length > LIMITE) return { ok: false };

  const vistos = new Set<string>();
  const emails: string[] = [];
  for (const parte of partes) {
    if (!Email.safeParse(parte).success) return { ok: false };
    if (vistos.has(parte)) continue;
    vistos.add(parte);
    emails.push(parte);
  }
  return { ok: true, emails };
}

/** Cópia que o Zoho recebe: sem o destinatário principal e sem repetição. */
export function copiaVisivel(
  emails: readonly string[] | null | undefined,
  diretor: string | null | undefined,
): string[] {
  const para = (diretor ?? '').trim().toLowerCase();
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const item of emails ?? []) {
    const email = String(item ?? '').trim().toLowerCase();
    if (!email || email === para || vistos.has(email)) continue;
    vistos.add(email);
    saida.push(email);
  }
  return saida;
}
