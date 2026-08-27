import { createHash, randomBytes } from 'node:crypto';

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

/** Token hex (64 chars) — sobrevive a cliente de e-mail que altera maiúsculas. */
export function novoTokenConvite() {
  const token = randomBytes(32).toString('hex');
  return { token, token_hash: hashToken(token) };
}

/** Hashes possíveis: token original (convites antigos em base64url) e minúsculo. */
export function hashesDoToken(raw: string) {
  const t = raw.trim();
  let decoded = t;
  try {
    decoded = decodeURIComponent(t);
  } catch {
    /* token já veio decodificado da rota */
  }
  return [...new Set([hashToken(decoded), hashToken(decoded.toLowerCase())])];
}
