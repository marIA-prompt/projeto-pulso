'use client';

import { useEffect, useMemo, useState, useTransition, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  CLASSIFICACAO_LABEL,
  LEI_DO_BEM_CLASSIFICACOES,
  LEI_DO_BEM_PRIORIDADES,
  LEI_DO_BEM_STATUS,
  PRIORIDADE_LEI_DO_BEM_LABEL,
  RESPOSTA_LABEL,
  STATUS_LEI_DO_BEM_LABEL,
  TRIAGEM_PERGUNTAS,
  classeClassificacao,
  type LeiDoBemClassificacao,
  type LeiDoBemPrioridade,
  type LeiDoBemResposta,
  type LeiDoBemStatus,
} from '@/lib/lei-do-bem';
import { atualizarAuditoria, moverStatusLeiDoBem } from './actions';

type Pessoa = { id: string; full_name: string | null };
type ProjetoResumo = {
  id: string;
  title: string;
  directorate: string | null;
  area_id: string | null;
  updated_at: string;
  areas: { name: string } | null;
};

export type AvaliacaoLeiDoBem = {
  id: string;
  project_id: string;
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
  triagem_classificacao: LeiDoBemClassificacao;
  triagem_indice_aderencia: number | null;
  triagem_sintese: string;
  triagem_atualizada_em: string | null;
  status: LeiDoBemStatus;
  responsavel_auditoria_id: string | null;
  parecer: string | null;
  prioridade: LeiDoBemPrioridade | null;
  enviar_clickup: boolean;
  clickup_sincronizado_em: string | null;
  created_at: string;
  updated_at: string;
  projects: ProjetoResumo;
  responsavel: Pessoa | null;
};

type Filtros = {
  busca: string;
  status: '' | LeiDoBemStatus;
  classificacao: '' | LeiDoBemClassificacao;
  responsavel: string;
  prioridade: '' | LeiDoBemPrioridade;
  area: string;
};

const VAZIOS: Filtros = {
  busca: '', status: '', classificacao: '', responsavel: '', prioridade: '', area: '',
};

const CAMPOS_PROJETO = [
  ['objetivo_estrategico_okr', 'Objetivo estratégico / OKR'],
  ['contexto_problema', 'Contexto e problema'],
  ['o_que_sera_desenvolvido', 'O que será desenvolvido ou alterado'],
  ['resultados_esperados', 'Resultados esperados'],
  ['como_sera_desenvolvido', 'Como será desenvolvido'],
  ['fora_do_escopo', 'Fora do escopo'],
  ['desafios_riscos', 'Principais desafios e riscos'],
] as const;

const CAMPOS_TECNICOS = [
  ['descricao_projeto', 'Descrição do projeto'],
  ['elemento_tecnologico_novo', 'Elemento tecnologicamente novo ou inovador'],
  ['barreira_desafio_tecnologico', 'Barreira ou desafio tecnológico'],
  ['metodologia_metodos', 'Metodologia e métodos'],
  ['descritivo_complementar', 'Descritivo complementar'],
] as const;

export function LeiDoBemPainel({
  avaliacoes, pessoas, podeGerenciar,
}: {
  avaliacoes: AvaliacaoLeiDoBem[];
  pessoas: Pessoa[];
  podeGerenciar: boolean;
}) {
  const router = useRouter();
  const [dados, setDados] = useState(avaliacoes);
  const [filtros, setFiltros] = useState<Filtros>(VAZIOS);
  const [modo, setModo] = useState<'lista' | 'kanban'>('lista');
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => setDados(avaliacoes), [avaliacoes]);

  const areas = useMemo(
    () => Array.from(new Set(dados.map((a) => a.projects.areas?.name).filter(Boolean) as string[])).sort(),
    [dados],
  );
  const filtradas = useMemo(() => dados.filter((a) => {
    const busca = filtros.busca.trim().toLocaleLowerCase('pt-BR');
    return (!busca || a.projects.title.toLocaleLowerCase('pt-BR').includes(busca))
      && (!filtros.status || a.status === filtros.status)
      && (!filtros.classificacao || a.triagem_classificacao === filtros.classificacao)
      && (!filtros.responsavel || a.responsavel_auditoria_id === filtros.responsavel)
      && (!filtros.prioridade || a.prioridade === filtros.prioridade)
      && (!filtros.area || a.projects.areas?.name === filtros.area);
  }), [dados, filtros]);
  const selecionada = dados.find((a) => a.id === selecionadaId) ?? null;

  function mudarFiltro<K extends keyof Filtros>(campo: K, valor: Filtros[K]) {
    setFiltros((f) => ({ ...f, [campo]: valor }));
  }

  function mover(id: string, status: LeiDoBemStatus) {
    if (!podeGerenciar) return;
    const anterior = dados.find((a) => a.id === id)?.status;
    if (!anterior || anterior === status) return;
    setDados((atuais) => atuais.map((a) => a.id === id ? { ...a, status } : a));
    setErro(null);
    startTransition(async () => {
      const resultado = await moverStatusLeiDoBem(id, status);
      if (resultado.erro) {
        setDados((atuais) => atuais.map((a) => a.id === id ? { ...a, status: anterior } : a));
        setErro(resultado.erro);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">Pré-análise de PD&amp;I</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Lei do Bem</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-g60">
          Acompanhe a triagem automática e o processo de auditoria. A classificação preliminar sinaliza potencial;
          o status registra a decisão humana.
        </p>
      </header>

      <Kpis avaliacoes={filtradas} />

      <section className="card space-y-4 p-4" aria-label="Filtros da Lei do Bem">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="xl:col-span-2">
            <span className="label">Buscar iniciativa</span>
            <input className="field mt-1" value={filtros.busca} onChange={(e) => mudarFiltro('busca', e.target.value)} placeholder="Nome da iniciativa" />
          </label>
          <FiltroSelect label="Status" value={filtros.status} onChange={(v) => mudarFiltro('status', v as Filtros['status'])}>
            {LEI_DO_BEM_STATUS.map((s) => <option key={s} value={s}>{STATUS_LEI_DO_BEM_LABEL[s]}</option>)}
          </FiltroSelect>
          <FiltroSelect label="Classificação" value={filtros.classificacao} onChange={(v) => mudarFiltro('classificacao', v as Filtros['classificacao'])}>
            {LEI_DO_BEM_CLASSIFICACOES.map((c) => <option key={c} value={c}>{CLASSIFICACAO_LABEL[c]}</option>)}
          </FiltroSelect>
          <FiltroSelect label="Responsável" value={filtros.responsavel} onChange={(v) => mudarFiltro('responsavel', v)}>
            {pessoas.map((p) => <option key={p.id} value={p.id}>{p.full_name || 'Sem nome'}</option>)}
          </FiltroSelect>
          <FiltroSelect label="Prioridade" value={filtros.prioridade} onChange={(v) => mudarFiltro('prioridade', v as Filtros['prioridade'])}>
            {LEI_DO_BEM_PRIORIDADES.map((p) => <option key={p} value={p}>{PRIORIDADE_LEI_DO_BEM_LABEL[p]}</option>)}
          </FiltroSelect>
          <FiltroSelect label="Área" value={filtros.area} onChange={(v) => mudarFiltro('area', v)}>
            {areas.map((area) => <option key={area}>{area}</option>)}
          </FiltroSelect>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => setFiltros(VAZIOS)} className="text-xs font-medium text-[var(--blue)] hover:underline">Limpar filtros</button>
          <div className="flex gap-2" role="group" aria-label="Modo de visualização">
            {(['lista', 'kanban'] as const).map((opcao) => (
              <button
                key={opcao} type="button" onClick={() => setModo(opcao)}
                aria-pressed={modo === opcao}
                className={modo === opcao
                  ? 'rounded-s bg-[var(--navy)] px-3 py-1.5 text-sm font-medium text-white'
                  : 'rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g60 hover:bg-g20'}
              >
                {opcao === 'lista' ? 'Lista' : 'Kanban'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {erro && <p role="alert" className="rounded-s bg-[var(--sig-crit-bg)] p-3 text-sm text-[var(--sig-crit)]">{erro}</p>}

      {filtradas.length === 0 ? (
        <div className="card p-8 text-center text-sm text-g60">Nenhuma iniciativa neste recorte.</div>
      ) : modo === 'lista' ? (
        <Lista avaliacoes={filtradas} abrir={setSelecionadaId} />
      ) : (
        <Kanban
          avaliacoes={filtradas}
          podeGerenciar={podeGerenciar}
          abrir={setSelecionadaId}
          arrastando={arrastando}
          setArrastando={setArrastando}
          mover={mover}
        />
      )}

      {selecionada && (
        <Detalhe
          key={selecionada.id}
          avaliacao={selecionada}
          pessoas={pessoas}
          podeGerenciar={podeGerenciar}
          fechar={() => setSelecionadaId(null)}
          aoSalvar={(atualizada) => {
            setDados((atuais) => atuais.map((a) => a.id === atualizada.id ? atualizada : a));
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function FiltroSelect({
  label, value, onChange, children,
}: {
  label: string; value: string; onChange: (value: string) => void; children: React.ReactNode;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <select className="field mt-1" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todos</option>
        {children}
      </select>
    </label>
  );
}

function Kpis({ avaliacoes }: { avaliacoes: AvaliacaoLeiDoBem[] }) {
  const contar = <T extends string>(campo: (a: AvaliacaoLeiDoBem) => T, valor: T) => (
    avaliacoes.filter((a) => campo(a) === valor).length
  );
  const pendentes = avaliacoes.filter((a) => ['pendente', 'informacoes_insuficientes'].includes(a.triagem_classificacao)).length;
  const clickup = avaliacoes.filter((a) => a.enviar_clickup && !a.clickup_sincronizado_em).length;
  return (
    <section aria-label="Indicadores da Lei do Bem" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi valor={avaliacoes.length} rotulo="Iniciativas na Lei do Bem" nota="Total no recorte filtrado." />
      <Kpi
        valor={contar((a) => a.status, 'em_avaliacao_interna')}
        rotulo="Status da auditoria"
        nota={`${contar((a) => a.status, 'backlog')} backlog · ${contar((a) => a.status, 'enquadrado')} enquadradas · ${contar((a) => a.status, 'nao_enquadrado')} não enquadradas`}
      />
      <Kpi
        valor={contar((a) => a.triagem_classificacao, 'potencialmente_elegivel')}
        rotulo="Classificação da triagem"
        nota={`${contar((a) => a.triagem_classificacao, 'potencial_parcial')} parcial · ${contar((a) => a.triagem_classificacao, 'baixo_potencial')} baixo · ${pendentes} pendentes/insuficientes`}
      />
      <Kpi valor={clickup} rotulo="Prontas para o ClickUp" nota="Marcadas para envio e ainda não sincronizadas." />
    </section>
  );
}

function Kpi({ valor, rotulo, nota }: { valor: number; rotulo: string; nota: string }) {
  return (
    <div className="card p-4">
      <p className="num text-2xl font-semibold leading-none text-[var(--ink-strong)]">{valor}</p>
      <p className="mt-2 text-sm font-medium text-g80">{rotulo}</p>
      <p className="mt-1 text-xs leading-snug text-g50">{nota}</p>
    </div>
  );
}

function Lista({ avaliacoes, abrir }: { avaliacoes: AvaliacaoLeiDoBem[]; abrir: (id: string) => void }) {
  function teclado(e: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      abrir(id);
    }
  }
  return (
    <div className="card overflow-x-auto">
      <table className="min-w-[72rem] w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-g30 text-xs text-g50">
            {['Iniciativa', 'Área / Diretoria', 'Status', 'Classificação', 'Aderência', 'Responsável', 'Prioridade', 'ClickUp', 'Atualização'].map((titulo) => (
              <th key={titulo} className="px-4 py-3 font-semibold">{titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {avaliacoes.map((a) => (
            <tr
              key={a.id} tabIndex={0} onClick={() => abrir(a.id)} onKeyDown={(e) => teclado(e, a.id)}
              className="cursor-pointer border-b border-g20 text-g70 hover:bg-g10 focus:bg-g10"
            >
              <td className="px-4 py-3 font-medium text-g90">{a.projects.title}</td>
              <td className="px-4 py-3">{[a.projects.areas?.name, a.projects.directorate].filter(Boolean).join(' · ') || '—'}</td>
              <td className="px-4 py-3">{STATUS_LEI_DO_BEM_LABEL[a.status]}</td>
              <td className="px-4 py-3"><Classificacao classificacao={a.triagem_classificacao} /></td>
              <td className="num px-4 py-3">{a.triagem_indice_aderencia == null ? '—' : `${Math.round(a.triagem_indice_aderencia * 100)}%`}</td>
              <td className="px-4 py-3">{a.responsavel?.full_name || 'Não atribuído'}</td>
              <td className="px-4 py-3">{a.prioridade ? PRIORIDADE_LEI_DO_BEM_LABEL[a.prioridade] : '—'}</td>
              <td className="px-4 py-3">{a.enviar_clickup ? 'Sim' : 'Não'}</td>
              <td className="num px-4 py-3 text-xs">{formatarData(a.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Kanban({
  avaliacoes, podeGerenciar, abrir, arrastando, setArrastando, mover,
}: {
  avaliacoes: AvaliacaoLeiDoBem[];
  podeGerenciar: boolean;
  abrir: (id: string) => void;
  arrastando: string | null;
  setArrastando: (id: string | null) => void;
  mover: (id: string, status: LeiDoBemStatus) => void;
}) {
  const cores: Record<LeiDoBemStatus, string> = {
    backlog: 'border-t-g40',
    em_avaliacao_interna: 'border-t-[var(--sig-warn)]',
    enquadrado: 'border-t-[var(--sig-ok)]',
    nao_enquadrado: 'border-t-[var(--sig-crit)]',
  };
  return (
    <div className="grid gap-3 lg:grid-cols-4">
      {LEI_DO_BEM_STATUS.map((status) => {
        const cards = avaliacoes.filter((a) => a.status === status);
        return (
          <section
            key={status}
            onDragOver={(e) => { if (podeGerenciar && arrastando) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); if (arrastando) mover(arrastando, status); setArrastando(null); }}
            className={`min-h-48 rounded-m border border-t-4 border-g30 bg-g10 p-3 ${cores[status]}`}
          >
            <header className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-g80">{STATUS_LEI_DO_BEM_LABEL[status]}</h2>
              <span className="num rounded-s bg-g20 px-2 text-xs text-g60">{cards.length}</span>
            </header>
            <div className="space-y-2">
              {cards.map((a) => (
                <article
                  key={a.id} draggable={podeGerenciar}
                  onDragStart={() => setArrastando(a.id)} onDragEnd={() => setArrastando(null)}
                  className={`rounded-s border border-g30 bg-[var(--white)] p-3 shadow-sm ${podeGerenciar ? 'cursor-grab' : ''}`}
                >
                  <button type="button" onClick={() => abrir(a.id)} className="text-left text-sm font-medium text-g90 hover:text-[var(--blue)]">
                    {a.projects.title}
                  </button>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {a.prioridade && <span className="rounded-s bg-g20 px-2 py-0.5 text-[0.65rem] font-medium text-g70">{PRIORIDADE_LEI_DO_BEM_LABEL[a.prioridade]}</span>}
                    <Classificacao classificacao={a.triagem_classificacao} />
                  </div>
                  <p className="mt-2 text-xs text-g50">{a.responsavel?.full_name || 'Sem responsável'}</p>
                  {podeGerenciar && (
                    <label className="mt-3 block">
                      <span className="sr-only">Mover {a.projects.title} para</span>
                      <select className="field py-1 text-xs" value={a.status} onChange={(e) => mover(a.id, e.target.value as LeiDoBemStatus)}>
                        {LEI_DO_BEM_STATUS.map((s) => <option key={s} value={s}>{STATUS_LEI_DO_BEM_LABEL[s]}</option>)}
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
  );
}

function Classificacao({ classificacao }: { classificacao: LeiDoBemClassificacao }) {
  return (
    <span className={`inline-block rounded-s px-2 py-0.5 text-[0.65rem] font-semibold ${classeClassificacao(classificacao)}`}>
      {CLASSIFICACAO_LABEL[classificacao]}
    </span>
  );
}

function Detalhe({
  avaliacao, pessoas, podeGerenciar, fechar, aoSalvar,
}: {
  avaliacao: AvaliacaoLeiDoBem;
  pessoas: Pessoa[];
  podeGerenciar: boolean;
  fechar: () => void;
  aoSalvar: (avaliacao: AvaliacaoLeiDoBem) => void;
}) {
  const [status, setStatus] = useState(avaliacao.status);
  const [responsavel, setResponsavel] = useState(avaliacao.responsavel_auditoria_id ?? '');
  const [parecer, setParecer] = useState(avaliacao.parecer ?? '');
  const [prioridade, setPrioridade] = useState<'' | LeiDoBemPrioridade>(avaliacao.prioridade ?? '');
  const [clickup, setClickup] = useState(avaliacao.enviar_clickup);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function salvar(e: FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const resultado = await atualizarAuditoria(avaliacao.id, {
        status,
        responsavel_auditoria_id: responsavel || null,
        parecer,
        prioridade: prioridade || null,
        enviar_clickup: clickup,
      });
      if (resultado.erro) {
        setMensagem(resultado.erro);
        return;
      }
      setMensagem('Avaliação salva.');
      aoSalvar({
        ...avaliacao,
        status,
        responsavel_auditoria_id: responsavel || null,
        responsavel: pessoas.find((p) => p.id === responsavel) ?? null,
        parecer,
        prioridade: prioridade || null,
        enviar_clickup: clickup,
      });
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[rgba(0,0,0,.38)]" onMouseDown={(e) => { if (e.target === e.currentTarget) fechar(); }}>
      <aside role="dialog" aria-modal="true" aria-labelledby="detalhe-titulo" className="h-full w-full max-w-3xl overflow-y-auto bg-[var(--white)] p-5 shadow-[var(--sh-3)] sm:p-7">
        <header className="flex items-start justify-between gap-4 border-b border-g30 pb-4">
          <div>
            <p className="num text-xs uppercase tracking-wider text-g50">Auditoria Lei do Bem</p>
            <h2 id="detalhe-titulo" className="mt-1 text-xl font-semibold">{avaliacao.projects.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Classificacao classificacao={avaliacao.triagem_classificacao} />
              <span className="num text-xs text-g50">Aderência {avaliacao.triagem_indice_aderencia == null ? '—' : `${Math.round(avaliacao.triagem_indice_aderencia * 100)}%`}</span>
            </div>
          </div>
          <button type="button" onClick={fechar} aria-label="Fechar painel" className="rounded-s border border-g40 px-3 py-1.5 text-sm text-g60 hover:bg-g20">✕</button>
        </header>

        <div className="space-y-7 py-6">
          <SecaoLeitura titulo="Cadastro do projeto" campos={CAMPOS_PROJETO} avaliacao={avaliacao} />
          <SecaoLeitura titulo="Avaliação técnica (MCTI)" campos={CAMPOS_TECNICOS} avaliacao={avaliacao} />

          <section>
            <h3 className="text-base font-semibold">Triagem preliminar</h3>
            <div className="mt-3 space-y-2">
              {TRIAGEM_PERGUNTAS.map((pergunta) => {
                const resposta = avaliacao[`triagem_${String(pergunta.numero).padStart(2, '0')}` as keyof AvaliacaoLeiDoBem] as LeiDoBemResposta | null;
                return (
                  <div key={pergunta.numero} className="grid gap-2 rounded-s bg-g10 p-3 text-sm sm:grid-cols-[1fr_auto]">
                    <p className="leading-relaxed text-g70"><span className="num mr-1 text-g50">{pergunta.numero}.</span> {pergunta.texto}</p>
                    <strong className="font-medium text-g90">{resposta ? RESPOSTA_LABEL[resposta] : 'Não respondida'}</strong>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 rounded-s bg-g20 p-4">
              <p className="text-sm leading-relaxed text-g80">{avaliacao.triagem_sintese}</p>
              <p className="mt-2 text-xs text-g50">Triagem somente leitura. Para alterar respostas, edite a iniciativa.</p>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold">Gestão da auditoria</h3>
            <form onSubmit={salvar} className="mt-3 space-y-4 rounded-m border border-g30 p-4">
              <fieldset disabled={!podeGerenciar || pendente} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label><span className="label">Status</span><select className="field mt-1" value={status} onChange={(e) => setStatus(e.target.value as LeiDoBemStatus)}>{LEI_DO_BEM_STATUS.map((s) => <option key={s} value={s}>{STATUS_LEI_DO_BEM_LABEL[s]}</option>)}</select></label>
                  <label><span className="label">Responsável da auditoria</span><select className="field mt-1" value={responsavel} onChange={(e) => setResponsavel(e.target.value)}><option value="">Não atribuído</option>{pessoas.map((p) => <option key={p.id} value={p.id}>{p.full_name || 'Sem nome'}</option>)}</select></label>
                  <label><span className="label">Prioridade</span><select className="field mt-1" value={prioridade} onChange={(e) => setPrioridade(e.target.value as '' | LeiDoBemPrioridade)}><option value="">Não definida</option>{LEI_DO_BEM_PRIORIDADES.map((p) => <option key={p} value={p}>{PRIORIDADE_LEI_DO_BEM_LABEL[p]}</option>)}</select></label>
                  <label className="flex items-center gap-2 self-end rounded-s bg-g20 p-3 text-sm text-g80"><input type="checkbox" checked={clickup} onChange={(e) => setClickup(e.target.checked)} /> Enviar para o ClickUp</label>
                </div>
                <label className="block"><span className="label">Parecer</span><textarea className="field mt-1" rows={6} value={parecer} onChange={(e) => setParecer(e.target.value)} placeholder="Laudo ou opinião técnica da auditoria." /></label>
              </fieldset>
              {!podeGerenciar && <p className="text-xs text-g50">Somente perfis gerenciais e administradores editam estes campos.</p>}
              {mensagem && <p role="status" className="text-sm text-g60">{mensagem}</p>}
              {podeGerenciar && <Button type="submit" disabled={pendente}>{pendente ? 'Salvando…' : 'Salvar avaliação'}</Button>}
            </form>
          </section>
        </div>
      </aside>
    </div>
  );
}

function SecaoLeitura({
  titulo, campos, avaliacao,
}: {
  titulo: string;
  campos: ReadonlyArray<readonly [keyof AvaliacaoLeiDoBem, string]>;
  avaliacao: AvaliacaoLeiDoBem;
}) {
  return (
    <section>
      <h3 className="text-base font-semibold">{titulo}</h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {campos.map(([campo, label]) => (
          <div key={campo} className="rounded-s border border-g30 p-3">
            <dt className="text-xs font-semibold text-g50">{label}</dt>
            <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed text-g80">{String(avaliacao[campo] || 'Não informado')}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(data));
}
