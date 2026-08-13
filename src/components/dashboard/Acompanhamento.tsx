'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { DashboardRow, Signal } from '@/lib/types';
import { STAGE_LABEL } from '@/lib/types';
import { nf, nf1 } from '@/lib/format';
import { Donut, Barras, Ecg } from './charts';
import { Button } from '@/components/ui/Button';

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
    const cab = ['Iniciativa','Estágio','Tema','Área','Diretoria','Dias sem atualização','Sinal','Horas/mês','Score','Usa IA'];
    const linhas = filtradas.map((r) => [
      r.title, STAGE_LABEL[r.stage], r.theme ?? '', r.area_name ?? '', r.directorate ?? '',
      r.dias_sem_atualizacao, SINAL_LABEL[sinalDe(r, f.thOk, f.thCrit)],
      r.hours_saved_month ?? '', r.score_final ?? '', r.uses_ai ? 'Sim' : 'Não',
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
      <section className="card overflow-x-auto p-0" aria-labelledby="tabela-titulo">
        <h2 id="tabela-titulo" className="border-b border-g30 p-4 text-base font-semibold">
          Todas as iniciativas do filtro
        </h2>
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-g30 text-left text-xs uppercase tracking-wide text-g50">
              <th scope="col" className="p-3">Iniciativa</th>
              <th scope="col" className="p-3">Estágio</th>
              <th scope="col" className="p-3">Área</th>
              <th scope="col" className="p-3 text-right">Horas/mês</th>
              <th scope="col" className="p-3 text-right">Parada há</th>
              <th scope="col" className="p-3">Sinal</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((r) => {
              const s = sinalDe(r, f.thOk, f.thCrit);
              return (
                <tr key={r.id} className="border-b border-g20 last:border-0">
                  <td className="p-3 font-medium text-g90">{r.title}</td>
                  <td className="p-3 text-g60">{STAGE_LABEL[r.stage]}</td>
                  <td className="p-3 text-g60">{r.area_name ?? '—'}</td>
                  <td className="num p-3 text-right text-g60">
                    {r.hours_saved_month == null ? '—' : nf1.format(r.hours_saved_month)}
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
              <tr><td colSpan={6} className="p-8 text-center text-sm text-g50">
                Nenhuma iniciativa corresponde a esses filtros. Limpe um deles para voltar a ver resultados.
              </td></tr>
            )}
          </tbody>
        </table>
      </section>
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
