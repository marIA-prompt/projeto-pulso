import { createAdminClient } from '@/lib/supabase/admin';
import { carregarRelatorioMensal } from '@/lib/relatorio-mensal-dados';
import { mesAnterior, mesPedido } from '@/lib/relatorio-mensal';
import { segredoConfere } from '@/lib/segredo-cron';

export const dynamic = 'force-dynamic';

function segredoDoPedido(req: Request): string | null {
  const header = req.headers.get('x-pulso-secret');
  if (header) return header;
  const auth = req.headers.get('authorization') ?? '';
  return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : null;
}

/**
 * Cron do W6. Sem `mes`, devolve o mês anterior em America/Sao_Paulo —
 * o recorte que fecha no dia 1. Com `?mes=AAAA-MM`, devolve aquele mês.
 */
export async function GET(req: Request) {
  const esperado = process.env.N8N_WEBHOOK_SECRET;
  if (!esperado) {
    return Response.json({ erro: 'N8N_WEBHOOK_SECRET ausente no servidor.' }, { status: 503 });
  }
  if (!segredoConfere(segredoDoPedido(req), esperado)) {
    return Response.json({ erro: 'Não autorizado.' }, { status: 401 });
  }

  const url = new URL(req.url);
  const pedido = mesPedido({ mes: url.searchParams.get('mes') }, mesAnterior());
  if ('erro' in pedido) {
    return Response.json({ erro: pedido.erro }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Service role ausente.';
    return Response.json({ erro: msg }, { status: 503 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  const carga = await carregarRelatorioMensal(admin, pedido.ano, pedido.mes, {
    dashboardUrl: base ? `${base}/dashboard` : null,
  });
  if (!carga.ok) {
    return Response.json({ erro: carga.erro, detalhe: carga.detalhe ?? null }, { status: 500 });
  }
  return Response.json(carga.pacote);
}
