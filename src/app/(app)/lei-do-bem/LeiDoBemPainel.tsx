'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  LDB_STATUSES, LDB_STATUS_LABEL, LDB_STATUS_TONE,
  LDB_CLASSIFICACOES, LDB_CLASSIFICACAO_LABEL,
  LDB_PRIORIDADES, LDB_PRIORIDADE_LABEL,
  type LdbAvaliacaoRow, type LdbHistoricoRow, type LdbStatus,
} from '@/lib/leiDoBem';
import type { PessoaOpcao } from '@/lib/pessoas';
import { Avatar } from '@/components/Avatar';
import { Empty } from '@/components/ui/Card';
import { BadgeClassificacao, BadgeStatus, BadgePrioridade } from '@/components/leidobem/Badges';
import { dataCurta, nf } from '@/lib/format';
import { clsx } from '@/lib/clsx';
import { moverStatusLeiDoBem } from './actions';
import { LeiDoBemDetalhe } from './LeiDoBemDetalhe';

type Filtros = {
  status: string;
  classificacao: string;
  responsavel: string;
  prioridade: string;
  area: string;
  busca: string;
};

const SEM_FILTRO: Filtros = {
  status: '', classificacao: '', responsavel: '', prioridade: '', area: '', busca: '',
};

/** Cor da faixa superior de cada raia do kanban — semáforo já existente. */
const FAIXA_RAIA: Record<LdbStatus, string> = {
  backlog: 'var(--g40)',
  em_avaliacao_interna: 'var(--sig-warn)',
  enquadrado: 'var(--sig-ok)',
  nao_enquadrado: 'var(--sig-crit)',
};

function Kpi({ valor, rotulo, destaque = false }: { valor: number; rotulo: string; destaque?: boolean }) {
  return (
    <div className="card p-4">
      <p className={clsx(
        'num text-2xl font-semibold leading-none',
        destaque ? 'text-[var(--ink-strong)]' : 'text-g90',
      )}>
        {nf.format(valor)}
      </p>
      <p className="mt-2 text-sm font-medium leading-snug text-g80">{rotulo}</p>
    </div>
  );
}

export function LeiDoBemPainel({
  avaliacoes, historico, pessoas, podeAuditar,
}: {
  avaliacoes: LdbAvaliacaoRow[];
  historico: LdbHistoricoRow[];
  pessoas: PessoaOpcao[];
  podeAuditar: boolean;
}) {
  const router = useRouter();
  const [f, setF] = useState<Filtros>(SEM_FILTRO);
  const [kanban, setKanban] = useState(false);
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [rows, setRows] = useState<LdbAvaliacaoRow[]>(avaliacoes);
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<LdbStatus | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => { setRows(avaliacoes); }, [avaliacoes]);

  const areas = useMemo(
    () => Array.from(new Set(rows.map((r) => r.area_name).filter(Boolean))).sort() as string[],
    [rows],
  );

  const filtradas = useMemo(() => rows.filter((r) => {
    if (f.status && r.status !== f.status) return false;
    if (f.classificacao && (r.triagem_classificacao ?? 'pendente') !== f.classificacao) return false;
    if (f.responsavel && r.responsavel_auditoria_id !== f.responsavel) return false;
    if (f.prioridade && r.prioridade !== f.prioridade) return false;
    if (f.area && r.area_name !== f.area) return false;
    if (f.busca && !r.title.toLowerCase().includes(f.busca.toLowerCase())) return false;
    return true;
  }), [rows, f]);

  // Big numbers sobre o conjunto FILTRADO — duas dimensões distintas:
  // status (processo de auditoria, manual) × classificação (triagem, automática).
  const porStatus = (s: LdbStatus) => filtradas.filter((r) => r.status === s).length;
  const porClasse = (c: string) =>
    filtradas.filter((r) => (r.triagem_classificacao ?? 'pendente') === c).length;
  const prontasClickup = filtradas.filter(
    (r) => r.enviar_clickup && !r.clickup_sincronizado_em,
  ).length;

  const aberta = abertaId ? rows.find((r) => r.id === abertaId) ?? null : null;

  function mudarStatus(id: string, destino: LdbStatus) {
    const atual = rows.find((r) => r.id === id);
    if (!atual || atual.status === destino) return;
    const anterior = atual.status;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: destino } : r)));
    setErro(null);
    startTransition(async () => {
      const res = await moverStatusLeiDoBem(id, destino);
      if (res.erro) {
        setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: anterior } : r)));
        setErro(res.erro);
      } else {
        router.refresh();
      }
    });
  }

  function soltar(destino: LdbStatus) {
    const id = arrastando;
    setArrastando(null);
    setAlvo(null);
    if (id) mudarStatus(id, destino);
  }

  return (
    <div className="space-y-6">
      {/* ===== Big numbers ===== */}
      <section aria-labelledby="ldb-kpis" className="space-y-3">
        <h2 id="ldb-kpis" className="sr-only">Indicadores da Lei do Bem</h2>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-g50">
            Processo de auditoria (status)
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Kpi valor={filtradas.length} rotulo="Iniciativas na Lei do Bem" destaque />
            <Kpi valor={porStatus('backlog')} rotulo="Em backlog" />
            <Kpi valor={porStatus('em_avaliacao_interna')} rotulo="Em avaliação interna" />
            <Kpi valor={porStatus('enquadrado')} rotulo="Enquadradas" />
            <Kpi valor={porStatus('nao_enquadrado')} rotulo="Não enquadradas" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-g50">
            Triagem preliminar (classificação automática)
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Kpi valor={porClasse('potencialmente_elegivel')} rotulo="Potencialmente elegíveis" />
            <Kpi valor={porClasse('potencial_parcial')} rotulo="Potencial parcial" />
            <Kpi valor={porClasse('baixo_potencial')} rotulo="Baixo potencial" />
            <Kpi
              valor={porClasse('pendente') + porClasse('informacoes_insuficientes')}
              rotulo="Pendentes / informações insuficientes"
            />
            <Kpi valor={prontasClickup} rotulo="Prontas para envio ao ClickUp" destaque />
          </div>
        </div>
      </section>

      {/* ===== Filtros ===== */}
      <section aria-label="Filtros" className="card flex flex-wrap items-end gap-3 p-4">
        <label className="flex flex-col gap-1">
          <span className="label">Status</span>
          <select className="field py-1.5 text-sm" value={f.status}
                  onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="">Todos</option>
            {LDB_STATUSES.map((s) => <option key={s} value={s}>{LDB_STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="label">Classificação da triagem</span>
          <select className="field py-1.5 text-sm" value={f.classificacao}
                  onChange={(e) => setF({ ...f, classificacao: e.target.value })}>
            <option value="">Todas</option>
            {LDB_CLASSIFICACOES.map((c) => (
              <option key={c} value={c}>{LDB_CLASSIFICACAO_LABEL[c]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="label">Responsável da auditoria</span>
          <select className="field max-w-[13rem] py-1.5 text-sm" value={f.responsavel}
                  onChange={(e) => setF({ ...f, responsavel: e.target.value })}>
            <option value="">Todos</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name?.trim() || 'Sem nome'}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="label">Prioridade</span>
          <select className="field py-1.5 text-sm" value={f.prioridade}
                  onChange={(e) => setF({ ...f, prioridade: e.target.value })}>
            <option value="">Todas</option>
            {LDB_PRIORIDADES.map((p) => (
              <option key={p} value={p}>{LDB_PRIORIDADE_LABEL[p]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="label">Área</span>
          <select className="field max-w-[13rem] py-1.5 text-sm" value={f.area}
                  onChange={(e) => setF({ ...f, area: e.target.value })}>
            <option value="">Todas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span className="label">Buscar por nome</span>
          <input type="search" className="field py-1.5 text-sm" value={f.busca}
                 placeholder="Nome da iniciativa…"
                 onChange={(e) => setF({ ...f, busca: e.target.value })} />
        </label>
        {(f.status || f.classificacao || f.responsavel || f.prioridade || f.area || f.busca) && (
          <button type="button" onClick={() => setF(SEM_FILTRO)}
                  className="rounded-s border border-g40 px-3 py-1.5 text-xs font-medium text-g60 hover:bg-g20">
            Limpar filtros
          </button>
        )}
        <nav aria-label="Modo de visualização" className="ml-auto flex gap-2">
          <button type="button" onClick={() => setKanban(false)} aria-pressed={!kanban}
                  className={!kanban
                    ? 'rounded-s bg-[var(--navy)] px-3 py-1.5 text-sm font-medium text-white'
                    : 'rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g60 hover:bg-g20'}>
            Lista
          </button>
          <button type="button" onClick={() => setKanban(true)} aria-pressed={kanban}
                  className={kanban
                    ? 'rounded-s bg-[var(--navy)] px-3 py-1.5 text-sm font-medium text-white'
                    : 'rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g60 hover:bg-g20'}>
            Kanban
          </button>
        </nav>
      </section>

      {erro && (
        <p role="alert" className="rounded-s bg-[var(--sig-crit-bg)] px-3 py-2 text-sm text-[var(--sig-crit)]">
          {erro}
        </p>
      )}

      {filtradas.length === 0 ? (
        <Empty titulo={rows.length === 0
          ? 'Nenhuma iniciativa passou pela pré-avaliação ainda. O bloco Lei do Bem fica no cadastro de iniciativa.'
          : 'Nenhuma avaliação neste recorte de filtros.'} />
      ) : kanban ? (
        /* ===== Kanban por status da auditoria ===== */
        <div className="space-y-2">
          {podeAuditar && (
            <p className="text-xs text-g50">
              Arraste um card para outra raia para mudar o status — ou use o select de status no
              painel de detalhe, equivalente acessível sem mouse.
            </p>
          )}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-3">
            {LDB_STATUSES.map((status) => {
              const daRaia = filtradas.filter((r) => r.status === status);
              return (
                <section
                  key={status}
                  aria-label={`Raia ${LDB_STATUS_LABEL[status]}`}
                  onDragOver={(e) => {
                    if (podeAuditar && arrastando) { e.preventDefault(); setAlvo(status); }
                  }}
                  onDrop={(e) => { e.preventDefault(); if (podeAuditar) soltar(status); }}
                  className={clsx(
                    'flex min-w-0 flex-col rounded-m border p-2',
                    alvo === status ? 'border-[var(--blue)]' : 'border-g30 bg-g10',
                  )}
                  style={{ borderTop: `3px solid ${FAIXA_RAIA[status]}` }}
                >
                  <header className="mb-2 flex items-center justify-between gap-1 px-1">
                    <h3 className="truncate text-sm font-semibold text-g80">
                      {LDB_STATUS_LABEL[status]}
                    </h3>
                    <span className="num shrink-0 rounded-s bg-g20 px-1.5 text-xs text-g60">
                      {daRaia.length}
                    </span>
                  </header>
                  <div className="flex min-h-[3rem] flex-1 flex-col gap-2">
                    {daRaia.map((r) => (
                      <article
                        key={r.id}
                        draggable={podeAuditar}
                        onDragStart={() => setArrastando(r.id)}
                        onDragEnd={() => { setArrastando(null); setAlvo(null); }}
                        className={clsx(
                          'rounded-s border border-g30 bg-[var(--white)] p-3 shadow-sm',
                          podeAuditar && 'cursor-grab active:cursor-grabbing',
                          arrastando === r.id && 'opacity-50',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setAbertaId(r.id)}
                          className="text-left text-sm font-medium text-g90 hover:text-[var(--blue)]"
                        >
                          {r.title}
                        </button>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <BadgeClassificacao classificacao={r.triagem_classificacao} />
                          <BadgePrioridade prioridade={r.prioridade} />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          {r.responsavel_auditoria_nome ? (
                            <>
                              <Avatar nome={r.responsavel_auditoria_nome} size={20} />
                              <span className="truncate text-xs text-g60">
                                {r.responsavel_auditoria_nome}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-g50">Auditoria não atribuída</span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        /* ===== Lista (tabela) ===== */
        <div className="card overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left">
                {['Iniciativa', 'Área / Diretoria', 'Status', 'Classificação da triagem',
                  'Aderência', 'Responsável da auditoria', 'Prioridade', 'ClickUp',
                  'Última atualização'].map((h) => (
                  <th key={h} className="border-b border-g30 px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-wider text-g50">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setAbertaId(r.id)}
                  className="cursor-pointer border-b border-g20 transition-colors last:border-0 hover:bg-g20"
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setAbertaId(r.id); }}
                      className="text-left font-medium text-g90 hover:text-[var(--blue)]"
                    >
                      {r.title}
                    </button>
                    <p className="mt-0.5 text-xs text-g50">{r.owner_name ?? 'Sem proprietário'}</p>
                  </td>
                  <td className="px-4 py-3 text-g70">
                    {r.area_name ?? '—'}
                    {r.directorate && <p className="text-xs text-g50">{r.directorate}</p>}
                  </td>
                  <td className="px-4 py-3"><BadgeStatus status={r.status} /></td>
                  <td className="px-4 py-3"><BadgeClassificacao classificacao={r.triagem_classificacao} /></td>
                  <td className="num px-4 py-3 text-g80">
                    {r.triagem_indice_aderencia == null
                      ? '—'
                      : `${Math.round(Number(r.triagem_indice_aderencia) * 100)}%`}
                  </td>
                  <td className="px-4 py-3 text-g70">{r.responsavel_auditoria_nome ?? '—'}</td>
                  <td className="px-4 py-3"><BadgePrioridade prioridade={r.prioridade} /></td>
                  <td className="px-4 py-3 text-g70">
                    {r.enviar_clickup
                      ? (r.clickup_sincronizado_em ? 'Sim · sincronizada' : 'Sim · aguardando')
                      : 'Não'}
                  </td>
                  <td className="num px-4 py-3 text-xs text-g50">{dataCurta(r.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aberta && (
        <LeiDoBemDetalhe
          avaliacao={aberta}
          historico={historico.filter((h) => h.avaliacao_id === aberta.id)}
          pessoas={pessoas}
          podeAuditar={podeAuditar}
          onFechar={() => setAbertaId(null)}
        />
      )}
    </div>
  );
}
