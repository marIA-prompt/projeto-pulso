'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { STAGES, hasRoleAtLeast } from '@/lib/types';
import {
  GRUPO1_CAMPOS,
  GRUPO2_CAMPOS,
  LEI_DO_BEM_RESPOSTAS,
  TRIAGEM_CAMPOS,
} from '@/lib/lei-do-bem';

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

const Resposta = z.enum(LEI_DO_BEM_RESPOSTAS).nullable().catch(null);

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

function texto(form: FormData, name: string): string | null {
  const v = form.get(name);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

function lerLeiDoBem(form: FormData) {
  const campos: Record<string, string | null> = {};
  for (const c of [...GRUPO1_CAMPOS, ...GRUPO2_CAMPOS]) {
    campos[c.name] = texto(form, c.name);
  }
  for (const name of TRIAGEM_CAMPOS) {
    const parsed = Resposta.safeParse(form.get(name) || null);
    campos[name] = parsed.success ? parsed.data : null;
  }
  return campos;
}

function revalidar() {
  revalidatePath('/projetos');
  revalidatePath('/dashboard');
  revalidatePath('/lei-do-bem');
}

async function gravarLeiDoBem(
  supabase: ReturnType<typeof createClient>,
  projectId: string,
  form: FormData,
): Promise<string | null> {
  const opta = form.get('opta_lei_do_bem') === 'sim';
  if (!opta) {
    await supabase.from('lei_do_bem_avaliacoes').delete().eq('project_id', projectId);
    return null;
  }
  const { error } = await supabase.from('lei_do_bem_avaliacoes').upsert(
    { project_id: projectId, ...lerLeiDoBem(form) },
    { onConflict: 'project_id' },
  );
  if (error) {
    return 'A iniciativa foi salva, mas a triagem Lei do Bem não pôde ser gravada. Abra a iniciativa e tente de novo.';
  }
  return null;
}

export async function criarProjeto(_prev: EstadoProjeto, form: FormData): Promise<EstadoProjeto> {
  const perfil = await requireUser();
  if (!hasRoleAtLeast(perfil.role, 'participante')) {
    return { erro: 'Seu perfil é somente leitura. Peça a um administrador para elevar seu papel para cadastrar iniciativas.' };
  }
  const parsed = ler(form);
  if (!parsed.success) return { erro: parsed.error.issues[0].message };

  const supabase = createClient();
  const { data, error } = await supabase.from('projects').insert({
    ...parsed.data,
    target_date: parsed.data.target_date || null,
    owner_id: parsed.data.owner_id ?? perfil.id,
    scoring_source: 'nao_pontuado',
  }).select('id').single();

  if (error || !data) {
    return { erro: 'Não foi possível salvar a iniciativa. Revise os campos e tente de novo.' };
  }

  const aviso = await gravarLeiDoBem(supabase, data.id, form);
  revalidar();
  if (aviso) return { erro: aviso };
  redirect('/projetos?ok=criada');
}

export async function atualizarProjeto(
  id: string, _prev: EstadoProjeto, form: FormData,
): Promise<EstadoProjeto> {
  await requireUser();
  const parsed = ler(form);
  if (!parsed.success) return { erro: parsed.error.issues[0].message };

  const supabase = createClient();
  // Não mexe nos 4 eixos: a Matriz saiu do cadastro, mas o score legado
  // das 161 iniciativas (e o gate de estágio no banco) continua válido.
  const { error, count } = await supabase
    .from('projects')
    .update({
      ...parsed.data,
      target_date: parsed.data.target_date || null,
    }, { count: 'exact' })
    .eq('id', id);

  if (error) return { erro: 'Não foi possível salvar as alterações.' };
  if (!count) return { erro: 'Você só pode editar iniciativas das quais é dono.' };

  const aviso = await gravarLeiDoBem(supabase, id, form);
  revalidar();
  if (aviso) return { erro: aviso };
  redirect('/projetos?ok=atualizada');
}

export type EstadoMover = { ok?: boolean; erro?: string };

/** Move uma iniciativa de raia no Kanban. A RLS decide se a pessoa pode
 * escrever nesta linha (dono, ou gerencial+ para qualquer uma); o gate de
 * §9.1 continua sendo validado pelo trigger do banco. */
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
    return { erro: 'Não foi possível mover: verifique se a iniciativa está pontuada para entrar em desenvolvimento.' };
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
  revalidar();
}
