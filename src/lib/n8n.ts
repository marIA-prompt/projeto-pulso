/**
 * Webhooks n8n. Opcionais por definição: falha aqui NUNCA derruba a
 * operação principal — o convite é criado mesmo que o e-mail não saia.
 */
type Hook = 'W1_CONVITE' | 'W2_LEMBRETE_PRESENCA' | 'W3_LEMBRETE_ATUALIZACAO' | 'W4_REPORT_EXECUTIVO';

export async function notificar(hook: Hook, payload: unknown): Promise<boolean> {
  const url = process.env[`N8N_WEBHOOK_${hook}`];
  if (!url) return false;
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
    return res.ok;
  } catch {
    return false;
  }
}
