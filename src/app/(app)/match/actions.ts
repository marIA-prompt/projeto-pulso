'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { nomeProprietario } from '@/lib/pessoas';
import {
  consultaCurta,
  problemaNormalizado,
  registroPulsenff,
  varrerIniciativas,
  type IniciativaParaMatch,
} from '@/lib/match-solucoes';

type Linha = {
  id: string;
  title: string;
  description: string | null;
  objetivo_contexto: string | null;
  theme: string | null;
  tools: string | null;
  notes: string | null;
  stage: string;
  directorate: string | null;
  owner_id: string | null;
  areas: { name: string } | { name: string }[] | null;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

function um<T>(valor: T | T[] | null): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? (valor[0] ?? null) : valor;
}

/** Calcula o match no código e grava a prévia em pulsenff_consultas. */
export async function varrerPulsenff(form: FormData) {
  const perfil = await requireUser();
  const q = problemaNormalizado(String(form.get('q') ?? ''));
  if (!q) redirect('/match');

  const supabase = createClient();
  let registro = registroPulsenff(q, { tipo: 'curto' });

  if (!consultaCurta(q)) {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, description, objetivo_contexto, theme, tools, notes, stage, directorate, owner_id, areas(name), profiles!owner_id(full_name)')
      .is('archived_at', null);

    if (error) redirect('/match?erro=varredura');

    const iniciativas: IniciativaParaMatch[] = ((data ?? []) as unknown as Linha[]).map((p) => {
      const area = um(p.areas);
      const dono = um(p.profiles);
      return {
        id: p.id,
        title: p.title,
        stage: p.stage,
        theme: p.theme,
        area_name: area?.name ?? null,
        directorate: p.directorate,
        description: p.description,
        objetivo_contexto: p.objetivo_contexto,
        tools: p.tools,
        notes: p.notes,
        owner_name: nomeProprietario(p.owner_id, dono),
      };
    });
    registro = registroPulsenff(q, varrerIniciativas(q, iniciativas));
  }

  const { data: gravado, error: erroInsert } = await supabase
    .from('pulsenff_consultas')
    .insert({
      user_id: perfil.id,
      problema: registro.problema,
      resultado: registro.resultado,
      varridas: registro.varridas,
      encontrados: registro.encontrados,
      matches: registro.matches,
      previa: registro.previa,
    })
    .select('id')
    .single();

  if (erroInsert || !gravado) redirect('/match?erro=gravacao');
  redirect(`/match?id=${gravado.id}`);
}
