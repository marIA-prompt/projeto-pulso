'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { notificar } from '@/lib/n8n';
import { createClient } from '@/lib/supabase/server';
import { carregarRelatorioMensal } from '@/lib/relatorio-mensal-dados';
import { chaveMes, parseMes } from '@/lib/relatorio-mensal';

function destino(mes: string, diretoria: string, envio: string) {
  const q = new URLSearchParams();
  if (mes) q.set('mes', mes);
  if (diretoria) q.set('diretoria', diretoria);
  q.set('envio', envio);
  return `/relatorios?${q.toString()}`;
}

export async function enviarRelatorioMensal(form: FormData) {
  await requireAdmin();
  const mesBruto = String(form.get('mes') ?? '');
  const diretoria = String(form.get('diretoria') ?? '');
  const pedido = parseMes(mesBruto);
  if (!pedido) redirect(destino('', diretoria, 'invalido'));

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  const carga = await carregarRelatorioMensal(createClient(), pedido.ano, pedido.mes, {
    dashboardUrl: base ? `${base}/dashboard` : null,
  });
  if (!carga.ok) redirect(destino(chaveMes(pedido.ano, pedido.mes), diretoria, 'erro'));

  const enviado = await notificar('W6_RELATORIO_MENSAL', carga.pacote);
  redirect(destino(chaveMes(pedido.ano, pedido.mes), diretoria, enviado ? 'ok' : 'sem-webhook'));
}

const EmailDiretor = z.string().email('Informe um e-mail válido.');

export async function salvarEmailDiretor(form: FormData) {
  await requireAdmin();
  const slug = String(form.get('slug') ?? '');
  const mes = String(form.get('mes') ?? '');
  const bruto = String(form.get('email') ?? '').trim().toLowerCase();
  if (!slug || slug === 'sem-diretoria') redirect(destino(mes, slug, 'erro'));
  if (bruto && !EmailDiretor.safeParse(bruto).success) redirect(destino(mes, slug, 'email-invalido'));

  const supabase = createClient();
  const { error } = await supabase
    .from('diretorias')
    .update({ diretor_email: bruto || null })
    .eq('slug', slug);
  redirect(destino(mes, slug, error ? 'erro' : 'email-ok'));
}
