'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { STAGES, hasRoleAtLeast } from '@/lib/types';
import { TRIAGEM_RESPOSTAS } from '@/lib/lei-do-bem';

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

const CAMPOS_LEI = [
  'objetivo_estrategico_okr', 'contexto_problema', 'o_que_sera_desenvolvido',
  'resultados_esperados', 'como_sera_desenvolvido', 'fora_do_escopo', 'desafios_riscos',
  'descricao_projeto', 'elemento_tecnologico_novo', 'barreira_desafio_tecnologico',
  'metodologia_metodos', 'descritivo_complementar',
] as const;

function lerLeiDoBem(form: FormData) {
  if (form.get('lei_do_bem') !== 'on') return null;
  const dados: Record<string, string | null> = {};
  for (const campo of CAMPOS_LEI) dados[campo] = String(form.get(campo) ?? '').trim() || null;
  for (let i = 1; i <= 12; i++) {
    const valor = String(form.get(`triagem_${String(i).padStart(2, '0')}`) ?? '');
    dados[`triagem_${String(i).padStart(2, '0')}`] = TRIAGEM_RESPOSTAS.includes(valor as (typeof TRIAGEM_RESPOSTAS)[number]) ? valor : null;
  }
  return dados;
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

  const supabase = createClient();
  const { data: projeto, error } = await supabase.from('projects').insert({
    ...parsed.data,
    target_date: parsed.data.target_date || null,
    owner_id: parsed.data.owner_id ?? perfil.id,
    scoring_source: 'nao_pontuado',
  }).select('id').single();

  if (error) return { erro: 'Não foi possível salvar a iniciativa. Revise os campos e tente de novo.' };
  const avaliacao = lerLeiDoBem(form);
  if (avaliacao) {
    const { error: erroLei } = await supabase.from('lei_do_bem_avaliacoes').insert({ project_id: projeto.id, ...avaliacao });
    if (erroLei) return { erro: 'A iniciativa foi salva, mas não foi possível salvar a pré-avaliação Lei do Bem.' };
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

  const supabase = createClient();
  // A RLS decide se esta pessoa pode escrever nesta linha. Se não puder,
  // o update afeta zero linhas — não vaza a existência do registro.
  const { error, count } = await supabase
    .from('projects')
    .update({
      ...parsed.data,
      target_date: parsed.data.target_date || null,
      scoring_source: 'nao_pontuado',
    }, { count: 'exact' })
    .eq('id', id);

  if (error) return { erro: 'Não foi possível salvar as alterações.' };
  if (!count) return { erro: 'Você só pode editar iniciativas das quais é dono.' };
  const avaliacao = lerLeiDoBem(form);
  if (avaliacao) {
    const { error: erroLei } = await supabase.from('lei_do_bem_avaliacoes')
      .upsert({ project_id: id, ...avaliacao }, { onConflict: 'project_id' });
    if (erroLei) return { erro: 'A iniciativa foi atualizada, mas não foi possível salvar a pré-avaliação Lei do Bem.' };
  } else {
    const { error: erroLei } = await supabase.from('lei_do_bem_avaliacoes').delete().eq('project_id', id);
    if (erroLei) return { erro: 'A iniciativa foi atualizada, mas não foi possível remover a pré-avaliação Lei do Bem.' };
  }

  revalidatePath('/projetos');
  revalidatePath('/dashboard');
  revalidatePath('/lei-do-bem');
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
    // O trigger do gate (Backlog → Em Desenvolvimento exige score ≥ 3,0)
    // chega aqui como erro do Postgres.
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
  revalidatePath('/projetos');
  revalidatePath('/dashboard');
}
