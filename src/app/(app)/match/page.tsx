import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { hasRoleAtLeast, STAGE_LABEL, type Stage } from '@/lib/types';
import { nomeProprietario } from '@/lib/pessoas';
import { dataLonga } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';
import {
  MAX_CHARS_PROBLEMA,
  MIN_CHARS_PROBLEMA,
  PULSENFF,
  TEXTO_CONSULTA_CURTA,
  TEXTO_DUVIDAS,
  TEXTO_SEM_MATCH,
  consultaCurta,
  hrefCadastrarDoMatch,
  problemaNormalizado,
  textoVarredura,
  varrerIniciativas,
  type IniciativaParaMatch,
  type ResultadoVarredura,
} from '@/lib/match-solucoes';

export const metadata = { title: 'Match de soluções — Pulso' };
export const dynamic = 'force-dynamic';

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
  areas: { name: string } | { name: string }[] | null;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
  owner_id: string | null;
};

function um<T>(valor: T | T[] | null): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? (valor[0] ?? null) : valor;
}

function rotuloEstagio(stage: string): string {
  return stage in STAGE_LABEL ? STAGE_LABEL[stage as Stage] : stage;
}

export default async function MatchPage({
  searchParams,
}: { searchParams: { q?: string | string[] } }) {
  const perfil = await requireUser();
  const q = problemaNormalizado(searchParams.q);
  const podeCadastrar = hasRoleAtLeast(perfil.role, 'participante');

  let resultado: ResultadoVarredura | null = null;
  let falha = false;
  let proximo: { title: string; scheduled_at: string } | null = null;

  if (q && consultaCurta(q)) {
    resultado = { tipo: 'curto' };
  } else if (q) {
    const supabase = createClient();
    const agora = new Date().toISOString();
    const [{ data, error }, { data: encontros }] = await Promise.all([
      supabase
        .from('projects')
        .select('id, title, description, objetivo_contexto, theme, tools, notes, stage, directorate, owner_id, areas(name), profiles!owner_id(full_name)')
        .is('archived_at', null),
      supabase
        .from('meetings')
        .select('title, scheduled_at')
        .gte('scheduled_at', agora)
        .order('scheduled_at', { ascending: true })
        .limit(1),
    ]);

    if (error) {
      falha = true;
    } else {
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
      resultado = varrerIniciativas(q, iniciativas);
    }
    proximo = (encontros?.[0] as { title: string; scheduled_at: string } | undefined) ?? null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">{PULSENFF}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Match de soluções</h1>
        <p className="mt-2 text-sm leading-relaxed text-g60">
          Descreva o problema. O {PULSENFF} varre as iniciativas do Pulso e diz se já existe
          algo parecido. Ele não tira outras dúvidas — essas ficam com a Gerência de IA.
        </p>
      </header>

      <form method="get" action="/match" className="card space-y-3 p-4" role="search">
        <div>
          <label className="label" htmlFor="q">Qual problema você quer resolver?</label>
          <textarea
            id="q"
            name="q"
            required
            minLength={MIN_CHARS_PROBLEMA}
            maxLength={MAX_CHARS_PROBLEMA}
            rows={5}
            defaultValue={q}
            placeholder="Ex.: a cobrança de faturas atrasadas ainda é manual no financeiro e ninguém vê o que está vencido."
            className="field mt-1"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-g50">A varredura usa título, contexto, descrição, área e ferramentas.</p>
          <Button type="submit">Varrer a base</Button>
        </div>
      </form>

      {falha && (
        <ErroBox mensagem="Não consegui varrer a base agora. Tente de novo em instantes." />
      )}

      {resultado && (
        <section aria-live="polite" aria-labelledby="resultado-pulsenff" className="space-y-4">
          <div className="card space-y-3 border-l-4 border-l-[var(--blue)] p-5">
            <div>
              <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">{PULSENFF}</p>
              <h2 id="resultado-pulsenff" className="mt-1 text-base font-semibold">
                {resultado.tipo === 'curto'
                  ? TEXTO_CONSULTA_CURTA
                  : textoVarredura(
                    resultado.varridas,
                    resultado.tipo === 'com_match' ? resultado.itens.length : 0,
                  )}
              </h2>
            </div>

            {resultado.tipo === 'sem_match' && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-g80">{TEXTO_SEM_MATCH}</p>
                {proximo && (
                  <p className="text-sm text-g80">
                    Próxima reunião: <span className="font-medium text-g90">{proximo.title}</span>
                    <span className="num text-g50"> · {dataLonga(proximo.scheduled_at)}</span>
                  </p>
                )}
                {podeCadastrar ? (
                  <Link
                    href={hrefCadastrarDoMatch(q)}
                    className="inline-flex items-center justify-center gap-2 rounded-s bg-[var(--blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--blue-2)]"
                  >
                    Cadastrar a solução
                  </Link>
                ) : (
                  <p className="text-sm text-g60">
                    Seu perfil é somente leitura. Peça a um participante para cadastrar e apresentar na próxima reunião.
                  </p>
                )}
              </div>
            )}

            {resultado.tipo !== 'com_match' && (
              <p className="text-sm text-g60">{TEXTO_DUVIDAS}</p>
            )}
          </div>

          {resultado.tipo === 'com_match' && (
            <ul className="grid gap-3">
              {resultado.itens.map((item) => (
                <li key={item.id} className="card space-y-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/projetos/${item.id}`} className="font-medium text-g90 hover:text-[var(--blue)]">
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-g50">
                        {item.area_name ?? item.directorate ?? 'Área não informada'}
                        {item.theme ? ` · ${item.theme}` : ''}
                        {` · ${item.owner_name ?? 'Sem proprietário'}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-s bg-g20 px-2 py-0.5 text-xs font-medium text-g80">
                        {rotuloEstagio(item.stage)}
                      </span>
                      <span className="num text-sm text-g60" title="Quanto do problema aparece nesta iniciativa">
                        {item.afinidade}% de afinidade
                      </span>
                    </div>
                  </div>
                  {item.resumo && <p className="text-sm leading-relaxed text-g60">{item.resumo}</p>}
                  <p className="text-xs text-g50">
                    Em comum: {item.termos.join(', ')}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {resultado.tipo === 'com_match' && (
            <div className="space-y-2">
              <p className="text-sm text-g60">
                {podeCadastrar ? (
                  <>
                    Nenhuma destas resolve?{' '}
                    <Link href={hrefCadastrarDoMatch(q)} className="font-medium text-[var(--blue)] hover:underline">
                      Cadastre a solução e apresente na próxima reunião.
                    </Link>
                  </>
                ) : (
                  'Se nenhuma destas resolve, peça a um participante para cadastrar e apresentar na próxima reunião.'
                )}
              </p>
              <p className="text-sm text-g60">{TEXTO_DUVIDAS}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
