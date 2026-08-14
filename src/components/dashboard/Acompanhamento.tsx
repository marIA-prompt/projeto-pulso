'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { DashboardRow, Signal } from '@/lib/types';
import { STAGE_LABEL } from '@/lib/types';
import { nf, nf1, moeda, dataCurta } from '@/lib/format';
import { Donut, Barras, Ecg } from './charts';
import { Button } from '@/components/ui/Button';

const POR_PAGINA = 20;

/** Impacto financeiro estimado: economia recorrente anualizada (R$/mês × 12). */
function impactoAnual(r: DashboardRow): number | null {
  return r.cost_saved_month == null ? null : r.cost_saved_month * 12;
}

const SINAL_LABEL: Record<Signal, string> = {
  ok: 'Em dia', warn: 'Atenção', crit: 'Crítico', done: 'Concluído',
};
const SINAL_CLASSE: Record<Signal, string> = {
  ok: 'bg-[var(--sig-ok-bg)] text-[var(--sig-ok)]',
  warn: 'bg-[var(--sig-warn-bg)] text-[var(--sig-warn)]',
  crit: 'bg-[var(--sig-crit-bg)] text-[var(--sig-crit)]',
  done: 'bg-[var(--sig-done-bg)] text-[var(--sig-done)]',
};

type Filtros = {
  q: string; tema: string; area: string; dir: string;
  stage: string; potencial: string; ia: string;
  thOk: number; thCrit: number;
};

const PADRAO: Filtros = {
  q: '', tema: '', area: '', dir: '', stage: '', potencial: '', ia: '',
  thOk: 30, thCrit: 90,
};

function lerFiltros(sp: URLSearchParams): Filtros {
  return {
    q: sp.get('q') ?? '',
    tema: sp.get('tema') ?? '',
    area: sp.get('area') ?? '',
    dir: sp.get('dir') ?? '',
    stage: sp.get('stage') ?? '',
    potencial: sp.get('potencial') ?? '',
    ia: sp.get('ia') ?? '',
    thOk: Number(sp.get('thOk') ?? PADRAO.thOk),
    thCrit: Number(sp.get('thCrit') ?? PADRAO.thCrit),
  };
}

/** Recalcula o sinal no cliente para refletir os limites escolhidos. */
function sinalDe(r: DashboardRow, thOk: number, thCrit: number): Signal {
  if (r.stage === 'concluido' || r.stage === 'cancelado') return 'done';
  if (r.dias_sem_atualizacao <= thOk) return 'ok';
  if (r.dias_sem_atualizacao > thCrit) return 'crit';
  return 'warn';
}

function unicos(rows: DashboardRow[], campo: keyof DashboardRow) {
  return Array.from(
    new Set(rows.map((r) => r[campo]).filter((v): v is string => typeof v === 'string' && v !== '')),
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function Acompanhamento({ rows }: { rows: DashboardRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [f, setF] = useState<Filtros>(() => lerFiltros(new URLSearchParams(searchParams.toString())));

  // Persistência do estado dos filtros na URL: o link compartilhado leva
  // a outra pessoa exatamente à mesma visão.
  useEffect(() => {
    const sp = new URLSearchParams();
    (Object.keys(f) as (keyof Filtros)[]).forEach((k) => {
      const v = f[k];
      if (v !== PADRAO[k] && v !== '' && v != null) sp.set(k, String(v));
    });
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [f, pathname, router]);

  const set = useCallback(<K extends keyof Filtros>(k: K, v: Filtros[K]) => {
    setF((prev) => {
      const next = { ...prev, [k]: v };
      if (next.thCrit <= next.thOk) {
        // Os limites não podem se cruzar; o crítico acompanha.
        if (k === 'thOk') next.thCrit = next.thOk + 15;
        else next.thOk = Math.max(7, next.thCrit - 15);
      }
      return next;
    });
  }, []);

  const filtradas = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !`${r.title} ${r.area_name ?? ''} ${r.theme ?? ''}`.toLowerCase().includes(q)) return false;
      if (f.tema && r.theme !== f.tema) return false;
      if (f.area && r.area_name !== f.area) return false;
      if (f.dir && r.directorate !== f.dir) return false;
      if (f.stage && r.stage !== f.stage) return false;
      if (f.potencial && r.legacy_priority !== f.potencial) return false;
      if (f.ia && String(r.uses_ai === true) !== f.ia) return false;
      return true;
    });
  }, [rows, f]);

  // Tabela: ordenada pela atualização mais recente e paginada de 20 em 20.
  const ordenadas = useMemo(
    () => [...filtradas].sort((a, b) => b.last_activity_at.localeCompare(a.last_activity_at)),
    [filtradas],
  );
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / POR_PAGINA));
  useEffect(() => { setPagina(1); }, [ordenadas.length, f]);
  const paginaAtual = Math.min(pagina, totalPaginas);
  const linhasPagina = ordenadas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  const [selecionada, setSelecionada] = useState<DashboardRow | null>(null);

  const contagem = useMemo(() => {
    const c: Record<Signal, number> = { ok: 0, warn: 0, crit: 0, done: 0 };
    filtradas.forEach((r) => { c[sinalDe(r, f.thOk, f.thCrit)] += 1; });
    return c;
  }, [filtradas, f.thOk, f.thCrit]);

  const porEstagio = useMemo(() => {
    const m = new Map<string, number>();
    filtradas.forEach((r) => m.set(STAGE_LABEL[r.stage], (m.get(STAGE_LABEL[r.stage]) ?? 0) + 1));
    return [...m].map(([rotulo, valor]) => ({ rotulo, valor })).sort((a, b) => b.valor - a.valor);
  }, [filtradas]);

  const porTema = useMemo(() => agrupar(filtradas, 'theme'), [filtradas]);
  const porArea = useMemo(() => agrupar(filtradas, 'area_name').slice(0, 12), [filtradas]);

  const porMes = useMemo(() => {
    const m = new Map<string, number>();
    filtradas.forEach((r) => {
      const mes = r.last_activity_at.slice(0, 7);
      m.set(mes, (m.get(mes) ?? 0) + 1);
    });
    return [...m].sort(([a], [b]) => a.localeCompare(b)).map(([mes, valor]) => ({ mes, valor }));
  }, [filtradas]);

  const alertas = useMemo(
    () => filtradas
      .filter((r) => sinalDe(r, f.thOk, f.thCrit) === 'crit')
      .sort((a, b) => b.dias_sem_atualizacao - a.dias_sem_atualizacao)
      .slice(0, 10),
    [filtradas, f.thOk, f.thCrit],
  );

  const exportar = useCallback(() => {
    const cab = ['Iniciativa','Estágio','Tema','Área','Diretoria','Dias sem atualização','Sinal','Horas/mês','Impacto financeiro estimado (R$/ano)','Score','Usa IA'];
    const linhas = filtradas.map((r) => [
      r.title, STAGE_LABEL[r.stage], r.theme ?? '', r.area_name ?? '', r.directorate ?? '',
      r.dias_sem_atualizacao, SINAL_LABEL[sinalDe(r, f.thOk, f.thCrit)],
      r.hours_saved_month ?? '', impactoAnual(r) ?? '', r.score_final ?? '', r.uses_ai ? 'Sim' : 'Não',
    ]);
    const csv = [cab, ...linhas]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulso-iniciativas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtradas, f.thOk, f.thCrit]);

  const temas = unicos(rows, 'theme');
  const areas = unicos(rows, 'area_name');
  const dirs = unicos(rows, 'directorate');
  const potenciais = unicos(rows, 'legacy_priority');

  return (
    <div className="space-y-6">
      {/* ---------- Filtros ---------- */}
      <section className="card p-4" aria-labelledby="filtros-titulo">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="filtros-titulo" className="text-base font-semibold">Filtrar o portfólio</h2>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setF(PADRAO)}>Limpar filtros</Button>
            <Button variant="ghost" onClick={exportar}>Baixar CSV desta visão</Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="fq">Buscar</label>
            <input
              id="fq" type="search" className="field mt-1" value={f.q}
              placeholder="Nome da iniciativa, área ou tema"
              onChange={(e) => set('q', e.target.value)}
            />
          </div>
          <Select id="fTema" rotulo="Tema" valor={f.tema} opcoes={temas} onChange={(v) => set('tema', v)} />
          <Select id="fArea" rotulo="Área" valor={f.area} opcoes={areas} onChange={(v) => set('area', v)} />
          <Select id="fDir" rotulo="Diretoria" valor={f.dir} opcoes={dirs} onChange={(v) => set('dir', v)} />
          <div>
            <label className="label" htmlFor="fStage">Estágio</label>
            <select id="fStage" className="field mt-1" value={f.stage} onChange={(e) => set('stage', e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(STAGE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <Select id="fPot" rotulo="Potencial" valor={f.potencial} opcoes={potenciais} onChange={(v) => set('potencial', v)} />
          <div>
            <label className="label" htmlFor="fIa">Usa IA</label>
            <select id="fIa" className="field mt-1" value={f.ia} onChange={(e) => set('ia', e.target.value)}>
              <option value="">Todas</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>
        </div>

        <p aria-live="polite" className="mt-3 text-sm text-g60">
          Mostrando <strong className="num text-g90">{nf.format(filtradas.length)}</strong> de{' '}
          <span className="num">{nf.format(rows.length)}</span> iniciativas.
        </p>
      </section>

      {/* ---------- Semáforo ---------- */}
      <section className="card p-4" aria-labelledby="semaforo-titulo">
        <h2 id="semaforo-titulo" className="text-base font-semibold">Semáforo de acompanhamento</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-g60">
          Mede o tempo desde a última atualização feita pelo dono da iniciativa —
          não a idade do cadastro. Iniciativa parada vira pauta de ajuda, não de cobrança.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="thOk">
              Em dia até <span className="num">{f.thOk}</span> dias
            </label>
            <input
              id="thOk" type="range" min={7} max={90} step={7} value={f.thOk}
              onChange={(e) => set('thOk', Number(e.target.value))}
              className="mt-2 w-full accent-[var(--blue)]"
              aria-describedby="semaforo-eco"
            />
          </div>
          <div>
            <label className="label" htmlFor="thCrit">
              Crítico acima de <span className="num">{f.thCrit}</span> dias
            </label>
            <input
              id="thCrit" type="range" min={30} max={240} step={15} value={f.thCrit}
              onChange={(e) => set('thCrit', Number(e.target.value))}
              className="mt-2 w-full accent-[var(--blue)]"
              aria-describedby="semaforo-eco"
            />
          </div>
        </div>

        <ul id="semaforo-eco" aria-live="polite" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['ok', 'warn', 'crit', 'done'] as Signal[]).map((s) => (
            <li key={s} className={`rounded-s px-3 py-2 ${SINAL_CLASSE[s]}`}>
              <span className="num block text-xl font-semibold">{nf.format(contagem[s])}</span>
              <span className="text-xs font-medium">{SINAL_LABEL[s]}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Gráficos ---------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4" aria-labelledby="g1">
          <h2 id="g1" className="mb-4 text-base font-semibold">Iniciativas por estágio</h2>
          <Donut dados={porEstagio} titulo="Iniciativas por estágio do pipeline" />
        </section>
        <section className="card p-4" aria-labelledby="g2">
          <h2 id="g2" className="mb-4 text-base font-semibold">Iniciativas por tema</h2>
          <Barras dados={porTema} titulo="Iniciativas por tema" />
        </section>
        <section className="card p-4" aria-labelledby="g3">
          <h2 id="g3" className="mb-4 text-base font-semibold">Áreas mais ativas</h2>
          <Barras dados={porArea} titulo="Iniciativas por área" />
        </section>
        <section className="card p-4" aria-labelledby="g4">
          <h2 id="g4" className="mb-4 text-base font-semibold">Atividade ao longo do tempo</h2>
          <Ecg dados={porMes} />
        </section>
      </div>

      {/* ---------- Alertas ---------- */}
      {alertas.length > 0 && (
        <section className="card p-4" aria-labelledby="alertas-titulo">
          <h2 id="alertas-titulo" className="text-base font-semibold">Precisam de ajuda</h2>
          <p className="mt-1 text-sm text-g60">
            Sem atualização há mais de <span className="num">{f.thCrit}</span> dias. Levar ao Fórum de Desbloqueio.
          </p>
          <ul className="mt-3 divide-y divide-g30">
            {alertas.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <span className="text-sm font-medium text-g90">{r.title}</span>
                <span className="text-xs text-g50">
                  {r.area_name ?? 'Área não informada'} ·{' '}
                  <span className="num">{nf.format(r.dias_sem_atualizacao)}</span> dias
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- Tabela ---------- */}
      <section className="card overflow-hidden p-0" aria-labelledby="tabela-titulo">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-g30 p-4">
          <h2 id="tabela-titulo" className="text-base font-semibold">Todas as iniciativas do filtro</h2>
          <span className="text-xs text-g50">Clique em uma linha para ver os detalhes · ordenadas pela atualização mais recente</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-g30 text-left text-xs uppercase tracking-wide text-g50">
                <th scope="col" className="p-3">Iniciativa</th>
                <th scope="col" className="p-3">Estágio</th>
                <th scope="col" className="p-3">Área</th>
                <th scope="col" className="p-3 text-right">Horas/mês</th>
                <th scope="col" className="p-3 text-right">Impacto financeiro est.</th>
                <th scope="col" className="p-3 text-right">Parada há</th>
                <th scope="col" className="p-3">Sinal</th>
              </tr>
            </thead>
            <tbody>
              {linhasPagina.map((r) => {
                const s = sinalDe(r, f.thOk, f.thCrit);
                const imp = impactoAnual(r);
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelecionada(r)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSelecionada(r); }}
                    className="cursor-pointer border-b border-g20 last:border-0 hover:bg-g10 focus:bg-g10 focus:outline-none"
                  >
                    <td className="p-3 font-medium text-g90">{r.title}</td>
                    <td className="p-3 text-g60">{STAGE_LABEL[r.stage]}</td>
                    <td className="p-3 text-g60">{r.area_name ?? '—'}</td>
                    <td className="num p-3 text-right text-g60">
                      {r.hours_saved_month == null ? '—' : nf1.format(r.hours_saved_month)}
                    </td>
                    <td className="num p-3 text-right text-g60">
                      {imp == null ? '—' : `${moeda(imp)}/ano`}
                    </td>
                    <td className="num p-3 text-right text-g60">
                      {s === 'done' ? '—' : `${nf.format(r.dias_sem_atualizacao)} d`}
                    </td>
                    <td className="p-3">
                      <span className={`rounded-s px-2 py-0.5 text-xs font-semibold ${SINAL_CLASSE[s]}`}>
                        {SINAL_LABEL[s]}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-sm text-g50">
                  Nenhuma iniciativa corresponde a esses filtros. Limpe um deles para voltar a ver resultados.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {filtradas.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-g30 p-3">
            <p className="text-xs text-g50">
              Exibindo <span className="num">{nf.format((paginaAtual - 1) * POR_PAGINA + 1)}</span>–
              <span className="num">{nf.format(Math.min(paginaAtual * POR_PAGINA, ordenadas.length))}</span> de{' '}
              <span className="num">{nf.format(ordenadas.length)}</span>
            </p>
            <Paginacao pagina={paginaAtual} total={totalPaginas} onChange={setPagina} />
          </div>
        )}
      </section>

      {selecionada && <DetalheCard row={selecionada} sinal={sinalDe(selecionada, f.thOk, f.thCrit)} onFechar={() => setSelecionada(null)} />}
    </div>
  );
}

function Paginacao({ pagina, total, onChange }: { pagina: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  const nums: number[] = [];
  const de = Math.max(1, pagina - 2);
  const ate = Math.min(total, de + 4);
  for (let i = Math.max(1, ate - 4); i <= ate; i++) nums.push(i);
  return (
    <nav aria-label="Paginação da tabela" className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(1, pagina - 1))} disabled={pagina === 1}
        className="rounded-s border border-g40 px-2 py-1 text-xs text-g70 disabled:opacity-40 hover:bg-g20"
      >Anterior</button>
      {nums[0] > 1 && <span className="px-1 text-xs text-g50">…</span>}
      {nums.map((n) => (
        <button
          key={n} onClick={() => onChange(n)} aria-current={n === pagina ? 'page' : undefined}
          className={n === pagina
            ? 'num rounded-s bg-[var(--navy)] px-2.5 py-1 text-xs font-semibold text-white'
            : 'num rounded-s border border-g40 px-2.5 py-1 text-xs text-g70 hover:bg-g20'}
        >{n}</button>
      ))}
      {nums[nums.length - 1] < total && <span className="px-1 text-xs text-g50">…</span>}
      <button
        onClick={() => onChange(Math.min(total, pagina + 1))} disabled={pagina === total}
        className="rounded-s border border-g40 px-2 py-1 text-xs text-g70 disabled:opacity-40 hover:bg-g20"
      >Próxima</button>
    </nav>
  );
}

function DetalheCard({ row, sinal, onFechar }: { row: DashboardRow; sinal: Signal; onFechar: () => void }) {
  const imp = impactoAnual(row);
  return (
    <div
      role="dialog" aria-modal="true" aria-label={`Detalhes de ${row.title}`}
      onClick={onFechar}
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card max-h-[85vh] w-full max-w-lg overflow-y-auto p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">Iniciativa</p>
            <h3 className="mt-1 text-lg font-bold text-g90">{row.title}</h3>
          </div>
          <button
            onClick={onFechar} aria-label="Fechar"
            className="shrink-0 rounded-s border border-g40 px-2 py-1 text-sm text-g60 hover:bg-g20"
          >✕</button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-s px-2 py-0.5 text-xs font-semibold ${SINAL_CLASSE[sinal]}`}>{SINAL_LABEL[sinal]}</span>
          <span className="rounded-s bg-g20 px-2 py-0.5 text-xs font-medium text-g80">{STAGE_LABEL[row.stage]}</span>
        </div>

        {row.description && (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-g70">{row.description}</p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Info rotulo="Área" valor={row.area_name ?? '—'} />
          <Info rotulo="Tema" valor={row.theme ?? '—'} />
          <Info rotulo="Diretoria" valor={row.directorate ?? '—'} />
          <Info rotulo="Horas/mês" valor={row.hours_saved_month == null ? '—' : `${nf1.format(row.hours_saved_month)} h`} />
          <Info rotulo="Impacto financeiro est." valor={imp == null ? '—' : `${moeda(imp)}/ano`} />
          <Info rotulo="Score" valor={row.score_final == null ? 'Não pontuada' : row.score_final.toFixed(2)} />
          <Info rotulo="Usa IA" valor={row.uses_ai ? 'Sim' : 'Não'} />
          <Info rotulo="Usa n8n" valor={row.uses_n8n ? 'Sim' : 'Não'} />
          <Info rotulo="Última atualização" valor={dataCurta(row.last_activity_at)} />
          <Info rotulo="Parada há" valor={sinal === 'done' ? '—' : `${nf.format(row.dias_sem_atualizacao)} dias`} />
        </dl>

        <div className="mt-6 flex justify-end gap-2">
          <Link
            href={`/projetos/${row.id}`}
            className="rounded-s bg-[var(--blue)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--blue-2)]"
          >Abrir iniciativa</Link>
          <button onClick={onFechar} className="rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g80 hover:bg-g20">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-g50">{rotulo}</dt>
      <dd className="mt-0.5 font-medium text-g90">{valor}</dd>
    </div>
  );
}

function agrupar(rows: DashboardRow[], campo: 'theme' | 'area_name') {
  const m = new Map<string, number>();
  rows.forEach((r) => {
    const k = r[campo] ?? 'Não informado';
    m.set(k, (m.get(k) ?? 0) + 1);
  });
  return [...m].map(([rotulo, valor]) => ({ rotulo, valor })).sort((a, b) => b.valor - a.valor);
}

function Select({
  id, rotulo, valor, opcoes, onChange,
}: { id: string; rotulo: string; valor: string; opcoes: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{rotulo}</label>
      <select id={id} className="field mt-1" value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todos</option>
        {opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
