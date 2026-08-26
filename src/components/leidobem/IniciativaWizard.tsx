'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { STAGE_LABEL, STAGES } from '@/lib/types';
import { rotuloPessoa, type PessoaOpcao } from '@/lib/pessoas';
import {
  LDB_GRUPO1, LDB_GRUPO2, LDB_TRIAGEM, LDB_RESPOSTAS, LDB_RESPOSTA_LABEL,
  classificarTriagem, type LdbResposta, type LdbTriagemCampo,
} from '@/lib/leiDoBem';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';
import { TriagemResultadoCard } from './TriagemResultadoCard';
import { clsx } from '@/lib/clsx';
import type { EstadoProjeto } from '@/app/(app)/projetos/actions';

type Area = { id: string; name: string };
type Valores = Partial<Record<string, string | number | boolean | null>>;

type EtapaId = 'dados' | 'optin' | 'grupo1' | 'grupo2' | 'triagem' | 'revisao';

const ETAPA_TITULO: Record<EtapaId, string> = {
  dados: 'Dados da iniciativa',
  optin: 'Lei do Bem',
  grupo1: 'Cadastro do projeto',
  grupo2: 'Avaliação técnica (MCTI)',
  triagem: 'Triagem preliminar',
  revisao: 'Revisão e salvar',
};

type Resumo = {
  title: string;
  stage: string;
  area: string;
  grupo1Preenchidos: number;
  grupo2Preenchidos: number;
};

function Salvar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : rotulo}</Button>;
}

/**
 * Cadastro de iniciativa em etapas (§6.1). Todas as etapas ficam montadas no
 * mesmo <form> — as inativas recebem `hidden`, então os valores continuam no
 * FormData do submit final. A Matriz de Priorização (4 eixos) saiu do fluxo.
 */
export function IniciativaWizard({
  action, areas, pessoas = [], valores = {}, avaliacao = null,
  rotulo = 'Salvar iniciativa', cancelHref = '/projetos', ownerPadrao,
}: {
  action: (prev: EstadoProjeto, form: FormData) => Promise<EstadoProjeto>;
  areas: Area[];
  pessoas?: PessoaOpcao[];
  valores?: Valores;
  /** Avaliação Lei do Bem existente (edição) — null em cadastro novo. */
  avaliacao?: Valores | null;
  rotulo?: string;
  cancelHref?: string;
  ownerPadrao?: string;
}) {
  const [estado, formAction] = useFormState(action, {} as EstadoProjeto);
  const formRef = useRef<HTMLFormElement>(null);

  const [optin, setOptin] = useState(!!avaliacao);
  const [etapa, setEtapa] = useState<EtapaId>('dados');
  const [erroEtapa, setErroEtapa] = useState<string | null>(null);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [respostas, setRespostas] = useState<Partial<Record<LdbTriagemCampo, LdbResposta | null>>>(
    () => Object.fromEntries(
      LDB_TRIAGEM.map((t) => [t.campo, (avaliacao?.[t.campo] as LdbResposta) ?? null]),
    ),
  );

  const visiveis: EtapaId[] = optin
    ? ['dados', 'optin', 'grupo1', 'grupo2', 'triagem', 'revisao']
    : ['dados', 'optin', 'revisao'];
  const idx = visiveis.indexOf(etapa);
  const resultado = classificarTriagem(respostas);

  function snapshotResumo(): Resumo {
    const form = formRef.current;
    const v = (name: string) =>
      ((form?.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null)?.value ?? '').trim();
    const areaId = v('area_id');
    const contar = (campos: readonly { campo: string }[]) =>
      campos.filter((c) => v(c.campo).length > 0).length;
    return {
      title: v('title'),
      stage: STAGE_LABEL[v('stage') as keyof typeof STAGE_LABEL] ?? v('stage'),
      area: areas.find((a) => a.id === areaId)?.name ?? 'Não informada',
      grupo1Preenchidos: contar(LDB_GRUPO1),
      grupo2Preenchidos: contar(LDB_GRUPO2),
    };
  }

  function irPara(destino: EtapaId) {
    if (destino === 'revisao') setResumo(snapshotResumo());
    setErroEtapa(null);
    setEtapa(destino);
    formRef.current?.scrollIntoView({ block: 'start' });
  }

  function avancar() {
    if (etapa === 'dados') {
      const form = formRef.current;
      const titulo = (form?.elements.namedItem('title') as HTMLInputElement | null)?.value?.trim() ?? '';
      if (titulo.length < 3) {
        setErroEtapa('O título precisa de pelo menos 3 caracteres.');
        return;
      }
    }
    irPara(visiveis[Math.min(idx + 1, visiveis.length - 1)]);
  }

  function voltar() {
    irPara(visiveis[Math.max(idx - 1, 0)]);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6"
      onKeyDown={(e) => {
        // Enter em input de texto não deve submeter o wizard antes da revisão.
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT' && etapa !== 'revisao') {
          e.preventDefault();
        }
      }}
    >
      {/* Stepper */}
      <ol aria-label="Etapas do cadastro" className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {visiveis.map((id, i) => {
          const atual = id === etapa;
          const feita = i < idx;
          return (
            <li key={id} className="flex items-center gap-2">
              <span
                aria-hidden
                className={clsx(
                  'num flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                  atual && 'bg-[var(--blue)] text-white',
                  feita && 'bg-[var(--sig-ok-bg)] text-[var(--sig-ok)]',
                  !atual && !feita && 'bg-g20 text-g50',
                )}
              >
                {feita ? '✓' : i + 1}
              </span>
              <span className={clsx('text-xs font-medium', atual ? 'text-g90' : 'text-g50')}>
                {ETAPA_TITULO[id]}
                {atual && <span className="sr-only"> (etapa atual)</span>}
              </span>
              {i < visiveis.length - 1 && <span aria-hidden className="text-g40">›</span>}
            </li>
          );
        })}
      </ol>

      {estado.erro && <ErroBox mensagem={estado.erro} />}
      {erroEtapa && <ErroBox mensagem={erroEtapa} />}

      {/* ============================= Etapa 1 — Dados da iniciativa ======== */}
      <section hidden={etapa !== 'dados'} className="card space-y-4 p-6">
        <h2 className="text-base font-semibold">A iniciativa</h2>

        <div>
          <label className="label" htmlFor="title">Título</label>
          <input id="title" name="title" minLength={3} className="field mt-1"
                 defaultValue={(valores.title as string) ?? ''} />
        </div>

        <div>
          <label className="label" htmlFor="description">O que ela resolve</label>
          <textarea id="description" name="description" rows={4} className="field mt-1"
                    defaultValue={(valores.description as string) ?? ''}
                    placeholder="Que processo hoje consome tempo, e o que muda depois dela." />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="stage">Estágio no pipeline</label>
            <select id="stage" name="stage" className="field mt-1"
                    defaultValue={(valores.stage as string) ?? 'ideia'}>
              {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="area_id">Área</label>
            <select id="area_id" name="area_id" className="field mt-1"
                    defaultValue={(valores.area_id as string) ?? ''}>
              <option value="">Não informada</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="owner_id">Criado / proprietário</label>
            <select id="owner_id" name="owner_id" className="field mt-1"
                    defaultValue={(valores.owner_id as string) || ownerPadrao || ''}>
              <option value="">Não informado</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>{rotuloPessoa(p)}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-g50">
              Quem responde por esta iniciativa. Pode ser você ou outra pessoa do Pulso.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="theme">Tema</label>
            <input id="theme" name="theme" className="field mt-1" list="temas"
                   defaultValue={(valores.theme as string) ?? ''} />
            <datalist id="temas">
              <option value="Dados, BI e Relatórios" />
              <option value="Eficiência Corporativa" />
              <option value="Eficiência Operacional" />
              <option value="Experiência do Cliente e Atendimento" />
              <option value="Receita, Comercial e Marketing" />
              <option value="Risco, Compliance e Regulação" />
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="directorate">Diretoria</label>
            <input id="directorate" name="directorate" className="field mt-1"
                   defaultValue={(valores.directorate as string) ?? ''} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="hours_saved_month">Horas economizadas por mês</label>
            <input id="hours_saved_month" name="hours_saved_month" type="number" min={0} step="0.5"
                   className="field mt-1" defaultValue={(valores.hours_saved_month as number) ?? ''} />
          </div>
          <div>
            <label className="label" htmlFor="target_date">Data alvo</label>
            <input id="target_date" name="target_date" type="date" className="field mt-1"
                   defaultValue={(valores.target_date as string) ?? ''} />
          </div>
        </div>

        <fieldset className="flex flex-wrap gap-6">
          <legend className="label mb-2">Ferramentas</legend>
          <label className="flex items-center gap-2 text-sm text-g80">
            <input type="checkbox" name="uses_ai" defaultChecked={!!valores.uses_ai} /> Usa IA
          </label>
          <label className="flex items-center gap-2 text-sm text-g80">
            <input type="checkbox" name="uses_n8n" defaultChecked={!!valores.uses_n8n} /> Usa n8n
          </label>
        </fieldset>

        <div>
          <label className="label" htmlFor="links">Links</label>
          <input id="links" name="links" className="field mt-1"
                 defaultValue={(valores.links as string) ?? ''}
                 placeholder="Repositório, fluxo no n8n, painel…" />
        </div>

        <div>
          <label className="label" htmlFor="notes">Observações</label>
          <textarea id="notes" name="notes" rows={3} className="field mt-1"
                    defaultValue={(valores.notes as string) ?? ''} />
        </div>
      </section>

      {/* ============================= Etapa 2 — Opt-in Lei do Bem ========== */}
      <section hidden={etapa !== 'optin'} className="card space-y-4 p-6">
        <h2 className="text-base font-semibold">Esta iniciativa pode se enquadrar na Lei do Bem?</h2>
        <p className="text-sm leading-relaxed text-g60">
          A Lei do Bem (11.196/2005) concede incentivos fiscais a projetos de pesquisa,
          desenvolvimento e inovação. Se a iniciativa envolve desafio técnico real — algo que a
          equipe não sabia fazer no início — vale responder o bloco de PD&amp;I: são três etapas
          curtas que alimentam a pré-análise de enquadramento do time de PD&amp;I. Se marcar
          &ldquo;não&rdquo;, o cadastro segue direto para a revisão.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={clsx(
            'flex cursor-pointer items-start gap-3 rounded-m border p-4 transition-colors',
            optin ? 'border-[var(--blue)] bg-[var(--sky-soft)]' : 'border-g30 hover:bg-g20',
          )}>
            <input type="radio" name="ldb_optin" value="sim" className="mt-1"
                   checked={optin} onChange={() => setOptin(true)} />
            <span>
              <span className="block text-sm font-semibold text-g90">Sim, avaliar para a Lei do Bem</span>
              <span className="mt-1 block text-xs leading-snug text-g60">
                Abre as etapas de cadastro do projeto, avaliação técnica (MCTI) e triagem preliminar.
              </span>
            </span>
          </label>
          <label className={clsx(
            'flex cursor-pointer items-start gap-3 rounded-m border p-4 transition-colors',
            !optin ? 'border-[var(--blue)] bg-[var(--sky-soft)]' : 'border-g30 hover:bg-g20',
          )}>
            <input type="radio" name="ldb_optin" value="nao" className="mt-1"
                   checked={!optin} onChange={() => setOptin(false)} />
            <span>
              <span className="block text-sm font-semibold text-g90">Não, seguir sem avaliar</span>
              <span className="mt-1 block text-xs leading-snug text-g60">
                A iniciativa é cadastrada normalmente e pode ser avaliada depois, editando o cadastro.
              </span>
            </span>
          </label>
        </div>
        {avaliacao && !optin && (
          <p className="rounded-s bg-[var(--sig-warn-bg)] px-3 py-2 text-xs text-[var(--sig-warn)]">
            Esta iniciativa já tem uma avaliação Lei do Bem registrada. Marcar &ldquo;não&rdquo;
            apenas pula as etapas nesta edição — a avaliação existente é mantida.
          </p>
        )}
      </section>

      {/* ============================= Etapa 3 — Grupo 1 ==================== */}
      <section hidden={etapa !== 'grupo1'} className="card space-y-4 p-6">
        <div>
          <h2 className="text-base font-semibold">Cadastro do projeto</h2>
          <p className="mt-1 text-sm leading-relaxed text-g60">
            Contexto do projeto para a pré-análise. Nome, responsável e data não são pedidos de
            novo — já vêm da iniciativa. Nenhum campo é obrigatório, mas quanto mais completo,
            melhor a triagem da auditoria.
          </p>
        </div>
        {LDB_GRUPO1.map((c) => (
          <div key={c.campo}>
            <label className="label" htmlFor={c.campo}>{c.label}</label>
            <textarea id={c.campo} name={c.campo} rows={c.rows} className="field mt-1"
                      defaultValue={(avaliacao?.[c.campo] as string) ?? ''}
                      placeholder={c.ajuda} />
          </div>
        ))}
      </section>

      {/* ============================= Etapa 4 — Grupo 2 (MCTI) ============= */}
      <section hidden={etapa !== 'grupo2'} className="card space-y-4 p-6">
        <div>
          <h2 className="text-base font-semibold">Avaliação técnica (Lei do Bem / MCTI)</h2>
          <p className="mt-1 text-sm leading-relaxed text-g60">
            Os cinco blocos do formulário técnico que o MCTI cobra (FormP&amp;D, Guia Prático da
            Lei do Bem §6). Cada um corresponde a um critério de PD&amp;I do Manual de Frascati:
            a atividade precisa ser <strong className="text-g80">inovadora</strong>,{' '}
            <strong className="text-g80">criativa</strong>,{' '}
            <strong className="text-g80">incerta</strong>,{' '}
            <strong className="text-g80">sistemática</strong> e{' '}
            <strong className="text-g80">transferível/reprodutível</strong>.
          </p>
        </div>
        {LDB_GRUPO2.map((c) => (
          <div key={c.campo}>
            <label className="label" htmlFor={c.campo}>
              {c.label}{' '}
              <span className="font-normal text-g50">· critério: {c.criterio}</span>
            </label>
            <textarea id={c.campo} name={c.campo} rows={c.rows} className="field mt-1"
                      defaultValue={(avaliacao?.[c.campo] as string) ?? ''}
                      placeholder={c.ajuda} />
          </div>
        ))}
      </section>

      {/* ============================= Etapa 5 — Grupo 3 (Triagem) ========== */}
      <section hidden={etapa !== 'triagem'} className="card space-y-4 p-6">
        <div>
          <h2 className="text-base font-semibold">Triagem preliminar</h2>
          <p className="mt-1 text-sm leading-relaxed text-g60">
            Questionário do time de PD&amp;I (12 itens). A classificação é calculada
            automaticamente a partir das respostas e aparece ao final — ela sinaliza o potencial
            de enquadramento, mas nunca bloqueia o cadastro.
          </p>
        </div>

        <ol className="space-y-4">
          {LDB_TRIAGEM.map((t, i) => (
            <li key={t.campo}>
              <label className="label flex gap-2" htmlFor={t.campo}>
                <span className="num shrink-0 text-g50">{i + 1}.</span>
                <span>{t.pergunta}</span>
              </label>
              <select
                id={t.campo}
                name={t.campo}
                className="field mt-1 max-w-xs"
                value={respostas[t.campo] ?? ''}
                onChange={(e) => setRespostas((r) => ({
                  ...r,
                  [t.campo]: (e.target.value || null) as LdbResposta | null,
                }))}
              >
                <option value="">Selecione…</option>
                {LDB_RESPOSTAS.map((op) => (
                  <option key={op} value={op}>{LDB_RESPOSTA_LABEL[op]}</option>
                ))}
              </select>
            </li>
          ))}
        </ol>

        <TriagemResultadoCard resultado={resultado} />
      </section>

      {/* ============================= Etapa final — Revisão ================= */}
      <section hidden={etapa !== 'revisao'} className="card space-y-4 p-6">
        <h2 className="text-base font-semibold">Revisão</h2>

        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="label">Título</dt>
            <dd className="mt-0.5 text-g90">{resumo?.title || '—'}</dd>
          </div>
          <div>
            <dt className="label">Estágio</dt>
            <dd className="mt-0.5 text-g90">{resumo?.stage || '—'}</dd>
          </div>
          <div>
            <dt className="label">Área</dt>
            <dd className="mt-0.5 text-g90">{resumo?.area || '—'}</dd>
          </div>
          <div>
            <dt className="label">Lei do Bem</dt>
            <dd className="mt-0.5 text-g90">
              {optin ? 'Sim — com pré-análise de enquadramento' : 'Não avaliada nesta edição'}
            </dd>
          </div>
          {optin && (
            <>
              <div>
                <dt className="label">Cadastro do projeto</dt>
                <dd className="mt-0.5 text-g90">
                  <span className="num">{resumo?.grupo1Preenchidos ?? 0}</span> de{' '}
                  <span className="num">{LDB_GRUPO1.length}</span> campos preenchidos
                </dd>
              </div>
              <div>
                <dt className="label">Avaliação técnica (MCTI)</dt>
                <dd className="mt-0.5 text-g90">
                  <span className="num">{resumo?.grupo2Preenchidos ?? 0}</span> de{' '}
                  <span className="num">{LDB_GRUPO2.length}</span> campos preenchidos
                </dd>
              </div>
            </>
          )}
        </dl>

        {optin && <TriagemResultadoCard resultado={resultado} />}

        <nav aria-label="Voltar a uma etapa" className="flex flex-wrap gap-2 border-t border-g30 pt-4">
          {visiveis.filter((id) => id !== 'revisao').map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => irPara(id)}
              className="rounded-s border border-g40 px-3 py-1.5 text-xs font-medium text-g70 hover:bg-g20"
            >
              ✎ {ETAPA_TITULO[id]}
            </button>
          ))}
        </nav>
      </section>

      {/* ============================= Navegação ============================= */}
      <div className="flex flex-wrap items-center gap-3">
        {idx > 0 && (
          <Button type="button" variant="ghost" onClick={voltar}>‹ Voltar</Button>
        )}
        {etapa !== 'revisao' ? (
          <Button type="button" onClick={avancar}>
            {etapa === 'optin' && !optin ? 'Ir para a revisão ›' : 'Avançar ›'}
          </Button>
        ) : (
          <Salvar rotulo={rotulo} />
        )}
        <Link
          href={cancelHref}
          className="inline-flex items-center rounded-s border border-g40 px-4 py-2 text-sm font-medium text-g80 hover:bg-g20"
        >
          Cancelar
        </Link>
        <span className="num ml-auto text-xs text-g50">
          Etapa {idx + 1} de {visiveis.length}
        </span>
      </div>
    </form>
  );
}
