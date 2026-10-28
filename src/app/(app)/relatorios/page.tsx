import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireGerencial } from '@/lib/auth';
import { ErroBox } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { carregarRelatorioMensal } from '@/lib/relatorio-mensal-dados';
import { chaveMes, mesAtual, mesPedido } from '@/lib/relatorio-mensal';
import { enviarRelatorioMensal } from './actions';
import { RelatorioView } from './RelatorioView';

export const metadata = { title: 'Relatório mensal — Pulso' };
export const dynamic = 'force-dynamic';

function urlDoPainel(): string | null {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  return base ? `${base}/dashboard` : null;
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { mes?: string; diretoria?: string; envio?: string };
}) {
  const perfil = await requireGerencial();
  const pedido = mesPedido({ mes: searchParams.mes }, mesAtual());

  if ('erro' in pedido) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Por diretoria</h1>
        <ErroBox mensagem={pedido.erro} />
        <Link href="/relatorios" className="text-sm font-medium text-[var(--blue)] hover:underline">
          Voltar ao mês atual
        </Link>
      </div>
    );
  }

  const carga = await carregarRelatorioMensal(createClient(), pedido.ano, pedido.mes, {
    dashboardUrl: urlDoPainel(),
  });

  if (!carga.ok) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Por diretoria</h1>
        <ErroBox mensagem={carga.erro} />
        {carga.detalhe && <p className="text-xs text-g50">{carga.detalhe}</p>}
      </div>
    );
  }

  const slugs = new Set(carga.pacote.relatorios.map((r) => r.slug));
  const selecionada = searchParams.diretoria && slugs.has(searchParams.diretoria)
    ? searchParams.diretoria
    : (carga.pacote.relatorios[0]?.slug ?? '');

  const podeEnviar = perfil.role === 'administrador';

  return (
    <div className="space-y-6">
      <RelatorioView
        pacote={carga.pacote}
        selecionada={selecionada}
        envio={searchParams.envio}
      />
      {podeEnviar && (
        <form action={enviarRelatorioMensal} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="max-w-xl text-sm text-g60">
            Dispara o mesmo pacote que o cron do dia 1 entrega ao n8n: um relatório
            por diretoria, com métricas, ganhos e valor.
          </p>
          <input type="hidden" name="mes" value={chaveMes(pedido.ano, pedido.mes)} />
          <input type="hidden" name="diretoria" value={selecionada} />
          <Button type="submit">Enviar relatórios do mês</Button>
        </form>
      )}
    </div>
  );
}
