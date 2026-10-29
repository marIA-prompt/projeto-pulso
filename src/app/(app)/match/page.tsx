import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { hasRoleAtLeast, STAGE_LABEL, type Stage } from '@/lib/types';
import { dataCurta, dataLonga } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';
import {
  MAX_CHARS_PROBLEMA,
  MIN_CHARS_PROBLEMA,
  PULSENFF,
  TEXTO_CONSULTA_CURTA,
  TEXTO_DUVIDAS,
  TEXTO_SEM_MATCH,
  hrefCadastrarDoMatch,
  resultadoDoRegistro,
  type MatchGravado,
  type ResultadoVarredura,
} from '@/lib/match-solucoes';
import { varrerPulsenff } from './actions';

export const metadata = { title: 'Match de soluções — Pulso' };
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ERRO: Record<string, string> = {
  varredura: 'Não consegui ler a base de iniciativas agora. Tente de novo em instantes.',
  gravacao: 'A varredura não foi gravada. Confira a tabela pulsenff_consultas no Supabase.',
  sumiu: 'Essa varredura não está disponível para o seu perfil.',
};

const RESULTADO_LABEL: Record<string, string> = {
  curto: 'Consulta curta',
  sem_match: 'Sem iniciativa parecida',
  com_match: 'Com iniciativa parecida',
};

type Consulta = {
  id: string;
  problema: string;
  resultado: 'curto' | 'sem_match' | 'com_match';
  varridas: number;
  encontrados: number;
  matches: MatchGravado[];
  previa: string;
  created_at: string;
};

function rotuloEstagio(stage: string): string {
  return stage in STAGE_LABEL ? STAGE_LABEL[stage as Stage] : stage;
}

function comoRegistro(row: Consulta): ResultadoVarredura {
  return resultadoDoRegistro({
    resultado: row.resultado,
    varridas: row.varridas,
    matches: Array.isArray(row.matches) ? row.matches : [],
  });
}

export default async function MatchPage({
  searchParams,
}: { searchParams: { id?: string; erro?: string } }) {
  const perfil = await requireUser();
  const podeCadastrar = hasRoleAtLeast(perfil.role, 'participante');
  const supabase = createClient();
  const id = UUID.test(searchParams.id ?? '') ? searchParams.id! : '';

  const [{ data: recente }, consultaResp, encontrosResp] = await Promise.all([
    supabase
      .from('pulsenff_consultas')
      .select('id, problema, resultado, previa, created_at')
      .eq('user_id', perfil.id)
      .order('created_at', { ascending: false })
      .limit(5),
    id
      ? supabase
        .from('pulsenff_consultas')
        .select('id, problema, resultado, varridas, encontrados, matches, previa, created_at')
        .eq('id', id)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('meetings')
      .select('title, scheduled_at')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1),
  ]);

  const consulta = (consultaResp.data ?? null) as Consulta | null;
  const sumiu = Boolean(id) && !consultaResp.error && !consulta;
  const resultado = consulta ? comoRegistro(consulta) : null;
  const q = consulta?.problema ?? '';
  const proximo = (encontrosResp.data?.[0] as { title: string; scheduled_at: string } | undefined) ?? null;
  const erro = ERRO[searchParams.erro ?? '']
    || (consultaResp.error ? ERRO.gravacao : '')
    || (sumiu ? ERRO.sumiu : '');
  const historico = (recente ?? []) as { id: string; problema: string; resultado: string; previa: string; created_at: string }[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">{PULSENFF}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Match de soluções</h1>
        <p className="mt-2 text-sm leading-relaxed text-g60">
          Descreva o problema. O {PULSENFF} compara o texto com as iniciativas, no código,
          e grava a prévia na tabela <span className="num">pulsenff_consultas</span>.
          Ele não tira outras dúvidas — essas ficam com a Gerência de IA.
        </p>
      </header>

      <form action={varrerPulsenff} className="card space-y-3 p-4" role="search">
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
          <p className="text-xs text-g50">A comparação usa título, contexto, descrição, área e ferramentas.</p>
          <Button type="submit">Varrer a base</Button>
        </div>
      </form>

      {erro && <ErroBox mensagem={erro} />}

      {resultado && consulta && (
        <section aria-live="polite" aria-labelledby="resultado-pulsenff" className="space-y-4">
          <div className="card space-y-3 border-l-4 border-l-[var(--blue)] p-5">
            <div>
              <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">{PULSENFF}</p>
              <h2 id="resultado-pulsenff" className="mt-1 text-base font-semibold">{consulta.previa}</h2>
              {resultado.tipo !== 'curto' && (
                <p className="mt-1 text-xs text-g50">
                  {resultado.varridas === 1 ? '1 iniciativa varrida' : `${resultado.varridas} iniciativas varridas`}
                  {' · '}gravado em <span className="num">{dataCurta(consulta.created_at)}</span>
                </p>
              )}
            </div>

            {resultado.tipo === 'sem_match' && (
              <div className="space-y-3">
                {consulta.previa !== TEXTO_SEM_MATCH && (
                  <p className="text-sm leading-relaxed text-g80">{TEXTO_SEM_MATCH}</p>
                )}
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

            {resultado.tipo === 'curto' && consulta.previa !== TEXTO_CONSULTA_CURTA && (
              <p className="text-sm leading-relaxed text-g80">{TEXTO_CONSULTA_CURTA}</p>
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
                        {item.area_name ?? 'Área não informada'}
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
                  <p className="text-xs text-g50">Em comum: {item.termos.join(', ')}</p>
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

      {historico.length > 0 && (
        <section aria-labelledby="historico-pulsenff" className="space-y-3">
          <h2 id="historico-pulsenff" className="text-base font-semibold">Suas últimas varreduras</h2>
          <ul className="grid gap-2">
            {historico.map((item) => (
              <li key={item.id}>
                <Link href={`/match?id=${item.id}`} className="card block p-3 hover:bg-g20">
                  <p className="text-sm text-g90">{item.previa}</p>
                  <p className="mt-1 text-xs text-g50">
                    {RESULTADO_LABEL[item.resultado] ?? item.resultado}
                    {' · '}
                    <span className="num">{dataCurta(item.created_at)}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
