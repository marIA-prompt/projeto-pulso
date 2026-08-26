'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';
import { clsx } from '@/lib/clsx';
import { dataCurta, nf } from '@/lib/format';
import { rotuloPessoa, type PessoaOpcao } from '@/lib/pessoas';
import {
  AVISO_TRIAGEM,
  GRUPO1_CAMPOS,
  GRUPO2_CAMPOS,
  LEI_DO_BEM_CLASSIFICACAO_LABEL,
  LEI_DO_BEM_CLASSIFICACAO_TOM,
  LEI_DO_BEM_CLASSIFICACOES,
  LEI_DO_BEM_PRIORIDADE_LABEL,
  LEI_DO_BEM_PRIORIDADES,
  LEI_DO_BEM_RESPOSTA_LABEL,
  LEI_DO_BEM_STATUS,
  LEI_DO_BEM_STATUS_LABEL,
  LEI_DO_BEM_STATUS_TOM,
  PROXIMA_ACAO,
  TRIAGEM_ITENS,
  classeBadgeTom,
  type LeiDoBemClassificacao,
  type LeiDoBemPrioridade,
  type LeiDoBemResposta,
  type LeiDoBemStatus,
} from '@/lib/lei-do-bem';
import {
  atualizarAuditoriaLeiDoBem,
  moverStatusLeiDoBem,
  type EstadoAuditoria,
} from '@/app/(app)/lei-do-bem/actions';

export type LinhaLeiDoBem = {
  id: string;
  project_id: string;
  title: string;
  directorate: string | null;
  area_id: string | null;
  area_name: string | null;
  owner_id: string | null;
  owner_name: string | null;
  status: LeiDoBemStatus;
  triagem_classificacao: LeiDoBemClassificacao | null;
  triagem_indice_aderencia: number | null;
  triagem_sintese: string | null;
  triagem_atualizada_em: string | null;
  responsavel_auditoria_id: string | null;
  responsavel_auditoria_nome: string | null;
  responsavel_auditoria_avatar: string | null;
  parecer: string | null;
  prioridade: LeiDoBemPrioridade | null;
  enviar_clickup: boolean;
  clickup_sincronizado_em: string | null;
  objetivo_estrategico_okr: string | null;
  contexto_problema: string | null;
  o_que_sera_desenvolvido: string | null;
  resultados_esperados: string | null;
  como_sera_desenvolvido: string | null;
  fora_do_escopo: string | null;
  desafios_riscos: string | null;
  descricao_projeto: string | null;
  elemento_tecnologico_novo: string | null;
  barreira_desafio_tecnologico: string | null;
  metodologia_metodos: string | null;
  descritivo_complementar: string | null;
  triagem_01: LeiDoBemResposta | null;
  triagem_02: LeiDoBemResposta | null;
  triagem_03: LeiDoBemResposta | null;
  triagem_04: LeiDoBemResposta | null;
  triagem_05: LeiDoBemResposta | null;
  triagem_06: LeiDoBemResposta | null;
  triagem_07: LeiDoBemResposta | null;
  triagem_08: LeiDoBemResposta | null;
  triagem_09: LeiDoBemResposta | null;
  triagem_10: LeiDoBemResposta | null;
  triagem_11: LeiDoBemResposta | null;
  triagem_12: LeiDoBemResposta | null;
  created_at: string;
  updated_at: string;
};

export type LogStatusLeiDoBem = {
  id: string;
  avaliacao_id: string;
  de: LeiDoBemStatus | null;
  para: LeiDoBemStatus;
  created_at: string;
  changed_by: string | null;
};

type Filtros = {
  q: string;
  status: string;
  classificacao: string;
  responsavel: string;
  prioridade: string;
  area: string;
};

const PADRAO: Filtros = {
  q: '', status: '', classificacao: '', responsavel: '', prioridade: '', area: '',
};

function Kpi({ valor, rotulo, nota }: { valor: string; rotulo: string; nota?: string }) {
  return (
    <div className="card p-4">
      <p className="num text-2xl font-semibold leading-none text-[var(--ink-strong)]">{valor}</p>
      <p className="mt-2 text-sm font-medium text-g80">{rotulo}</p>
      {nota && <p className="mt-1 text-xs leading-snug text-g50">{nota}</p>}
    </div>
  );
}

function BadgeClassificacao({ c }: { c: LeiDoBemClassificacao | null }) {
  if (!c) return <span className="text-xs text-g50">—</span>;
  return (
    <span className={clsx('rounded-s px-2 py-0.5 text-xs font-semibold', classeBadgeTom(LEI_DO_BEM_CLASSIFICACAO_TOM[c]))}>
      {LEI_DO_BEM_CLASSIFICACAO_LABEL[c]}
    </span>
  );
}

function BadgePrioridade({ p }: { p: LeiDoBemPrioridade | null }) {
  if (!p) return null;
  const tom = p === 'alta' ? 'crit' : p === 'media' ? 'warn' : 'g';
  return (
    <span className={clsx('rounded-s px-2 py-0.5 text-xs font-medium', classeBadgeTom(tom))}>
      {LEI_DO_BEM_PRIORIDADE_LABEL[p]}
    </span>
  );
}

export function LeiDoBemQuadro({
  linhas, pessoas, logs = [], podeAuditar,
}: {
  linhas: LinhaLeiDoBem[];
  pessoas: PessoaOpcao[];
  logs?: LogStatusLeiDoBem[];
  podeAuditar: boolean;
}) {
  const [f, setF] = useState<Filtros>(PADRAO);
  const [kanban, setKanban] = useState(false);
  const [selecionada, setSelecionada] = useState<LinhaLeiDoBem | null>(null);
  const [cards, setCards] = useState(linhas);

  useEffect(() => { setCards(linhas); }, [linhas]);
  useEffect(() => {
    if (!selecionada) return;
    const atual = linhas.find((l) => l.id === selecionada.id);
    if (atual) setSelecionada(atual);
  }, [linhas, selecionada]);

  const filtradas = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return cards.filter((r) => {
      if (q && !`${r.title} ${r.area_name ?? ''} ${r.directorate ?? ''}`.toLowerCase().includes(q)) return false;
      if (f.status && r.status !== f.status) return false;
      if (f.classificacao) {
        if (f.classificacao === 'pendente_ou_insuficiente') {
          if (r.triagem_classificacao !== 'pendente' && r.triagem_classificacao !== 'informacoes_insuficientes') return false;
        } else if (r.triagem_classificacao !== f.classificacao) return false;
      }
      if (f.responsavel && r.responsavel_auditoria_id !== f.responsavel) return false;
      if (f.prioridade && r.prioridade !== f.prioridade) return false;
      if (f.area && r.area_name !== f.area) return false;
      return true;
    });
  }, [cards, f]);

  const kpis = useMemo(() => {
    const n = filtradas.length;
    const porStatus = (s: LeiDoBemStatus) => filtradas.filter((r) => r.status === s).length;
    const porClasse = (c: LeiDoBemClassificacao) => filtradas.filter((r) => r.triagem_classificacao === c).length;
    return {
      total: n,
      backlog: porStatus('backlog'),
      avaliacao: porStatus('em_avaliacao_interna'),
      enquadradas: porStatus('enquadrado'),
      naoEnquadradas: porStatus('nao_enquadrado'),
      elegiveis: porClasse('potencialmente_elegivel'),
      parcial: porClasse('potencial_parcial'),
      baixo: porClasse('baixo_potencial'),
      pendentes: porClasse('pendente') + porClasse('informacoes_insuficientes'),
      clickup: filtradas.filter((r) => r.enviar_clickup && !r.clickup_sincronizado_em).length,
    };
  }, [filtradas]);

  const areas = useMemo(
    () => Array.from(new Set(linhas.map((r) => r.area_name).filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [linhas],
  );

  return (
    <div className="space-y-6">
      <section aria-labelledby="kpis-processo">
        <h2 id="kpis-processo" className="mb-3 text-sm font-semibold text-g80">Processo de auditoria</h2>
        <p className="mb-3 text-xs text-g50">Estágio manual da avaliação — distinto da classificação automática da triagem.</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi valor={nf.format(kpis.total)} rotulo="Na aba Lei do Bem" />
          <Kpi valor={nf.format(kpis.backlog)} rotulo="Em backlog" />
          <Kpi valor={nf.format(kpis.avaliacao)} rotulo="Em avaliação interna" />
          <Kpi valor={nf.format(kpis.enquadradas)} rotulo="Enquadradas" />
          <Kpi valor={nf.format(kpis.naoEnquadradas)} rotulo="Não enquadradas" />
        </div>
      </section>

      <section aria-labelledby="kpis-triagem">
        <h2 id="kpis-triagem" className="mb-3 text-sm font-semibold text-g80">Classificação da triagem</h2>
        <p className="mb-3 text-xs text-g50">Resultado automático das 12 perguntas, calculado no cadastro.</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi valor={nf.format(kpis.elegiveis)} rotulo="Potencialmente elegíveis" />
          <Kpi valor={nf.format(kpis.parcial)} rotulo="Potencial parcial" />
          <Kpi valor={nf.format(kpis.baixo)} rotulo="Baixo potencial" />
          <Kpi valor={nf.format(kpis.pendentes)} rotulo="Pendentes / insuficientes" />
          <Kpi
            valor={nf.format(kpis.clickup)}
            rotulo="Prontas para o ClickUp"
            nota="Flag marcada e ainda não sincronizadas."
          />
        </div>
      </section>

      <section className="card p-4" aria-labelledby="filtros-ldb">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="filtros-ldb" className="text-base font-semibold">Filtrar</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" type="button" onClick={() => setF(PADRAO)}>Limpar filtros</Button>
            <nav aria-label="Modo de visualização" className="flex gap-2">
              <button
                type="button"
                onClick={() => setKanban(false)}
                aria-current={!kanban ? 'true' : undefined}
                className={clsx(
                  'rounded-s px-3 py-1.5 text-sm font-medium',
                  !kanban ? 'bg-[var(--navy)] text-white' : 'border border-g40 text-g60 hover:bg-g20',
                )}
              >Lista</button>
              <button
                type="button"
                onClick={() => setKanban(true)}
                aria-current={kanban ? 'true' : undefined}
                className={clsx(
                  'rounded-s px-3 py-1.5 text-sm font-medium',
                  kanban ? 'bg-[var(--navy)] text-white' : 'border border-g40 text-g60 hover:bg-g20',
                )}
              >Kanban</button>
            </nav>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label" htmlFor="ldb-q">Buscar</label>
            <input
              id="ldb-q" type="search" className="field mt-1" value={f.q}
              placeholder="Nome da iniciativa"
              onChange={(e) => setF((p) => ({ ...p, q: e.target.value }))}
            />
          </div>
          <SelectFiltro
            id="ldb-status" rotulo="Status da auditoria" valor={f.status}
            opcoes={LEI_DO_BEM_STATUS.map((s) => ({ v: s, r: LEI_DO_BEM_STATUS_LABEL[s] }))}
            onChange={(v) => setF((p) => ({ ...p, status: v }))}
          />
          <div>
            <label className="label" htmlFor="ldb-classe">Classificação da triagem</label>
            <select id="ldb-classe" className="field mt-1" value={f.classificacao}
                    onChange={(e) => setF((p) => ({ ...p, classificacao: e.target.value }))}>
              <option value="">Todas</option>
              {LEI_DO_BEM_CLASSIFICACOES.filter((c) => c !== 'pendente' && c !== 'informacoes_insuficientes').map((c) => (
                <option key={c} value={c}>{LEI_DO_BEM_CLASSIFICACAO_LABEL[c]}</option>
              ))}
              <option value="pendente_ou_insuficiente">Pendentes / informações insuficientes</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ldb-resp">Responsável da auditoria</label>
            <select id="ldb-resp" className="field mt-1" value={f.responsavel}
                    onChange={(e) => setF((p) => ({ ...p, responsavel: e.target.value }))}>
              <option value="">Todos</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>{rotuloPessoa(p)}</option>
              ))}
            </select>
          </div>
          <SelectFiltro
            id="ldb-prio" rotulo="Prioridade" valor={f.prioridade}
            opcoes={LEI_DO_BEM_PRIORIDADES.map((p) => ({ v: p, r: LEI_DO_BEM_PRIORIDADE_LABEL[p] }))}
            onChange={(v) => setF((p) => ({ ...p, prioridade: v }))}
          />
          <SelectFiltro
            id="ldb-area" rotulo="Área" valor={f.area}
            opcoes={areas.map((a) => ({ v: a, r: a }))}
            onChange={(v) => setF((p) => ({ ...p, area: v }))}
          />
        </div>
        <p aria-live="polite" className="mt-3 text-sm text-g60">
          Mostrando <strong className="num text-g90">{nf.format(filtradas.length)}</strong> de{' '}
          <span className="num">{nf.format(linhas.length)}</span> iniciativas.
        </p>
      </section>

      {kanban ? (
        <Kanban
          linhas={filtradas}
          podeMover={podeAuditar}
          onAbrir={setSelecionada}
          onMover={(id, status, anterior) => {
            setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));
            return anterior;
          }}
          onErro={(id, anterior) => {
            setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status: anterior } : c)));
          }}
        />
      ) : (
        <Lista linhas={filtradas} onAbrir={setSelecionada} />
      )}

      {selecionada && (
        <Detalhe
          key={selecionada.id}
          linha={selecionada}
          pessoas={pessoas}
          logs={logs.filter((l) => l.avaliacao_id === selecionada.id)}
          podeAuditar={podeAuditar}
          onFechar={() => setSelecionada(null)}
        />
      )}
    </div>
  );
}

function SelectFiltro({
  id, rotulo, valor, opcoes, onChange,
}: {
  id: string; rotulo: string; valor: string;
  opcoes: { v: string; r: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>{rotulo}</label>
      <select id={id} className="field mt-1" value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todos</option>
        {opcoes.map((o) => <option key={o.v} value={o.v}>{o.r}</option>)}
      </select>
    </div>
  );
}

function Lista({ linhas, onAbrir }: { linhas: LinhaLeiDoBem[]; onAbrir: (l: LinhaLeiDoBem) => void }) {
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;
  const total = Math.max(1, Math.ceil(linhas.length / porPagina));
  useEffect(() => { setPagina(1); }, [linhas.length]);
  const atual = Math.min(pagina, total);
  const visiveis = linhas.slice((atual - 1) * porPagina, atual * porPagina);

  if (linhas.length === 0) {
    return <p className="card p-8 text-center text-sm text-g60">Nenhuma iniciativa neste recorte.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-m border border-g30">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-g30 bg-g10 text-left text-xs uppercase tracking-wide text-g50">
              <th className="p-3 font-medium">Iniciativa</th>
              <th className="p-3 font-medium">Área / Diretoria</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Triagem</th>
              <th className="p-3 font-medium">Índice</th>
              <th className="p-3 font-medium">Responsável</th>
              <th className="p-3 font-medium">Prioridade</th>
              <th className="p-3 font-medium">ClickUp</th>
              <th className="p-3 font-medium">Atualização</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((r) => (
              <tr
                key={r.id}
                onClick={() => onAbrir(r)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAbrir(r); } }}
                tabIndex={0}
                className="cursor-pointer border-b border-g20 hover:bg-g10"
              >
                <td className="p-3 font-medium text-g90">{r.title}</td>
                <td className="p-3 text-g70">
                  {r.area_name ?? '—'}
                  {r.directorate && <span className="block text-xs text-g50">{r.directorate}</span>}
                </td>
                <td className="p-3">{LEI_DO_BEM_STATUS_LABEL[r.status]}</td>
                <td className="p-3"><BadgeClassificacao c={r.triagem_classificacao} /></td>
                <td className="num p-3 text-g70">
                  {r.triagem_indice_aderencia == null ? '—' : `${Math.round(Number(r.triagem_indice_aderencia) * 100)}%`}
                </td>
                <td className="p-3 text-g70">{r.responsavel_auditoria_nome ?? '—'}</td>
                <td className="p-3"><BadgePrioridade p={r.prioridade} /></td>
                <td className="p-3 text-g70">{r.enviar_clickup ? 'Sim' : 'Não'}</td>
                <td className="num p-3 text-xs text-g50">{dataCurta(r.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {linhas.length > porPagina && (
        <div className="flex items-center justify-end gap-1">
          <button type="button" onClick={() => setPagina(Math.max(1, atual - 1))} disabled={atual === 1}
                  className="rounded-s border border-g40 px-2 py-1 text-xs text-g70 hover:bg-g20 disabled:opacity-40">Anterior</button>
          <span className="num px-2 text-xs text-g60">{atual}/{total}</span>
          <button type="button" onClick={() => setPagina(Math.min(total, atual + 1))} disabled={atual === total}
                  className="rounded-s border border-g40 px-2 py-1 text-xs text-g70 hover:bg-g20 disabled:opacity-40">Próxima</button>
        </div>
      )}
    </div>
  );
}

const FAIXA: Record<LeiDoBemStatus, string> = {
  backlog: 'border-t-4 border-g40',
  em_avaliacao_interna: 'border-t-4 border-[var(--sig-warn)]',
  enquadrado: 'border-t-4 border-[var(--sig-ok)]',
  nao_enquadrado: 'border-t-4 border-[var(--sig-crit)]',
};

function Kanban({
  linhas, podeMover, onAbrir, onMover, onErro,
}: {
  linhas: LinhaLeiDoBem[];
  podeMover: boolean;
  onAbrir: (l: LinhaLeiDoBem) => void;
  onMover: (id: string, status: LeiDoBemStatus, anterior: LeiDoBemStatus) => LeiDoBemStatus;
  onErro: (id: string, anterior: LeiDoBemStatus) => void;
}) {
  const router = useRouter();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<LeiDoBemStatus | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function soltar(status: LeiDoBemStatus) {
    const id = arrastando;
    setArrastando(null);
    setAlvo(null);
    if (!id) return;
    const atual = linhas.find((c) => c.id === id);
    if (!atual || atual.status === status) return;
    const anterior = atual.status;
    onMover(id, status, anterior);
    setErro(null);
    startTransition(async () => {
      const res = await moverStatusLeiDoBem(id, status);
      if (res.erro) {
        onErro(id, anterior);
        setErro(res.erro);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {erro && (
        <p role="alert" className="rounded-s bg-[var(--sig-crit-bg)] px-3 py-2 text-sm text-[var(--sig-crit)]">
          {erro}
        </p>
      )}
      {podeMover && (
        <p className="text-xs text-g50">
          Arraste um card para outra coluna para mudar o status da auditoria, ou use o seletor no card.
        </p>
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-3">
        {LEI_DO_BEM_STATUS.map((status) => {
          const daRaia = linhas.filter((c) => c.status === status);
          return (
            <section
              key={status}
              onDragOver={(e) => { if (podeMover && arrastando) { e.preventDefault(); setAlvo(status); } }}
              onDrop={(e) => { e.preventDefault(); if (podeMover) soltar(status); }}
              className={clsx(
                'flex min-w-0 flex-col rounded-m border p-2',
                FAIXA[status],
                alvo === status ? 'border-[var(--blue)] bg-[var(--blue-tint,rgba(37,99,235,.06))]' : 'border-g30 bg-g10',
              )}
            >
              <header className="mb-2 flex items-center justify-between gap-1 px-1">
                <h3 className="truncate text-sm font-semibold text-g80">{LEI_DO_BEM_STATUS_LABEL[status]}</h3>
                <span className="num shrink-0 rounded-s bg-g20 px-1.5 text-xs text-g60">{daRaia.length}</span>
              </header>
              <div className="flex min-h-[4rem] flex-1 flex-col gap-2">
                {daRaia.map((c) => (
                  <article
                    key={c.id}
                    draggable={podeMover}
                    onDragStart={() => setArrastando(c.id)}
                    onDragEnd={() => { setArrastando(null); setAlvo(null); }}
                    className={clsx(
                      'rounded-s border border-g30 bg-[var(--white)] p-3 shadow-sm',
                      podeMover && 'cursor-grab active:cursor-grabbing',
                      arrastando === c.id && 'opacity-50',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onAbrir(c)}
                      className="text-left text-sm font-medium text-g90 hover:text-[var(--blue)]"
                    >
                      {c.title}
                    </button>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <BadgePrioridade p={c.prioridade} />
                      <BadgeClassificacao c={c.triagem_classificacao} />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar
                        src={c.responsavel_auditoria_avatar}
                        nome={c.responsavel_auditoria_nome ?? 'Sem responsável'}
                        size={20}
                      />
                      <span className="truncate text-xs text-g50">
                        {c.responsavel_auditoria_nome ?? 'Sem responsável'}
                      </span>
                    </div>
                    {podeMover && (
                      <label className="mt-2 block">
                        <span className="sr-only">Mover status de {c.title}</span>
                        <select
                          className="field py-1 text-xs"
                          value={c.status}
                          onChange={(e) => {
                            const novo = e.target.value as LeiDoBemStatus;
                            if (novo === c.status) return;
                            const anterior = c.status;
                            onMover(c.id, novo, anterior);
                            startTransition(async () => {
                              const res = await moverStatusLeiDoBem(c.id, novo);
                              if (res.erro) {
                                onErro(c.id, anterior);
                                setErro(res.erro);
                              } else {
                                router.refresh();
                              }
                            });
                          }}
                        >
                          {LEI_DO_BEM_STATUS.map((s) => (
                            <option key={s} value={s}>{LEI_DO_BEM_STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Detalhe({
  linha, pessoas, logs, podeAuditar, onFechar,
}: {
  linha: LinhaLeiDoBem;
  pessoas: PessoaOpcao[];
  logs: LogStatusLeiDoBem[];
  podeAuditar: boolean;
  onFechar: () => void;
}) {
  const router = useRouter();
  const acao = atualizarAuditoriaLeiDoBem.bind(null, linha.id);
  const [estado, formAction] = useFormState(acao, {} as EstadoAuditoria);
  const classe = linha.triagem_classificacao ?? 'pendente';

  useEffect(() => {
    if (estado.ok) router.refresh();
  }, [estado.ok, router]);

  return (
    <div
      role="dialog" aria-modal="true" aria-label={`Auditoria de ${linha.title}`}
      onClick={onFechar}
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">Lei do Bem</p>
            <h3 className="mt-1 text-lg font-bold text-g90">{linha.title}</h3>
            <p className="mt-1 text-xs text-g50">
              {linha.area_name ?? 'Área não informada'}
              {linha.directorate && ` · ${linha.directorate}`}
              {linha.owner_name && ` · ${linha.owner_name}`}
            </p>
          </div>
          <button onClick={onFechar} aria-label="Fechar"
                  className="shrink-0 rounded-s border border-g40 px-2 py-1 text-sm text-g60 hover:bg-g20">✕</button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={clsx('rounded-s px-2 py-0.5 text-xs font-medium', classeBadgeTom(LEI_DO_BEM_STATUS_TOM[linha.status] === 'g' ? 'g' : LEI_DO_BEM_STATUS_TOM[linha.status]))}>
            {LEI_DO_BEM_STATUS_LABEL[linha.status]}
          </span>
          <BadgeClassificacao c={linha.triagem_classificacao} />
          <BadgePrioridade p={linha.prioridade} />
        </div>

        <Bloco titulo="Cadastro do projeto">
          {GRUPO1_CAMPOS.map((c) => (
            <CampoLeitura key={c.name} rotulo={c.label} valor={(linha as unknown as Record<string, string | null>)[c.name]} />
          ))}
        </Bloco>

        <Bloco titulo="Avaliação técnica (MCTI)">
          {GRUPO2_CAMPOS.map((c) => (
            <CampoLeitura key={c.name} rotulo={c.label} valor={(linha as unknown as Record<string, string | null>)[c.name]} />
          ))}
        </Bloco>

        <Bloco titulo="Triagem preliminar">
          <p className="text-xs text-g50">Somente leitura — para reeditar, abra o cadastro da iniciativa.</p>
          <div className="rounded-s bg-g10 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <BadgeClassificacao c={linha.triagem_classificacao} />
              <span className="num text-sm text-g70">
                {linha.triagem_indice_aderencia == null
                  ? 'Índice —'
                  : `${Math.round(Number(linha.triagem_indice_aderencia) * 100)}%`}
              </span>
            </div>
            {linha.triagem_sintese && (
              <p className="mt-2 text-sm leading-relaxed text-g70">{linha.triagem_sintese}</p>
            )}
            <p className="mt-1 text-xs font-medium text-g60">Próxima ação: {PROXIMA_ACAO[classe]}</p>
            <p className="mt-1 text-xs text-g50">{AVISO_TRIAGEM}</p>
            {linha.triagem_atualizada_em && (
              <p className="mt-1 text-xs text-g50">
                Triagem atualizada em {dataCurta(linha.triagem_atualizada_em)}.
                Recálculo é automático se as 12 respostas forem editadas no cadastro.
              </p>
            )}
          </div>
          <ol className="space-y-2">
            {TRIAGEM_ITENS.map((item) => {
              const v = (linha as unknown as Record<string, LeiDoBemResposta | null>)[item.campo];
              return (
                <li key={item.campo} className="text-sm">
                  <span className="num text-xs text-g50">{item.n}.</span>{' '}
                  <span className="text-g70">{item.pergunta}</span>
                  <span className="ml-2 font-medium text-g90">
                    {v ? LEI_DO_BEM_RESPOSTA_LABEL[v] : '—'}
                  </span>
                </li>
              );
            })}
          </ol>
        </Bloco>

        {logs.length > 0 && (
          <Bloco titulo="Histórico de status">
            <ol className="space-y-2">
              {logs.map((l) => (
                <li key={l.id} className="text-sm text-g70">
                  <span className="num text-xs text-g50">{dataCurta(l.created_at)}</span>
                  {' · '}
                  {l.de ? LEI_DO_BEM_STATUS_LABEL[l.de] : '—'}
                  {' → '}
                  <strong className="font-medium text-g90">{LEI_DO_BEM_STATUS_LABEL[l.para]}</strong>
                  {l.changed_by && (
                    <span className="text-g50">
                      {' · '}
                      {rotuloPessoa(pessoas.find((p) => p.id === l.changed_by))}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </Bloco>
        )}

        <form action={formAction} key={`${linha.id}-${linha.updated_at}`} className="mt-6 space-y-4 border-t border-g30 pt-4">
          <h4 className="text-sm font-semibold text-g90">Auditoria</h4>
          {estado.erro && <ErroBox mensagem={estado.erro} />}
          {estado.ok && (
            <p role="status" className="rounded-s bg-[var(--sig-ok-bg)] px-3 py-2 text-sm text-[var(--sig-ok)]">
              Parecer salvo.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="aud-status">Status</label>
              <select id="aud-status" name="status" className="field mt-1" defaultValue={linha.status} disabled={!podeAuditar}>
                {LEI_DO_BEM_STATUS.map((s) => (
                  <option key={s} value={s}>{LEI_DO_BEM_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="aud-resp">Responsável da auditoria</label>
              <select id="aud-resp" name="responsavel_auditoria_id" className="field mt-1"
                      defaultValue={linha.responsavel_auditoria_id ?? ''} disabled={!podeAuditar}>
                <option value="">Não atribuído</option>
                {pessoas.map((p) => (
                  <option key={p.id} value={p.id}>{rotuloPessoa(p)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="aud-prio">Prioridade</label>
              <select id="aud-prio" name="prioridade" className="field mt-1"
                      defaultValue={linha.prioridade ?? ''} disabled={!podeAuditar}>
                <option value="">Não informada</option>
                {LEI_DO_BEM_PRIORIDADES.map((p) => (
                  <option key={p} value={p}>{LEI_DO_BEM_PRIORIDADE_LABEL[p]}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-g80">
                <input
                  type="checkbox"
                  name="enviar_clickup"
                  defaultChecked={linha.enviar_clickup}
                  disabled={!podeAuditar}
                />
                Enviar para o ClickUp
              </label>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="aud-parecer">Parecer</label>
            <textarea
              id="aud-parecer" name="parecer" rows={4} className="field mt-1"
              defaultValue={linha.parecer ?? ''}
              disabled={!podeAuditar}
              placeholder="Laudo técnico da auditoria."
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href={`/projetos/${linha.project_id}`}
              className="rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g80 hover:bg-g20"
            >
              Abrir cadastro
            </Link>
            {podeAuditar ? <SalvarAuditoria /> : (
              <p className="self-center text-xs text-g50">Somente gerencial ou administrador edita a auditoria.</p>
            )}
            <button type="button" onClick={onFechar}
                    className="rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g80 hover:bg-g20">
              Fechar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SalvarAuditoria() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : 'Salvar auditoria'}</Button>;
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 space-y-3">
      <h4 className="text-sm font-semibold text-g90">{titulo}</h4>
      {children}
    </section>
  );
}

function CampoLeitura({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-g50">{rotulo}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm text-g80">{valor?.trim() ? valor : '—'}</dd>
    </div>
  );
}
