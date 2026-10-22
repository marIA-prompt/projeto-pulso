'use client';

import { Fragment, useEffect, useId, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar } from '@/components/Avatar';
import { FiltroPeriodo } from '@/components/dashboard/FiltroPeriodo';
import { AuditoriaRanking } from './AuditoriaRanking';
import { clsx } from '@/lib/clsx';
import { diaCurto, diaISO, nf } from '@/lib/format';
import {
  auditoriaPessoa,
  datasDoPeriodo,
  kpisDoScorecard,
  montarRankings,
  ymdPeriodoPadrao,
  ymdUtcMeioDia,
  type PessoaRanking,
  type PresencaEncontro,
  type PresencaRanking,
  type ProjetoRanking,
  type RankingCategoria,
  type RankingPessoa,
  type RankingsColaboradores,
} from '@/lib/ranking';

const ABAS: {
  id: RankingCategoria;
  rotulo: string;
  titulo: string;
  nota: string;
  cor: string;
}[] = [
  {
    id: 'entregas',
    rotulo: 'Entregas',
    titulo: 'Maior volume de entregas',
    nota: 'Iniciativas concluídas ou em showcase no período selecionado.',
    cor: 'var(--blue)',
  },
  {
    id: 'especialistas',
    rotulo: 'Especialistas',
    titulo: 'Especialistas (conhecimento técnico)',
    nota: 'Volume de habilidades no Hub (linguagens e automações) e complexidade das iniciativas entregues no período — IA, n8n, ferramentas, horas e score.',
    cor: 'var(--cat-7)',
  },
  {
    id: 'colaboradores',
    rotulo: 'Colaboração',
    titulo: 'Top colaboradores',
    nota: 'Índice 0–100: presença no período (até 40), disponibilidade (20), iniciativas ativas (até 20) e perfil encontrável (até 20).',
    cor: 'var(--cat-3)',
  },
];

function notaDaAba(id: RankingCategoria, rankings: RankingsColaboradores, periodoPadrao: boolean): string {
  if (id === 'entregas' && !rankings.entregasNaJanela) {
    return periodoPadrao
      ? 'Nenhuma conclusão datada neste recorte. Ranking pelo histórico de entregas concluídas ou em showcase.'
      : 'Nenhuma conclusão datada neste período.';
  }
  return ABAS.find((a) => a.id === id)?.nota ?? '';
}

function selo(posto: number): { letra: string; rotulo: string } {
  if (posto === 1) return { letra: 'S', rotulo: 'Lenda' };
  if (posto === 2) return { letra: 'A', rotulo: 'Elite' };
  if (posto === 3) return { letra: 'B', rotulo: 'Destaque' };
  return { letra: 'C', rotulo: 'Top 10' };
}

function recuarDias(ateYmd: string, dias: number): string {
  const d = ymdUtcMeioDia(ateYmd);
  d.setUTCDate(d.getUTCDate() - dias);
  return diaISO(d.toISOString());
}

export function Scorecard({
  pessoas, projetos, presencas, deInicial, ateInicial,
}: {
  pessoas: PessoaRanking[];
  projetos: ProjetoRanking[];
  presencas: Array<PresencaRanking | PresencaEncontro>;
  deInicial: string;
  ateInicial: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const padrao = useMemo(() => ymdPeriodoPadrao(), []);
  const [de, setDe] = useState(deInicial || padrao.de);
  const [ate, setAte] = useState(ateInicial || padrao.ate);
  const [aplicado, setAplicado] = useState({ de: deInicial || padrao.de, ate: ateInicial || padrao.ate });
  const [aba, setAba] = useState<RankingCategoria>('entregas');
  const [eco, setEco] = useState(false);
  const [auditando, setAuditando] = useState<{ id: string; categoria: RankingCategoria } | null>(null);
  const [isPending, startTransition] = useTransition();
  const baseId = useId();
  const carregando = isPending || eco;

  const ehPadrao = aplicado.de === padrao.de && aplicado.ate === padrao.ate;

  const rankings = useMemo(() => {
    const periodo = datasDoPeriodo(aplicado.de, aplicado.ate);
    return montarRankings(pessoas, projetos, presencas, periodo, {
      fallbackHistorico: ehPadrao,
    });
  }, [pessoas, projetos, presencas, aplicado.de, aplicado.ate, ehPadrao]);

  const kpis = useMemo(() => kpisDoScorecard(rankings), [rankings]);
  const vazio = ABAS.every((a) => rankings[a.id].length === 0);
  const periodo = useMemo(
    () => datasDoPeriodo(aplicado.de, aplicado.ate),
    [aplicado.de, aplicado.ate],
  );
  const auditoria = useMemo(() => {
    if (!auditando) return null;
    return auditoriaPessoa(auditando.id, pessoas, projetos, presencas, periodo, {
      fallbackHistorico: ehPadrao,
    });
  }, [auditando, pessoas, projetos, presencas, periodo, ehPadrao]);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (aplicado.de !== padrao.de) sp.set('de', aplicado.de);
    if (aplicado.ate !== padrao.ate) sp.set('ate', aplicado.ate);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [aplicado.de, aplicado.ate, padrao.de, padrao.ate, pathname, router]);

  useEffect(() => {
    if (isPending) return;
    const t = window.setTimeout(() => setEco(false), 280);
    return () => window.clearTimeout(t);
  }, [isPending, aplicado.de, aplicado.ate]);

  function aplicar(proximoDe: string, proximoAte: string) {
    setEco(true);
    startTransition(() => {
      if (!proximoDe && !proximoAte) {
        setDe(padrao.de);
        setAte(padrao.ate);
        setAplicado({ de: padrao.de, ate: padrao.ate });
        return;
      }
      setDe(proximoDe);
      setAte(proximoAte);
      if (proximoDe && proximoAte) setAplicado({ de: proximoDe, ate: proximoAte });
    });
  }

  function atalho(proximoDe: string, proximoAte: string) {
    aplicar(proximoDe, proximoAte);
  }

  return (
    <div className="space-y-6">
      <section className="score-card p-4" aria-labelledby={`${baseId}-filtro`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[16rem] flex-1">
            <h2 id={`${baseId}-filtro`} className="text-sm font-semibold">Período do placar</h2>
            <p className="mt-1 text-xs text-g50">
              Entregas, presença e complexidade das iniciativas acompanham o recorte.
              O volume de habilidades vem do perfil atual no Hub.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-56">
              <FiltroPeriodo rotulo="De – até" de={de} ate={ate} onChange={aplicar} />
            </div>
            <div className="flex flex-wrap gap-1 pb-0.5" role="group" aria-label="Atalhos de período">
              <Atalho
                ativo={aplicado.de === recuarDias(padrao.ate, 29) && aplicado.ate === padrao.ate}
                onClick={() => atalho(recuarDias(padrao.ate, 29), padrao.ate)}
              >
                30 dias
              </Atalho>
              <Atalho ativo={ehPadrao} onClick={() => atalho(padrao.de, padrao.ate)}>
                3 meses
              </Atalho>
              <Atalho
                ativo={aplicado.de === `${padrao.ate.slice(0, 4)}-01-01` && aplicado.ate === padrao.ate}
                onClick={() => atalho(`${padrao.ate.slice(0, 4)}-01-01`, padrao.ate)}
              >
                Este ano
              </Atalho>
            </div>
          </div>
        </div>
      </section>

      <div
        aria-busy={carregando || undefined}
        aria-live="polite"
        className="space-y-6"
      >
        {carregando && (
          <div className="score-card flex items-center gap-3 p-3" role="status">
            <span className="num text-sm font-semibold text-[var(--ink-strong)]">Atualizando o placar…</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-g20" aria-hidden>
              <span className="block h-full w-1/3 animate-pulse rounded-full bg-[var(--yellow)]" />
            </span>
          </div>
        )}

        <div className={clsx('space-y-6 transition-opacity duration-200', carregando && 'pointer-events-none opacity-55')}>
        <section aria-labelledby={`${baseId}-kpis`} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <h2 id={`${baseId}-kpis`} className="sr-only">Indicadores do placar</h2>
          <KpiGlow
            valor={nf.format(kpis.entregasNoPeriodo)}
            rotulo="Entregas no período"
            nota={`${diaCurto(rankings.corteDesde)} – ${diaCurto(rankings.corteAte)}`}
            destaque
          />
          <KpiGlow
            valor={kpis.campeaoEntregas ? kpis.campeaoEntregas.nome.split(' ')[0] : '—'}
            rotulo="Campeão de volume"
            nota={kpis.campeaoEntregas ? kpis.campeaoEntregas.detalhe : 'Sem entregas datadas'}
            onAuditar={kpis.campeaoEntregas
              ? () => setAuditando({ id: kpis.campeaoEntregas!.id, categoria: 'entregas' })
              : undefined}
          />
          <KpiGlow
            valor={kpis.campeaoEspecialista ? kpis.campeaoEspecialista.nome.split(' ')[0] : '—'}
            rotulo="Top especialista"
            nota={kpis.campeaoEspecialista ? kpis.campeaoEspecialista.detalhe : 'Sem perfil técnico'}
            onAuditar={kpis.campeaoEspecialista
              ? () => setAuditando({ id: kpis.campeaoEspecialista!.id, categoria: 'especialistas' })
              : undefined}
          />
          <KpiGlow
            valor={nf.format(kpis.indiceMedio)}
            rotulo="Índice médio de colaboração"
            nota={kpis.campeaoColaboracao ? `Lidera ${kpis.campeaoColaboracao.nome}` : 'Ainda sem índice'}
          />
        </section>

        {vazio ? (
          <section className="score-card p-6">
            <h2 className="text-base font-semibold">Placar vazio neste recorte</h2>
            <p className="mt-2 text-sm text-g60">
              Ninguém pontuou em entregas, especialidade ou colaboração no período
              {` ${diaCurto(rankings.corteDesde)} – ${diaCurto(rankings.corteAte)}`}.
              Tente ampliar o recorte ou completar perfis no Hub.
            </p>
          </section>
        ) : (
          <section className="score-card p-4" aria-labelledby={`${baseId}-titulo`}>
            <header className="mb-4">
              <h2 id={`${baseId}-titulo`} className="text-base font-semibold">Top 10 do time</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-g60">
                Ranking em três categorias. Posto 1 leva o selo S; 2 e 3, A e B.
                Clique no nome para auditar a pontuação.
                {rankings.entregasNaJanela
                  ? ` Entregas e presença de ${diaCurto(rankings.corteDesde)} a ${diaCurto(rankings.corteAte)}.`
                  : ` Presença de ${diaCurto(rankings.corteDesde)} a ${diaCurto(rankings.corteAte)}. Volume pelo histórico.`}
              </p>
            </header>

            <div className="lg:hidden">
              <div role="tablist" aria-label="Categorias do ranking" className="grid grid-cols-3 gap-1 rounded-s border border-g40 p-1">
                {ABAS.map((a) => {
                  const selecionada = a.id === aba;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      role="tab"
                      id={`${baseId}-tab-${a.id}`}
                      aria-selected={selecionada}
                      aria-controls={`${baseId}-painel-${a.id}`}
                      tabIndex={selecionada ? 0 : -1}
                      onClick={() => setAba(a.id)}
                      onKeyDown={(e) => {
                        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                        e.preventDefault();
                        const i = ABAS.findIndex((x) => x.id === aba);
                        const next = e.key === 'ArrowRight'
                          ? ABAS[(i + 1) % ABAS.length]
                          : ABAS[(i - 1 + ABAS.length) % ABAS.length];
                        setAba(next.id);
                        requestAnimationFrame(() => {
                          document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
                        });
                      }}
                      className={clsx(
                        'rounded-s px-1.5 py-1.5 text-center text-[0.7rem] font-medium leading-tight sm:px-2 sm:text-sm',
                        selecionada
                          ? 'bg-[var(--navy)] text-white'
                          : 'text-g60 hover:bg-g20 hover:text-g90',
                      )}
                    >
                      {a.rotulo}
                    </button>
                  );
                })}
              </div>
              {ABAS.map((a) => (
                <div
                  key={a.id}
                  role="tabpanel"
                  id={`${baseId}-painel-${a.id}`}
                  aria-labelledby={`${baseId}-tab-${a.id}`}
                  hidden={a.id !== aba}
                  className="mt-4"
                >
                  <PainelRanking
                    titulo={a.titulo}
                    nota={notaDaAba(a.id, rankings, ehPadrao)}
                    pessoas={rankings[a.id]}
                    cor={a.cor}
                    onAuditar={(p) => setAuditando({ id: p.id, categoria: a.id })}
                  />
                </div>
              ))}
            </div>

            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-x-4 lg:gap-y-2.5">
              {ABAS.map((a, col) => (
                <Fragment key={a.id}>
                  <h3
                    className="text-sm font-semibold text-g90"
                    style={{ gridColumn: col + 1, gridRow: 1 }}
                  >
                    {a.titulo}
                  </h3>
                  <p
                    className="text-xs leading-relaxed text-g50"
                    style={{ gridColumn: col + 1, gridRow: 2 }}
                  >
                    {notaDaAba(a.id, rankings, ehPadrao)}
                  </p>
                  {rankings[a.id].length === 0 ? (
                    <p
                      className="text-sm text-g50"
                      style={{ gridColumn: col + 1, gridRow: 3 }}
                    >
                      Ninguém pontuou nesta categoria neste período.
                    </p>
                  ) : rankings[a.id].map((p, i) => (
                    <LinhaRanking
                      key={`${a.id}-${p.id}`}
                      pessoa={p}
                      posto={i + 1}
                      max={Math.max(...rankings[a.id].map((x) => x.valor), 1)}
                      cor={a.cor}
                      style={{ gridColumn: col + 1, gridRow: i + 3 }}
                      onAuditar={() => setAuditando({ id: p.id, categoria: a.id })}
                    />
                  ))}
                </Fragment>
              ))}
            </div>
          </section>
        )}
        </div>
      </div>

      {auditoria && auditando && (
        <AuditoriaRanking
          dados={auditoria}
          categoria={auditando.categoria}
          onFechar={() => setAuditando(null)}
        />
      )}
    </div>
  );
}

function Atalho({
  ativo, onClick, children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={clsx(
        'rounded-s px-2.5 py-1.5 text-xs font-semibold',
        ativo
          ? 'bg-[var(--navy)] text-white'
          : 'border border-g40 text-g60 hover:bg-g20 hover:text-g90',
      )}
    >
      {children}
    </button>
  );
}

function KpiGlow({
  valor, rotulo, nota, destaque = false, onAuditar,
}: {
  valor: string;
  rotulo: string;
  nota: string;
  destaque?: boolean;
  onAuditar?: () => void;
}) {
  return (
    <div className={clsx('score-card p-4', destaque && 'score-card--gold')}>
      {onAuditar ? (
        <button
          type="button"
          onClick={onAuditar}
          className="num text-left text-3xl font-semibold leading-none tracking-tight text-[var(--ink-strong)] underline-offset-4 hover:underline"
          aria-label={`Auditar ${valor}`}
        >
          {valor}
        </button>
      ) : (
        <p className="num text-3xl font-semibold leading-none tracking-tight text-[var(--ink-strong)]">
          {valor}
        </p>
      )}
      <p className="mt-2 text-sm font-medium text-g80">{rotulo}</p>
      <p className="mt-1 truncate text-xs leading-snug text-g50" title={nota}>{nota}</p>
    </div>
  );
}

function PainelRanking({
  titulo, nota, pessoas, cor, onAuditar,
}: {
  titulo: string;
  nota: string;
  pessoas: RankingPessoa[];
  cor: string;
  onAuditar: (p: RankingPessoa) => void;
}) {
  const max = Math.max(...pessoas.map((p) => p.valor), 1);
  return (
    <figure className="min-w-0">
      <figcaption>
        <h3 className="text-sm font-semibold text-g90">{titulo}</h3>
        <p className="mt-1 text-xs leading-relaxed text-g50">{nota}</p>
      </figcaption>
      {pessoas.length === 0 ? (
        <p className="mt-4 text-sm text-g50">Ninguém pontuou nesta categoria neste período.</p>
      ) : (
        <ol className="mt-4 space-y-2.5">
          {pessoas.map((p, i) => (
            <li key={p.id}>
              <LinhaRanking
                pessoa={p}
                posto={i + 1}
                max={max}
                cor={cor}
                onAuditar={() => onAuditar(p)}
              />
            </li>
          ))}
        </ol>
      )}
      {pessoas.length > 0 && (
        <p className="sr-only">
          {titulo}. {pessoas.map((p, i) => `${i + 1}º ${p.nome}: ${p.detalhe}`).join('; ')}.
        </p>
      )}
    </figure>
  );
}

function LinhaRanking({
  pessoa, posto, max, cor, onAuditar, style,
}: {
  pessoa: RankingPessoa;
  posto: number;
  max: number;
  cor: string;
  onAuditar: () => void;
  style?: React.CSSProperties;
}) {
  const largura = `${Math.max(8, (pessoa.valor / max) * 100)}%`;
  const { letra, rotulo } = selo(posto);
  return (
    <button
      type="button"
      style={style}
      onClick={onAuditar}
      aria-label={`Auditar ${pessoa.nome}, ${posto}º, ${pessoa.detalhe}`}
      title={pessoa.area_name ? `${pessoa.nome} · ${pessoa.area_name}` : `Auditar ${pessoa.nome}`}
      className={clsx(
        'group score-card grid h-[4.75rem] w-full min-w-0 self-start grid-cols-[2.25rem_minmax(0,1fr)_3.25rem] items-center gap-2 p-2 text-left',
        posto === 1 && 'score-card--gold',
      )}
    >
      <span className="flex flex-col items-center gap-0.5">
        <span
          className={clsx(
            'num flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
            posto === 1 && 'bg-[var(--yellow)] text-[var(--navy-deep)]',
            posto === 2 && 'bg-g20 text-g80',
            posto === 3 && 'bg-[var(--orange)] text-white',
            posto > 3 && 'border border-g30 text-g50',
          )}
          title={`${posto}º · selo ${letra} (${rotulo})`}
        >
          {letra}
        </span>
        <span className="num text-[0.6rem] text-g50">{posto}</span>
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <Avatar src={pessoa.avatar_url} nome={pessoa.nome} size={24} />
          <span className="truncate text-sm font-medium text-g90 underline-offset-2 group-hover:underline group-focus-visible:underline">
            {pessoa.nome}
          </span>
        </span>
        <span className="score-bar mt-1.5" aria-hidden>
          <span style={{ width: largura, background: cor }} />
        </span>
        <span className="mt-0.5 block truncate text-[0.7rem] leading-tight text-g50">
          {pessoa.detalhe}
        </span>
      </span>
      <span className="num truncate text-right text-sm font-semibold text-[var(--ink-strong)]">
        {nf.format(pessoa.valor)}
      </span>
    </button>
  );
}
