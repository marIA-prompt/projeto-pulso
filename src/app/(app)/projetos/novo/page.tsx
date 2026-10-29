import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { hasRoleAtLeast } from '@/lib/types';
import { ProjetoForm } from '@/components/ProjetoForm';
import { nomesDiretoria } from '@/lib/diretorias-catalogo';
import { problemaNormalizado } from '@/lib/match-solucoes';
import { criarProjeto } from '../actions';

export const metadata = { title: 'Nova iniciativa — Pulso' };

export default async function NovoProjetoPage({
  searchParams,
}: { searchParams: { problema?: string | string[] } }) {
  const perfil = await requireUser();
  // Leitor é somente leitura: não abre a tela de cadastro.
  if (!hasRoleAtLeast(perfil.role, 'participante')) redirect('/projetos');

  const problema = problemaNormalizado(searchParams.problema);
  const supabase = createClient();
  const [{ data: areas }, { data: pessoas }, { data: diretorias }] = await Promise.all([
    supabase.from('areas').select('id, name').eq('is_real_area', true).order('name'),
    supabase.from('profiles').select('id, full_name').eq('active', true).order('full_name'),
    supabase.from('diretorias').select('name').order('sort_order'),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastrar iniciativa</h1>
          <p className="mt-2 text-sm leading-relaxed text-g60">
            Descreva o problema antes da solução. Se a iniciativa puder se enquadrar
            na Lei do Bem, o fluxo segue para a triagem preliminar da equipe de PD&amp;I.
          </p>
        </div>
        <Link
          href="/projetos"
          aria-label="Fechar e voltar para Iniciativas"
          title="Fechar"
          className="shrink-0 rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g60 hover:bg-g20"
        >
          ✕ Fechar
        </Link>
      </header>
      {problema && (
        <p role="status" className="rounded-s bg-[var(--sig-ok-bg)] px-3 py-2 text-sm text-[var(--sig-ok)]">
          O Pulsenff não encontrou iniciativa parecida. O problema já está em Objetivo e Contexto — complete o cadastro para apresentar na próxima reunião.
        </p>
      )}
      <ProjetoForm
        action={criarProjeto}
        areas={areas ?? []}
        diretorias={nomesDiretoria((diretorias ?? []).map((d) => d.name))}
        pessoas={pessoas ?? []}
        ownerPadrao={perfil.id}
        rotulo="Cadastrar iniciativa"
        cancelHref="/projetos"
        valores={problema ? { objetivo_contexto: problema } : undefined}
      />
    </div>
  );
}
