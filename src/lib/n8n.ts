/**
 * Webhooks n8n. Opcionais por definição: falha aqui NUNCA derruba a
 * operação principal — o convite é criado mesmo que o e-mail não saia.
 */
type Hook = 'W1_CONVITE' | 'W2_LEMBRETE_PRESENCA' | 'W3_LEMBRETE_ATUALIZACAO' | 'W4_REPORT_EXECUTIVO' | 'W6_RELATORIO_MENSAL';

export type ResultadoEnvio = 'ok' | 'sem-url' | 'falha';

export async function notificar(hook: Hook, payload: unknown): Promise<boolean> {
  return (await notificarComStatus(hook, payload)) === 'ok';
}

/**
 * Igual a `notificar`, mas diz por que não foi: variável ausente na
 * Vercel ('sem-url') é diferente de o n8n não responder ou recusar ('falha').
 */
export async function notificarComStatus(hook: Hook, payload: unknown): Promise<ResultadoEnvio> {
  const url = process.env[`N8N_WEBHOOK_${hook}`];
  if (!url) return 'sem-url';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { 'X-Pulso-Secret': process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? 'ok' : 'falha';
  } catch {
    return 'falha';
  }
}
