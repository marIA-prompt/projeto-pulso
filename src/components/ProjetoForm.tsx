'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { STAGE_LABEL, STAGES } from '@/lib/types';
import { rotuloPessoa, type PessoaOpcao } from '@/lib/pessoas';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';
import { clsx } from '@/lib/clsx';
import type { EstadoProjeto } from '@/app/(app)/projetos/actions';
import {
  AVISO_TRIAGEM,
  COMO_INTERPRETAR,
  GRUPO1_CAMPOS,
  GRUPO2_CAMPOS,
  LEI_DO_BEM_CLASSIFICACAO_LABEL,
  LEI_DO_BEM_CLASSIFICACAO_TOM,
  LEI_DO_BEM_RESPOSTA_LABEL,
  LEI_DO_BEM_RESPOSTAS,
  REFERENCIAS_METODOLOGICAS,
  TRIAGEM_ITENS,
  classeBadgeTom,
  classificarTriagem,
  type LeiDoBemResposta,
  type TriagemCampo,
} from '@/lib/lei-do-bem';

type Area = { id: string; name: string };
type Valores = Partial<Record<string, string | number | boolean | null>>;

type EtapaId = 'dados' | 'optin' | 'cadastro' | 'tecnica' | 'triagem' | 'revisao';

const ETAPAS_TODAS: { id: EtapaId; rotulo: string }[] = [
  { id: 'dados', rotulo: 'Dados da iniciativa' },
  { id: 'optin', rotulo: 'Lei do Bem' },
  { id: 'cadastro', rotulo: 'Cadastro do projeto' },
  { id: 'tecnica', rotulo: 'Avaliação técnica' },
  { id: 'triagem', rotulo: 'Triagem preliminar' },
  { id: 'revisao', rotulo: 'Revisão e salvar' },
];

function etapasVisiveis(opta: 'sim' | 'nao' | ''): { id: EtapaId; rotulo: string }[] {
  return ETAPAS_TODAS.filter((e) => {
    if (e.id === 'dados' || e.id === 'optin') return true;
    if (e.id === 'revisao') return opta === 'sim' || opta === 'nao';
    return opta === 'sim';
  });
}

function Salvar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" formNoValidate disabled={pending}>
      {pending ? 'Salvando…' : rotulo}
    </Button>
  );
}

function vStr(valores: Valores, k: string): string {
  const v = valores[k];
  return v == null ? '' : String(v);
}

export function ProjetoForm({
  action, areas, pessoas = [], valores = {}, rotulo = 'Salvar iniciativa',
  cancelHref = '/projetos', ownerPadrao, leiDoBem = null,
}: {
  action: (prev: EstadoProjeto, form: FormData) => Promise<EstadoProjeto>;
  areas: Area[];
  pessoas?: PessoaOpcao[];
  valores?: Valores;
  rotulo?: string;
  cancelHref?: string;
  ownerPadrao?: string;
  leiDoBem?: Valores | null;
}) {
  const [estado, formAction] = useFormState(action, {} as EstadoProjeto);
  const jaOptou = !!leiDoBem;
  const [opta, setOpta] = useState<'sim' | 'nao' | ''>(jaOptou ? 'sim' : '');
  const [etapa, setEtapa] = useState<EtapaId>('dados');
  const [ajudaAberta, setAjudaAberta] = useState(false);

  const [ldb, setLdb] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const c of [...GRUPO1_CAMPOS, ...GRUPO2_CAMPOS]) {
      init[c.name] = vStr(leiDoBem ?? {}, c.name);
    }
    for (const item of TRIAGEM_ITENS) {
      init[item.campo] = vStr(leiDoBem ?? {}, item.campo);
    }
    return init;
  });

  const etapas = useMemo(() => etapasVisiveis(opta), [opta]);

  const triagem = useMemo(() => {
    const r: Partial<Record<TriagemCampo, LeiDoBemResposta>> = {};
    for (const item of TRIAGEM_ITENS) {
      const v = ldb[item.campo];
      if (v === 'sim' || v === 'parcialmente' || v === 'nao' || v === 'nao_sei') r[item.campo] = v;
    }
    return classificarTriagem(r);
  }, [ldb]);

  const idx = etapas.findIndex((e) => e.id === etapa);
  const atual = etapas[idx] ?? etapas[0];
  const ehUltima = atual.id === 'revisao';

  function irPara(id: EtapaId) {
    if (etapas.some((e) => e.id === id)) setEtapa(id);
  }

  function escolherOpta(v: 'sim' | 'nao') {
    setOpta(v);
  }

  function proximo() {
    if (etapa === 'optin' && !opta) return;
    const lista = etapasVisiveis(opta);
    const i = lista.findIndex((e) => e.id === etapa);
    const next = lista[Math.min(lista.length - 1, i + 1)];
    if (next) setEtapa(next.id);
  }

  function voltar() {
    const i = etapas.findIndex((e) => e.id === etapa);
    const prev = etapas[Math.max(0, i - 1)];
    if (prev) setEtapa(prev.id);
  }

  function setCampo(name: string, value: string) {
    setLdb((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => { if (!ehUltima) e.preventDefault(); }}
      className="space-y-6"
    >
      {estado.erro && <ErroBox mensagem={estado.erro} />}

      <ol className="flex flex-wrap gap-2" aria-label="Etapas do cadastro">
        {etapas.map((e, i) => {
          const ativa = e.id === etapa;
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => irPara(e.id)}
                aria-current={ativa ? 'step' : undefined}
                className={clsx(
                  'rounded-s px-3 py-1.5 text-xs font-medium transition-colors',
                  ativa
                    ? 'bg-[var(--navy)] text-white'
                    : 'border border-g40 text-g60 hover:bg-g20',
                )}
              >
                <span className="num mr-1">{i + 1}.</span>
                {e.rotulo}
              </button>
            </li>
          );
        })}
      </ol>

      <section className={clsx('card space-y-4 p-6', etapa !== 'dados' && 'hidden')}>
        <h2 className="text-base font-semibold">A iniciativa</h2>

        <div>
          <label className="label" htmlFor="title">Título</label>
          <input id="title" name="title" required minLength={3} className="field mt-1"
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

      <section className={clsx('card space-y-4 p-6', etapa !== 'optin' && 'hidden')}>
        <h2 className="text-base font-semibold">Esta iniciativa pode se enquadrar na Lei do Bem?</h2>
        <p className="text-sm leading-relaxed text-g60">
          A Lei do Bem (11.196/2005) permite deduzir investimentos em pesquisa, desenvolvimento
          e inovação. Se esta iniciativa pode envolver PD&amp;I — algo novo, incerto e sistemático,
          não só implantação de ferramenta pronta — marque sim. A equipe de PD&amp;I usa a triagem
          para decidir se vale virar projeto formal reportado ao MCTI.
        </p>
        <p className="text-xs leading-relaxed text-g50">{AVISO_TRIAGEM}</p>
        <input type="hidden" name="opta_lei_do_bem" value={opta} />
        <fieldset className="flex flex-wrap gap-3">
          <legend className="sr-only">Pode se enquadrar na Lei do Bem?</legend>
          {(['sim', 'nao'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => escolherOpta(v)}
              aria-pressed={opta === v}
              className={clsx(
                'rounded-s px-4 py-2 text-sm font-medium',
                opta === v
                  ? 'bg-[var(--navy)] text-white'
                  : 'border border-g40 text-g80 hover:bg-g20',
              )}
            >
              {v === 'sim' ? 'Sim, seguir para a triagem' : 'Não, só cadastrar a iniciativa'}
            </button>
          ))}
        </fieldset>
        {opta === 'nao' && (
          <p className="text-sm text-g60">
            A iniciativa entra no portfólio normalmente, sem aparecer na aba Lei do Bem.
          </p>
        )}
        {opta === 'sim' && (
          <p className="text-sm text-g60">
            Nas próximas etapas você descreve o projeto, preenche os blocos técnicos do MCTI
            e responde as 12 perguntas da triagem. Nada disso bloqueia o cadastro.
          </p>
        )}
      </section>

      <section className={clsx('card space-y-4 p-6', etapa !== 'cadastro' && 'hidden')}>
        <div>
          <h2 className="text-base font-semibold">Cadastro do projeto</h2>
          <p className="mt-1 text-sm leading-relaxed text-g60">
            Nome, responsável e data já vêm da iniciativa — não pedimos de novo.
            Estes campos alimentam a pré-análise da equipe de PD&amp;I.
          </p>
        </div>
        {GRUPO1_CAMPOS.map((c) => (
          <div key={c.name}>
            <label className="label" htmlFor={c.name}>{c.label}</label>
            <textarea
              id={c.name} name={c.name} rows={c.rows} className="field mt-1"
              value={ldb[c.name] ?? ''}
              onChange={(e) => setCampo(c.name, e.target.value)}
              aria-describedby={`ajuda_${c.name}`}
            />
            <p id={`ajuda_${c.name}`} className="mt-1 text-xs leading-snug text-g50">{c.ajuda}</p>
          </div>
        ))}
      </section>

      <section className={clsx('card space-y-4 p-6', etapa !== 'tecnica' && 'hidden')}>
        <div>
          <h2 className="text-base font-semibold">Avaliação técnica (MCTI)</h2>
          <p className="mt-1 text-sm leading-relaxed text-g60">
            Cinco blocos equivalentes aos critérios de PD&amp;I do Manual de Frascati:
            inovadora, criativa, incerta, sistemática e transferível/reprodutível.
          </p>
        </div>
        {GRUPO2_CAMPOS.map((c) => (
          <div key={c.name}>
            <label className="label" htmlFor={c.name}>{c.label}</label>
            <textarea
              id={c.name} name={c.name} rows={c.rows} className="field mt-1"
              value={ldb[c.name] ?? ''}
              onChange={(e) => setCampo(c.name, e.target.value)}
              aria-describedby={`ajuda_${c.name}`}
            />
            <p id={`ajuda_${c.name}`} className="mt-1 text-xs leading-snug text-g50">{c.ajuda}</p>
          </div>
        ))}
      </section>

      <section className={clsx('card space-y-4 p-6', etapa !== 'triagem' && 'hidden')}>
        <div>
          <h2 className="text-base font-semibold">Triagem preliminar</h2>
          <p className="mt-1 text-sm leading-relaxed text-g60">
            Questionário validado pela auditoria. Cada item tem quatro opções, sem valor pré-selecionado.
            A classificação aparece ao final desta etapa — é sinalização, nunca bloqueio.
          </p>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-[var(--blue)] hover:underline"
            onClick={() => setAjudaAberta((v) => !v)}
            aria-expanded={ajudaAberta}
          >
            {ajudaAberta ? 'Fechar “Como interpretar”' : 'Como interpretar'}
          </button>
          {ajudaAberta && (
            <div className="mt-3 space-y-3 rounded-s bg-g10 p-4 text-sm text-g70">
              <p className="text-xs leading-relaxed text-g50">{AVISO_TRIAGEM}</p>
              <ul className="space-y-2">
                {COMO_INTERPRETAR.map((c) => (
                  <li key={c.classe}>
                    <span className={clsx('mr-2 inline-block rounded-s px-2 py-0.5 text-xs font-semibold', classeBadgeTom(LEI_DO_BEM_CLASSIFICACAO_TOM[c.classe]))}>
                      {LEI_DO_BEM_CLASSIFICACAO_LABEL[c.classe]}
                    </span>
                    {c.texto}
                  </li>
                ))}
              </ul>
              <p className="text-xs font-medium text-g60">Referências metodológicas</p>
              <ul className="space-y-1 text-xs">
                {REFERENCIAS_METODOLOGICAS.map((r) => (
                  <li key={r.href}>
                    <a href={r.href} target="_blank" rel="noreferrer" className="text-[var(--blue)] hover:underline">
                      {r.rotulo}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <ol className="space-y-4">
          {TRIAGEM_ITENS.map((item) => (
            <li key={item.campo}>
              <label className="label" htmlFor={item.campo}>
                <span className="num text-g50">{item.n}.</span>{' '}
                {item.pergunta}
                {item.bloqueioDuro && (
                  <span className="ml-2 text-[0.65rem] font-normal uppercase tracking-wide text-g50">
                    bloqueio duro se Não
                  </span>
                )}
              </label>
              <select
                id={item.campo}
                name={item.campo}
                className="field mt-1"
                value={ldb[item.campo] ?? ''}
                onChange={(e) => setCampo(item.campo, e.target.value)}
              >
                <option value="">Selecione…</option>
                {LEI_DO_BEM_RESPOSTAS.map((r) => (
                  <option key={r} value={r}>{LEI_DO_BEM_RESPOSTA_LABEL[r]}</option>
                ))}
              </select>
            </li>
          ))}
        </ol>

        <ResultadoTriagemBox resultado={triagem} />
      </section>

      <section className={clsx('card space-y-4 p-6', etapa !== 'revisao' && 'hidden')}>
        <h2 className="text-base font-semibold">Revisão</h2>
        <p className="text-sm leading-relaxed text-g60">
          Confira o recorte abaixo. Você pode voltar a qualquer etapa antes de salvar.
          {opta === 'sim'
            ? ' A classificação da triagem não impede o cadastro — a iniciativa entra na aba Lei do Bem para revisão humana.'
            : ' Sem triagem Lei do Bem: a iniciativa vai só para o portfólio geral.'}
        </p>
        {opta === 'sim' && <ResultadoTriagemBox resultado={triagem} />}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        {idx > 0 && (
          <Button type="button" variant="ghost" onClick={voltar}>Voltar</Button>
        )}
        {!ehUltima ? (
          <Button
            type="button"
            onClick={proximo}
            disabled={etapa === 'optin' && !opta}
          >
            Continuar
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
      </div>
    </form>
  );
}

function ResultadoTriagemBox({
  resultado,
}: {
  resultado: ReturnType<typeof classificarTriagem>;
}) {
  const tom = LEI_DO_BEM_CLASSIFICACAO_TOM[resultado.classificacao];
  return (
    <div aria-live="polite" className="space-y-2 rounded-s bg-g10 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={clsx('rounded-s px-2 py-0.5 text-xs font-semibold', classeBadgeTom(tom))}>
          {LEI_DO_BEM_CLASSIFICACAO_LABEL[resultado.classificacao]}
        </span>
        <span className="num text-sm text-g70">
          Índice de aderência:{' '}
          {resultado.indice == null ? '—' : `${Math.round(resultado.indice * 100)}%`}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-g70">{resultado.sintese}</p>
      <p className="text-xs font-medium text-g60">Próxima ação: {resultado.proximaAcao}</p>
      <p className="text-xs text-g50">{AVISO_TRIAGEM}</p>
    </div>
  );
}
