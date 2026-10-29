import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { ErroBox } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { carregarRelatorioMensal } from '@/lib/relatorio-mensal-dados';
import { chaveMes, mesAtual, mesPedido } from '@/lib/relatorio-mensal';
import { enviarRelatorioMensal, salvarEmailDiretor } from './actions';
import { PreviaEmail } from './PreviaEmail';
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
  await requireAdmin();
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

  const rel = carga.pacote.relatorios.find((r) => r.slug === selecionada) ?? carga.pacote.relatorios[0];
  const mesChave = chaveMes(pedido.ano, pedido.mes);

  return (
    <div className="space-y-6">
      <RelatorioView
        pacote={carga.pacote}
        selecionada={selecionada}
        envio={searchParams.envio}
      />
      {rel && rel.slug !== 'sem-diretoria' && (
        <form action={salvarEmailDiretor} className="card space-y-4 p-4">
          <div className="min-w-0">
            <label className="label" htmlFor="email-diretor">
              E-mail de {rel.diretor_nome ?? rel.nome}
            </label>
            <input
              id="email-diretor"
              name="email"
              type="email"
              className="field mt-1"
              placeholder="diretor@senff.com.br"
              defaultValue={rel.diretor_email ?? ''}
            />
          </div>
          <div className="min-w-0">
            <label className="label" htmlFor="emails-copia">
              E-mails em cópia (opcional)
            </label>
            <textarea
              id="emails-copia"
              name="copia"
              rows={3}
              className="field mt-1"
              placeholder="pessoa@senff.com.br, outra@senff.com.br"
              defaultValue={rel.emails_copia.join(', ')}
            />
            <p className="mt-1 text-xs leading-relaxed text-g50">
              Separe por vírgula. Estas pessoas recebem o mesmo relatório, no envio manual e no dia 1.
            </p>
          </div>
          <input type="hidden" name="slug" value={rel.slug} />
          <input type="hidden" name="mes" value={mesChave} />
          <input type="hidden" name="diretoria" value={rel.slug} />
          <Button type="submit" variant="ghost">Salvar e-mails</Button>
        </form>
      )}
      {rel && (
        <PreviaEmail
          rel={rel}
          rotulo={carga.pacote.rotulo}
          dashboardUrl={carga.pacote.dashboard_url}
        />
      )}
      {rel && rel.slug !== 'sem-diretoria' && (
        <form action={enviarRelatorioMensal} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-sm leading-relaxed text-g60">
            {rel.diretor_email ? (
              <>
                Envia agora o relatório de <strong>{rel.nome}</strong> deste mês para{' '}
                <strong>{rel.diretor_email}</strong>
                {rel.emails_copia.length > 0 && <>, com cópia para {rel.emails_copia.join(', ')}</>}.
                {' '}Só esta diretoria. As demais saem no envio automático do dia 1.
              </>
            ) : (
              <>Salve o e-mail do diretor de <strong>{rel.nome}</strong> para liberar o envio.</>
            )}
          </p>
          <input type="hidden" name="mes" value={mesChave} />
          <input type="hidden" name="diretoria" value={rel.slug} />
          <Button type="submit" disabled={!rel.diretor_email}>Enviar relatório desta diretoria</Button>
        </form>
      )}
    </div>
  );
}
