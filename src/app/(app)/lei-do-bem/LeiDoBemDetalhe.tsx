'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import {
  LDB_GRUPO1, LDB_GRUPO2, LDB_TRIAGEM,
  LDB_RESPOSTA_LABEL, LDB_STATUSES, LDB_STATUS_LABEL,
  LDB_PRIORIDADES, LDB_PRIORIDADE_LABEL,
  type LdbAvaliacaoRow, type LdbHistoricoRow, type TriagemResultado,
} from '@/lib/leiDoBem';
import { rotuloPessoa, type PessoaOpcao } from '@/lib/pessoas';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';
import { BadgeClassificacao, BadgeStatus, BadgePrioridade } from '@/components/leidobem/Badges';
import { TriagemResultadoCard } from '@/components/leidobem/TriagemResultadoCard';
import { dataHora, dataCurta } from '@/lib/format';
import { atualizarAuditoria, type EstadoAuditoria } from './actions';

function SalvarAuditoria() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando…' : 'Salvar auditoria'}
    </Button>
  );
}

function CampoLeitura({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div>
      <dt className="label">{rotulo}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-g80">
        {valor?.trim() || <span className="text-g50">Não preenchido</span>}
      </dd>
    </div>
  );
}

/**
 * Painel de detalhe/gestão da avaliação (§7.4). Drawer lateral: cadastro e
 * triagem em somente leitura (a triagem só é reeditada no cadastro da
 * iniciativa), campos do processo de auditoria editáveis por gerencial+.
 */
export function LeiDoBemDetalhe({
  avaliacao, historico, pessoas, podeAuditar, onFechar,
}: {
  avaliacao: LdbAvaliacaoRow;
  historico: LdbHistoricoRow[];
  pessoas: PessoaOpcao[];
  podeAuditar: boolean;
  onFechar: () => void;
}) {
  const [estado, formAction] = useFormState(
    atualizarAuditoria.bind(null, avaliacao.id),
    {} as EstadoAuditoria,
  );
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar();
    }
    document.addEventListener('keydown', aoTeclar);
    painelRef.current?.focus();
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [onFechar]);

  const resultado: TriagemResultado = {
    classificacao: avaliacao.triagem_classificacao ?? 'pendente',
    indice: avaliacao.triagem_indice_aderencia == null
      ? null
      : Number(avaliacao.triagem_indice_aderencia),
    sintese: avaliacao.triagem_sintese ?? 'Preencha todas as respostas para gerar a síntese.',
    proximaAcao: avaliacao.triagem_proxima_acao ?? 'Responder os itens restantes.',
  };

  return (
    <div className="fixed inset-0 z-30" role="dialog" aria-modal="true"
         aria-label={`Detalhe da avaliação: ${avaliacao.title}`}>
      <button
        type="button"
        aria-label="Fechar painel"
        onClick={onFechar}
        className="absolute inset-0 h-full w-full cursor-default bg-[rgba(15,36,103,.35)]"
      />
      <div
        ref={painelRef}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col overflow-y-auto bg-g10 shadow-3 outline-none"
      >
        {/* Cabeçalho */}
        <header className="sticky top-0 z-10 border-b border-g30 bg-[var(--topbar-bg)] px-6 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">
                Avaliação Lei do Bem
              </p>
              <h2 className="mt-1 truncate text-lg font-bold tracking-tight">{avaliacao.title}</h2>
              <p className="mt-1 text-xs text-g50">
                {avaliacao.area_name ?? 'Área não informada'}
                {avaliacao.directorate && ` · ${avaliacao.directorate}`}
                {` · ${avaliacao.owner_name ?? 'Sem proprietário'}`}
                {` · cadastrada em ${dataCurta(avaliacao.project_created_at)}`}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <BadgeStatus status={avaliacao.status} />
                <BadgeClassificacao classificacao={avaliacao.triagem_classificacao} />
                <BadgePrioridade prioridade={avaliacao.prioridade} />
              </div>
            </div>
            <button
              type="button"
              onClick={onFechar}
              className="shrink-0 rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g60 hover:bg-g20"
            >
              ✕ Fechar
            </button>
          </div>
        </header>

        <div className="space-y-6 p-6">
          {/* Gestão da auditoria */}
          <section className="card space-y-4 p-5">
            <h3 className="text-sm font-semibold">Gestão da auditoria</h3>
            {!podeAuditar && (
              <p className="text-xs leading-snug text-g50">
                Somente papéis gerenciais (auditoria/PD&I) editam estes campos. Você acompanha em
                modo leitura.
              </p>
            )}
            {estado.erro && <ErroBox mensagem={estado.erro} />}
            {estado.ok && (
              <p role="status" className="rounded-s bg-[var(--sig-ok-bg)] px-3 py-2 text-sm text-[var(--sig-ok)]">
                Auditoria salva.
              </p>
            )}
            <form action={formAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="ldb-status">Status do processo</label>
                  <select id="ldb-status" name="status" className="field mt-1"
                          defaultValue={avaliacao.status} disabled={!podeAuditar}
                          key={`status-${avaliacao.status}`}>
                    {LDB_STATUSES.map((s) => (
                      <option key={s} value={s}>{LDB_STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="ldb-resp">Responsável da auditoria</label>
                  <select id="ldb-resp" name="responsavel_auditoria_id" className="field mt-1"
                          defaultValue={avaliacao.responsavel_auditoria_id ?? ''}
                          disabled={!podeAuditar}
                          key={`resp-${avaliacao.responsavel_auditoria_id ?? ''}`}>
                    <option value="">Não atribuído</option>
                    {pessoas.map((p) => (
                      <option key={p.id} value={p.id}>{rotuloPessoa(p)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="ldb-prio">Prioridade</label>
                  <select id="ldb-prio" name="prioridade" className="field mt-1"
                          defaultValue={avaliacao.prioridade ?? ''} disabled={!podeAuditar}
                          key={`prio-${avaliacao.prioridade ?? ''}`}>
                    <option value="">Não definida</option>
                    {LDB_PRIORIDADES.map((p) => (
                      <option key={p} value={p}>{LDB_PRIORIDADE_LABEL[p]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm text-g80">
                    <input type="checkbox" name="enviar_clickup"
                           defaultChecked={avaliacao.enviar_clickup} disabled={!podeAuditar}
                           key={`cu-${String(avaliacao.enviar_clickup)}`} />
                    Enviar para o ClickUp
                  </label>
                </div>
              </div>
              <p className="text-xs leading-snug text-g50">
                O envio real ao ClickUp ainda não está automatizado — o flag deixa a iniciativa
                marcada como pronta para envio ({avaliacao.clickup_sincronizado_em
                  ? `sincronizada em ${dataHora(avaliacao.clickup_sincronizado_em)}`
                  : 'ainda não sincronizada'}).
              </p>
              <div>
                <label className="label" htmlFor="ldb-parecer">Parecer da auditoria</label>
                <textarea id="ldb-parecer" name="parecer" rows={4} className="field mt-1"
                          defaultValue={avaliacao.parecer ?? ''} disabled={!podeAuditar}
                          key={`parecer-${avaliacao.updated_at}`}
                          placeholder="Laudo/opinião técnica: fundamentos do enquadramento ou do não enquadramento." />
              </div>
              {podeAuditar && <SalvarAuditoria />}
            </form>
          </section>

          {/* Resultado da triagem — somente leitura */}
          <section className="card space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Triagem preliminar</h3>
              <span className="num text-xs text-g50">
                {avaliacao.triagem_atualizada_em
                  ? `respondida em ${dataHora(avaliacao.triagem_atualizada_em)}`
                  : 'ainda não respondida'}
              </span>
            </div>
            <TriagemResultadoCard resultado={resultado} compacto />
            <p className="text-xs leading-snug text-g50">
              As respostas são editadas no cadastro da iniciativa (Iniciativas → Atualizar), não
              neste painel.{' '}
              <Link href={`/projetos/${avaliacao.project_id}`} className="font-medium text-[var(--blue)] hover:underline">
                Abrir cadastro ›
              </Link>
            </p>
            <ol className="space-y-2">
              {LDB_TRIAGEM.map((t, i) => {
                const resposta = avaliacao[t.campo];
                return (
                  <li key={t.campo} className="flex items-start justify-between gap-3 border-b border-g20 pb-2 text-sm">
                    <span className="text-g80">
                      <span className="num text-g50">{i + 1}.</span> {t.pergunta}
                    </span>
                    <span className={
                      resposta == null
                        ? 'shrink-0 text-xs text-g50'
                        : 'num shrink-0 rounded-s bg-g20 px-2 py-0.5 text-xs font-medium text-g80'
                    }>
                      {resposta == null ? '—' : LDB_RESPOSTA_LABEL[resposta]}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Grupo 1 — Cadastro do projeto */}
          <section className="card space-y-4 p-5">
            <h3 className="text-sm font-semibold">Cadastro do projeto</h3>
            <dl className="space-y-3">
              {LDB_GRUPO1.map((c) => (
                <CampoLeitura key={c.campo} rotulo={c.label} valor={avaliacao[c.campo]} />
              ))}
            </dl>
          </section>

          {/* Grupo 2 — Avaliação técnica */}
          <section className="card space-y-4 p-5">
            <h3 className="text-sm font-semibold">Avaliação técnica (Lei do Bem / MCTI)</h3>
            <dl className="space-y-3">
              {LDB_GRUPO2.map((c) => (
                <CampoLeitura key={c.campo} rotulo={c.label} valor={avaliacao[c.campo]} />
              ))}
            </dl>
          </section>

          {/* Histórico de status */}
          <section className="card space-y-3 p-5">
            <h3 className="text-sm font-semibold">Histórico do status</h3>
            {historico.length === 0 ? (
              <p className="text-sm text-g50">Nenhuma transição registrada.</p>
            ) : (
              <ol className="space-y-2">
                {historico.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-g80">
                    {h.status_anterior ? (
                      <>
                        <BadgeStatus status={h.status_anterior} />
                        <span aria-hidden className="text-g40">→</span>
                        <BadgeStatus status={h.status_novo} />
                      </>
                    ) : (
                      <>
                        <BadgeStatus status={h.status_novo} />
                        <span className="text-xs text-g50">(entrada na fila)</span>
                      </>
                    )}
                    <span className="num text-xs text-g50">
                      {dataHora(h.criado_em)}
                      {h.alterado_por_nome && ` · ${h.alterado_por_nome}`}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
