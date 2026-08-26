'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { STAGES, hasRoleAtLeast } from '@/lib/types';
import { LDB_CAMPOS_TEXTO, LDB_TRIAGEM_CAMPOS } from '@/lib/leiDoBem';

// A Matriz de Priorização (4 eixos) saiu do cadastro de iniciativa — os
// campos score_* não são mais lidos nem gravados aqui. As colunas existem
// no banco como dado histórico e o gate de estágio foi removido na
// migration 0010 (sem os eixos no formulário, ele bloquearia todo o fluxo).
const Projeto = z.object({
  title: z.string().min(3, 'O título precisa de pelo menos 3 caracteres.'),
  description: z.string().optional(),
  stage: z.enum(STAGES),
  theme: z.string().optional(),
  area_id: z.string().uuid().nullable().catch(null),
  owner_id: z.string().uuid().nullable().catch(null),
  directorate: z.string().optional(),
  uses_ai: z.coerce.boolean(),
  uses_n8n: z.coerce.boolean(),
  hours_saved_month: z.coerce.number().min(0).nullable().catch(null),
  target_date: z.string().optional(),
  links: z.string().optional(),
  notes: z.string().optional(),
});

export type EstadoProjeto = { erro?: string };

function ler(form: FormData) {
  const vazio = (v: FormDataEntryValue | null) => (v === '' || v == null ? null : v);
  return Projeto.safeParse({
    title: form.get('title'),
    description: form.get('description') ?? '',
    stage: form.get('stage'),
    theme: form.get('theme') ?? '',
    area_id: vazio(form.get('area_id')),
    owner_id: vazio(form.get('owner_id')),
    directorate: form.get('directorate') ?? '',
    uses_ai: form.get('uses_ai') === 'on',
    uses_n8n: form.get('uses_n8n') === 'on',
    hours_saved_month: vazio(form.get('hours_saved_month')),
    target_date: form.get('target_date') ?? '',
    links: form.get('links') ?? '',
    notes: form.get('notes') ?? '',
  });
}

const RespostaTriagem = z.enum(['sim', 'parcialmente', 'nao', 'nao_sei']).nullable().catch(null);

/**
 * Bloco Lei do Bem do wizard (Grupos 1, 2 e 3 — §6.1). Retorna null quando a
 * pessoa marcou "não" no opt-in: nada é gravado e uma avaliação já existente
 * é mantida intacta. A classificação/índice/síntese NÃO são calculados aqui —
 * o trigger do Postgres (fonte de verdade, migration 0010) recalcula a cada
 * escrita. Nenhum resultado da triagem bloqueia o salvamento.
 */
function lerLeiDoBem(form: FormData): Record<string, string | null> | null {
  if (form.get('ldb_optin') !== 'sim') return null;
  const vazio = (v: FormDataEntryValue | null) => {
    const s = v == null ? '' : String(v).trim();
    return s === '' ? null : s;
  };
  const payload: Record<string, string | null> = {};
  for (const campo of LDB_CAMPOS_TEXTO) payload[campo] = vazio(form.get(campo));
  for (const campo of LDB_TRIAGEM_CAMPOS) {
    payload[campo] = RespostaTriagem.parse(vazio(form.get(campo)));
  }
  return payload;
}

export async function criarProjeto(_prev: EstadoProjeto, form: FormData): Promise<EstadoProjeto> {
  const perfil = await requireUser();
  // Leitor é observador: só lê. A RLS já barra no banco; aqui a mensagem
  // fica clara em vez de um erro genérico de escrita.
  if (!hasRoleAtLeast(perfil.role, 'participante')) {
    return { erro: 'Seu perfil é somente leitura. Peça a um administrador para elevar seu papel para cadastrar iniciativas.' };
  }
  const parsed = ler(form);
  if (!parsed.success) return { erro: parsed.error.issues[0].message };
  const leiDoBem = lerLeiDoBem(form);

  const supabase = createClient();
  const { data: criado, error } = await supabase.from('projects').insert({
    ...parsed.data,
    target_date: parsed.data.target_date || null,
    owner_id: parsed.data.owner_id ?? perfil.id,
  }).select('id').single();

  if (error || !criado) {
    return { erro: 'Não foi possível salvar a iniciativa. Revise os campos e tente de novo.' };
  }

  if (leiDoBem) {
    const { error: erroLdb } = await supabase
      .from('lei_do_bem_avaliacoes')
      .insert({ project_id: criado.id, ...leiDoBem });
    if (erroLdb) {
      return {
        erro: 'A iniciativa foi criada, mas a avaliação Lei do Bem não pôde ser salva. Abra a iniciativa em Iniciativas e tente salvar o bloco de novo.',
      };
    }
  }

  revalidatePath('/projetos');
  revalidatePath('/dashboard');
  revalidatePath('/lei-do-bem');
  redirect('/projetos?ok=criada');
}

export async function atualizarProjeto(
  id: string, _prev: EstadoProjeto, form: FormData,
): Promise<EstadoProjeto> {
  await requireUser();
  const parsed = ler(form);
  if (!parsed.success) return { erro: parsed.error.issues[0].message };
  const leiDoBem = lerLeiDoBem(form);

  const supabase = createClient();
  // A RLS decide se esta pessoa pode escrever nesta linha. Se não puder,
  // o update afeta zero linhas — não vaza a existência do registro.
  const { error, count } = await supabase
    .from('projects')
    .update({
      ...parsed.data,
      target_date: parsed.data.target_date || null,
    }, { count: 'exact' })
    .eq('id', id);

  if (error) return { erro: 'Não foi possível salvar as alterações.' };
  if (!count) return { erro: 'Você só pode editar iniciativas das quais é dono.' };

  if (leiDoBem) {
    // 1:1 com projects (unique project_id): upsert cobre primeira avaliação
    // e reedição. Os campos de auditoria (status, parecer…) não entram no
    // payload — ficam intocados e são editados só na aba Lei do Bem.
    const { error: erroLdb } = await supabase
      .from('lei_do_bem_avaliacoes')
      .upsert({ project_id: id, ...leiDoBem }, { onConflict: 'project_id' });
    if (erroLdb) {
      return { erro: 'As alterações da iniciativa foram salvas, mas a avaliação Lei do Bem não. Tente de novo.' };
    }
  }

  revalidatePath('/projetos');
  revalidatePath('/dashboard');
  revalidatePath('/lei-do-bem');
  redirect('/projetos?ok=atualizada');
}

export type EstadoMover = { ok?: boolean; erro?: string };

/** Move uma iniciativa de raia no Kanban. A RLS decide se a pessoa pode
 * escrever nesta linha (dono, ou gerencial+ para qualquer uma). */
export async function moverEstagio(id: string, novoEstagio: string): Promise<EstadoMover> {
  const perfil = await requireUser();
  if (!hasRoleAtLeast(perfil.role, 'participante')) {
    return { erro: 'Seu perfil é somente leitura.' };
  }
  if (!STAGES.includes(novoEstagio as (typeof STAGES)[number])) {
    return { erro: 'Estágio inválido.' };
  }

  const supabase = createClient();
  const { error, count } = await supabase
    .from('projects')
    .update({ stage: novoEstagio }, { count: 'exact' })
    .eq('id', id)
    .is('archived_at', null);

  if (error) {
    return { erro: 'Não foi possível mover a iniciativa. Tente de novo.' };
  }
  if (!count) {
    return { erro: 'Você só pode mover iniciativas das quais é dono (ou ter papel gerencial+).' };
  }

  revalidatePath('/projetos');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function arquivarProjeto(id: string) {
  await requireUser();
  const supabase = createClient();
  await supabase.from('projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  revalidatePath('/projetos');
  revalidatePath('/dashboard');
}
