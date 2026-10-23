'use client';

import { useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import { clsx } from '@/lib/clsx';
import { diaCurto, nf, nf1, plural } from '@/lib/format';
import {
  type AuditoriaIniciativa,
  type AuditoriaPessoa,
  type RankingCategoria,
} from '@/lib/ranking';
import { STAGE_LABEL } from '@/lib/types';

const CATEGORIA_LABEL: Record<RankingCategoria, string> = {
  entregas: 'Volume de entregas',
  especialistas: 'Especialistas',
  colaboradores: 'Colaboração',
};

export function AuditoriaRanking({
  dados, categoria, onFechar,
}: {
  dados: AuditoriaPessoa;
  categoria: RankingCategoria;
  onFechar: () => void;
}) {
  const tituloId = useId();
  const fecharRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.activeElement;
    fecharRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onFechar();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (prev instanceof HTMLElement) prev.focus();
    };
  }, [onFechar]);

  const formulaEsp = `${nf.format(dados.volumeHabilidades)} × 10 + ${nf.format(dados.complexidadeTotal)} = ${nf.format(dados.scoreEspecialista)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
      onClick={onFechar}
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar src={dados.avatar_url} nome={dados.nome} size={48} />
            <div className="min-w-0">
              <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">
                Auditoria · {CATEGORIA_LABEL[categoria]}
              </p>
              <h3 id={tituloId} className="mt-1 truncate text-lg font-bold text-g90">{dados.nome}</h3>
              <p className="mt-0.5 text-xs text-g50">
                {dados.area_name ?? 'Área não informada'}
                {' · '}
                {diaCurto(dados.corteDesde)} – {diaCurto(dados.corteAte)}
                {!dados.entregasNaJanela ? ' · volume pelo histórico' : ''}
              </p>
            </div>
          </div>
          <button
            ref={fecharRef}
            type="button"
            onClick={onFechar}
            aria-label="Fechar auditoria"
            className="shrink-0 rounded-s border border-g40 px-2 py-1 text-sm text-g60 hover:bg-g20"
          >
            ✕
          </button>
        </div>

        <Bloco destaque={categoria === 'entregas'} titulo="Entregas" resumo={
          dados.entregasQtd === 0
            ? 'Nenhuma entrega neste recorte.'
            : `${plural(dados.entregasQtd, 'entrega', 'entregas')}${dados.horasMes > 0 ? ` · ${nf1.format(dados.horasMes)} h/mês` : ''}`
        }>
          {dados.entregas.length === 0 ? (
            <p className="text-sm text-g50">Sem iniciativas concluídas ou em showcase neste recorte.</p>
          ) : (
            <ul className="space-y-2">
              {dados.entregas.map((i) => (
                <IniciativaAudit key={i.id} item={i} mostrarComplexidade={false} />
              ))}
            </ul>
          )}
        </Bloco>

        <Bloco destaque={categoria === 'especialistas'} titulo="Especialistas" resumo={
          `${plural(dados.volumeHabilidades, 'habilidade', 'habilidades')} · complexidade ${nf.format(dados.complexidadeTotal)} · score ${nf.format(dados.scoreEspecialista)}`
        }>
          <p className="num text-xs text-g50">Fórmula: habilidades × 10 + complexidade das entregas = {formulaEsp}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {dados.linguagens.length === 0 && dados.automacoes.length === 0 && (
              <span className="text-sm text-g50">Nenhuma habilidade cadastrada no Hub.</span>
            )}
            {dados.linguagens.map((h) => <Chip key={`l-${h}`}>{h}</Chip>)}
            {dados.automacoes.map((h) => <Chip key={`a-${h}`}>{h}</Chip>)}
          </div>
          {dados.entregas.length > 0 && (
            <ul className="mt-3 space-y-2">
              {dados.entregas.map((i) => (
                <IniciativaAudit key={`c-${i.id}`} item={i} mostrarComplexidade />
              ))}
            </ul>
          )}
        </Bloco>

        <Bloco destaque={categoria === 'colaboradores'} titulo="Colaboração" resumo={`índice ${nf.format(dados.colaboracao.indice)} de 100`}>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Ponto rotulo="Presença" valor={dados.colaboracao.presenca} max={40} detalhe={
              dados.colaboracao.convites > 0
                ? `${nf.format(dados.colaboracao.presentes)} de ${nf.format(dados.colaboracao.convites)} encontros`
                : 'Sem convites no período'
            } />
            <Ponto rotulo="Disponível" valor={dados.colaboracao.disponibilidade} max={20} detalhe={
              dados.colaboracao.available ? 'Marcado no Hub' : 'Não disponível'
            } />
            <Ponto rotulo="Ativas" valor={dados.colaboracao.ativas} max={20} detalhe={
              plural(dados.colaboracao.iniciativasAtivas, 'iniciativa', 'iniciativas')
            } />
            <Ponto rotulo="Perfil" valor={dados.colaboracao.perfil} max={20} detalhe={
              [
                dados.volumeHabilidades > 0 ? plural(dados.volumeHabilidades, 'habilidade', 'habilidades') : null,
                dados.colaboracao.temBio ? 'bio' : null,
                dados.colaboracao.temContato ? 'contato' : null,
              ].filter(Boolean).join(' · ') || 'Perfil incompleto'
            } />
          </dl>
          {dados.ativas.length > 0 && (
            <ul className="mt-3 space-y-2">
              {dados.ativas.map((i) => (
                <IniciativaAudit key={`at-${i.id}`} item={i} mostrarComplexidade={false} />
              ))}
            </ul>
          )}
        </Bloco>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g80 hover:bg-g20"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function Bloco({
  titulo, resumo, destaque, children,
}: {
  titulo: string;
  resumo: string;
  destaque: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={clsx('mt-5 rounded-s border p-3', destaque ? 'border-[var(--blue)] bg-g10' : 'border-g30')}>
      <header className="mb-2">
        <h4 className="text-sm font-semibold text-g90">{titulo}</h4>
        <p className="num text-xs text-g50">{resumo}</p>
      </header>
      {children}
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-s bg-g20 px-2 py-0.5 text-xs font-medium text-g80">{children}</span>
  );
}

function Ponto({
  rotulo, valor, max, detalhe,
}: {
  rotulo: string;
  valor: number;
  max: number;
  detalhe: string;
}) {
  return (
    <div className="rounded-s bg-g10 p-2">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-g50">{rotulo}</dt>
      <dd className="num mt-0.5 text-lg font-semibold text-[var(--ink-strong)]">
        {nf.format(valor)}<span className="text-xs font-medium text-g50">/{nf.format(max)}</span>
      </dd>
      <p className="mt-0.5 text-[0.7rem] leading-tight text-g50">{detalhe}</p>
    </div>
  );
}

function IniciativaAudit({
  item, mostrarComplexidade,
}: {
  item: AuditoriaIniciativa;
  mostrarComplexidade: boolean;
}) {
  const flags = [
    item.uses_ai_generativa ? 'IA generativa' : item.uses_ai ? 'IA' : null,
    item.uses_n8n ? 'n8n' : null,
    ...item.tool_tags,
  ].filter((x): x is string => Boolean(x));
  return (
    <li className="rounded-s border border-g20 p-2">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/projetos/${item.id}`}
          className="min-w-0 truncate text-sm font-medium text-[var(--blue)] hover:underline"
        >
          {item.title}
        </Link>
        {mostrarComplexidade && (
          <span className="num shrink-0 text-xs font-semibold text-g80">
            +{nf.format(item.complexidade.total)}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[0.7rem] text-g50">
        {STAGE_LABEL[item.stage]}
        {item.data ? ` · ${diaCurto(item.data)}` : ''}
        {item.hours_saved_month ? ` · ${nf1.format(item.hours_saved_month)} h/mês` : ''}
        {item.dev_hours ? ` · ${nf1.format(item.dev_hours)} h dev` : ''}
        {item.score_final != null ? ` · score ${nf1.format(item.score_final)}` : ''}
      </p>
      {flags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {flags.map((f) => <Chip key={f}>{f}</Chip>)}
        </div>
      )}
    </li>
  );
}
