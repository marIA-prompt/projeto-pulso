'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { notificarComStatus } from '@/lib/n8n';
import { createClient } from '@/lib/supabase/server';
import { carregarRelatorioMensal } from '@/lib/relatorio-mensal-dados';
import { copiaVisivel, separarEmailsCopia } from '@/lib/emails-copia';
import { cargaDisparoManual, chaveMes, parseMes } from '@/lib/relatorio-mensal';

function destino(mes: string, diretoria: string, envio: string) {
  const q = new URLSearchParams();
  if (mes) q.set('mes', mes);
  if (diretoria) q.set('diretoria', diretoria);
  q.set('envio', envio);
  return `/relatorios?${q.toString()}`;
}

/**
 * Disparo manual do W6: uma diretoria por vez. A tela manda a diretoria
 * selecionada e o e-mail dela; o n8n relê o Supabase, filtra por `diretoria`
 * e envia só esse relatório. O envio de todas fica com o agendamento do dia 1.
 */
export async function enviarRelatorioMensal(form: FormData) {
  await requireAdmin();
  const mesBruto = String(form.get('mes') ?? '');
  const diretoria = String(form.get('diretoria') ?? '');
  const pedido = parseMes(mesBruto);
  if (!pedido) redirect(destino('', diretoria, 'invalido'));
  const mes = chaveMes(pedido.ano, pedido.mes);
  if (!diretoria || diretoria === 'sem-diretoria') redirect(destino(mes, diretoria, 'erro'));

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  const carga = await carregarRelatorioMensal(createClient(), pedido.ano, pedido.mes, {
    dashboardUrl: base ? `${base}/dashboard` : null,
  });
  if (!carga.ok) redirect(destino(mes, diretoria, 'erro'));

  const rel = carga.pacote.relatorios.find((r) => r.slug === diretoria);
  if (!rel) redirect(destino(mes, diretoria, 'erro'));
  if (!rel.diretor_email) redirect(destino(mes, diretoria, 'sem-email'));

  const resultado = await notificarComStatus('W6_RELATORIO_MENSAL', cargaDisparoManual(pedido, rel));
  const envio = resultado === 'ok' ? 'ok' : resultado === 'sem-url' ? 'sem-webhook' : 'falha-webhook';
  redirect(destino(mes, diretoria, envio));
}

const EmailDiretor = z.string().email('Informe um e-mail válido.');

export async function salvarEmailDiretor(form: FormData) {
  await requireAdmin();
  const slug = String(form.get('slug') ?? '');
  const mes = String(form.get('mes') ?? '');
  const bruto = String(form.get('email') ?? '').trim().toLowerCase();
  const copias = separarEmailsCopia(String(form.get('copia') ?? ''));
  if (!slug || slug === 'sem-diretoria') redirect(destino(mes, slug, 'erro'));
  if (bruto && !EmailDiretor.safeParse(bruto).success) redirect(destino(mes, slug, 'email-invalido'));
  if (!copias.ok) redirect(destino(mes, slug, 'email-invalido'));

  const supabase = createClient();
  const { error } = await supabase
    .from('diretorias')
    .update({
      diretor_email: bruto || null,
      emails_copia: copiaVisivel(copias.emails, bruto || null),
    })
    .eq('slug', slug);
  redirect(destino(mes, slug, error ? 'erro' : 'email-ok'));
}
