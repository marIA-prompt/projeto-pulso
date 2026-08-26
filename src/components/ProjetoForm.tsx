'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';
import { STAGE_LABEL, STAGES } from '@/lib/types';
import { rotuloPessoa, type PessoaOpcao } from '@/lib/pessoas';
import {
  CLASSIFICACAO_LABEL,
  LEI_DO_BEM_RESPOSTAS,
  RESPOSTA_LABEL,
  TRIAGEM_PERGUNTAS,
  classeClassificacao,
  classificarTriagem,
  type LeiDoBemResposta,
} from '@/lib/lei-do-bem';
import type { EstadoProjeto } from '@/app/(app)/projetos/actions';

type Area = { id: string; name: string };
type Valores = Partial<Record<string, string | number | boolean | null>>;
type EtapaId = 'dados' | 'decisao' | 'projeto' | 'tecnica' | 'triagem' | 'revisao';

const ETAPA_LABEL: Record<EtapaId, string> = {
  dados: 'Dados da iniciativa',
  decisao: 'Lei do Bem',
  projeto: 'Cadastro do projeto',
  tecnica: 'Avaliação técnica',
  triagem: 'Triagem preliminar',
  revisao: 'Revisão e salvar',
};

const CAMPOS_PROJETO = [
  ['objetivo_estrategico_okr', 'Objetivo estratégico / OKR', 'Relacione a iniciativa ao objetivo, necessidade ou oportunidade que motivou o trabalho.'],
  ['contexto_problema', 'Contexto e problema', 'Explique o cenário atual, o problema e quem é afetado.'],
  ['o_que_sera_desenvolvido', 'O que será desenvolvido ou alterado', 'Delimite o produto, processo, sistema, serviço ou funcionalidade que mudará.'],
  ['resultados_esperados', 'Quais resultados são esperados', 'Descreva resultados observáveis, técnicos e de negócio.'],
  ['como_sera_desenvolvido', 'Como será desenvolvido', 'Resuma etapas, testes, protótipos e validações previstos.'],
  ['fora_do_escopo', 'O que está fora do escopo', 'Separe implantação, rotina, manutenção e outros trabalhos que não fazem parte do desenvolvimento experimental.'],
  ['desafios_riscos', 'Principais desafios e riscos', 'Destaque desafios técnicos ou tecnológicos, não apenas prazo, custo ou gestão.'],
] as const;

const CAMPOS_TECNICOS = [
  ['descricao_projeto', 'Descrição do projeto', 'Apresente o problema tecnológico e o progresso técnico que se pretende alcançar.'],
  ['elemento_tecnologico_novo', 'Elemento tecnologicamente novo ou inovador', 'Explique qual conhecimento, técnica ou aplicação tecnológica supera o que a empresa já domina.'],
  ['barreira_desafio_tecnologico', 'Barreira ou desafio tecnológico superável', 'Registre a incerteza técnica e por que a solução ou o caminho não são conhecidos no início.'],
  ['metodologia_metodos', 'Metodologia e métodos utilizados', 'Descreva o trabalho sistemático: hipóteses, experimentos, testes, registros e critérios de validação.'],
  ['descritivo_complementar', 'Descritivo complementar', 'Inclua parcerias, patentes, trabalhos acadêmicos e outras fontes de financiamento relevantes.'],
] as const;

function Salvar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : rotulo}</Button>;
}

export function ProjetoForm({
  action, areas, pessoas = [], valores = {}, rotulo = 'Salvar iniciativa',
  cancelHref = '/projetos', ownerPadrao,
}: {
  action: (prev: EstadoProjeto, form: FormData) => Promise<EstadoProjeto>;
  areas: Area[];
  pessoas?: PessoaOpcao[];
  valores?: Valores;
  rotulo?: string;
  cancelHref?: string;
  ownerPadrao?: string;
}) {
  const [estado, formAction] = useFormState(action, {} as EstadoProjeto);
  const formRef = useRef<HTMLFormElement>(null);
  const inicialLei = valores.lei_do_bem === true;
  const [leiDoBem, setLeiDoBem] = useState(inicialLei);
  const [etapa, setEtapa] = useState<EtapaId>('dados');
  const [titulo, setTitulo] = useState((valores.title as string) ?? '');
  const [respostas, setRespostas] = useState<Array<LeiDoBemResposta | null>>(
    TRIAGEM_PERGUNTAS.map((pergunta) => (
      (valores[`triagem_${String(pergunta.numero).padStart(2, '0')}`] as LeiDoBemResposta) ?? null
    )),
  );

  const etapas = useMemo<EtapaId[]>(
    () => leiDoBem
      ? ['dados', 'decisao', 'projeto', 'tecnica', 'triagem', 'revisao']
      : ['dados', 'decisao', 'revisao'],
    [leiDoBem],
  );
  const indiceEtapa = etapas.indexOf(etapa);
  const resultado = classificarTriagem(respostas);

  function irPara(proxima: EtapaId) {
    setEtapa(proxima);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function avancar() {
    const secao = formRef.current?.querySelector<HTMLElement>(`[data-step="${etapa}"]`);
    const campos = Array.from(secao?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea',
    ) ?? []);
    const invalido = campos.find((campo) => !campo.reportValidity());
    if (invalido) return;
    irPara(etapas[indiceEtapa + 1]);
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {estado.erro && <ErroBox mensagem={estado.erro} />}

      <nav aria-label="Etapas do cadastro">
        <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {etapas.map((id, i) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => i <= indiceEtapa && irPara(id)}
                disabled={i > indiceEtapa}
                aria-current={id === etapa ? 'step' : undefined}
                className={`h-full w-full rounded-s border px-3 py-2 text-left text-xs ${
                  id === etapa
                    ? 'border-[var(--blue)] bg-[var(--sig-done-bg)] font-semibold text-[var(--blue)]'
                    : i < indiceEtapa
                      ? 'border-g40 bg-g20 text-g80'
                      : 'border-g30 bg-[var(--white)] text-g50'
                }`}
              >
                <span className="num mr-1">{i + 1}.</span> {ETAPA_LABEL[id]}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <section data-step="dados" hidden={etapa !== 'dados'} className="card space-y-4 p-6">
        <div>
          <p className="num text-xs uppercase tracking-wider text-g50">Etapa 1</p>
          <h2 className="mt-1 text-lg font-semibold">Dados da iniciativa</h2>
          <p className="mt-1 text-sm text-g60">Os dados que identificam e contextualizam a iniciativa no portfólio.</p>
        </div>

        <div>
          <label className="label" htmlFor="title">Título</label>
          <input
            id="title" name="title" required minLength={3} className="field mt-1"
            value={titulo} onChange={(e) => setTitulo(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="description">O que ela resolve</label>
          <textarea
            id="description" name="description" rows={4} className="field mt-1"
            defaultValue={(valores.description as string) ?? ''}
            placeholder="Que processo hoje consome tempo, e o que muda depois dela."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="stage">Estágio no pipeline</label>
            <select id="stage" name="stage" className="field mt-1" defaultValue={(valores.stage as string) ?? 'ideia'}>
              {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="area_id">Área</label>
            <select id="area_id" name="area_id" className="field mt-1" defaultValue={(valores.area_id as string) ?? ''}>
              <option value="">Não informada</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="owner_id">Criado / proprietário</label>
            <select id="owner_id" name="owner_id" className="field mt-1" defaultValue={(valores.owner_id as string) || ownerPadrao || ''}>
              <option value="">Não informado</option>
              {pessoas.map((p) => <option key={p.id} value={p.id}>{rotuloPessoa(p)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="theme">Tema</label>
            <input id="theme" name="theme" className="field mt-1" list="temas" defaultValue={(valores.theme as string) ?? ''} />
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
            <input id="directorate" name="directorate" className="field mt-1" defaultValue={(valores.directorate as string) ?? ''} />
          </div>
          <div>
            <label className="label" htmlFor="hours_saved_month">Horas economizadas por mês</label>
            <input id="hours_saved_month" name="hours_saved_month" type="number" min={0} step="0.5" className="field mt-1" defaultValue={(valores.hours_saved_month as number) ?? ''} />
          </div>
          <div>
            <label className="label" htmlFor="target_date">Data alvo</label>
            <input id="target_date" name="target_date" type="date" className="field mt-1" defaultValue={(valores.target_date as string) ?? ''} />
          </div>
        </div>
        <fieldset className="flex flex-wrap gap-6">
          <legend className="label mb-2">Ferramentas</legend>
          <label className="flex items-center gap-2 text-sm text-g80"><input type="checkbox" name="uses_ai" defaultChecked={!!valores.uses_ai} /> Usa IA</label>
          <label className="flex items-center gap-2 text-sm text-g80"><input type="checkbox" name="uses_n8n" defaultChecked={!!valores.uses_n8n} /> Usa n8n</label>
        </fieldset>
        <div>
          <label className="label" htmlFor="links">Links</label>
          <input id="links" name="links" className="field mt-1" defaultValue={(valores.links as string) ?? ''} placeholder="Repositório, fluxo no n8n, painel…" />
        </div>
        <div>
          <label className="label" htmlFor="notes">Observações</label>
          <textarea id="notes" name="notes" rows={3} className="field mt-1" defaultValue={(valores.notes as string) ?? ''} />
        </div>
      </section>

      <section data-step="decisao" hidden={etapa !== 'decisao'} className="card space-y-5 p-6">
        <div>
          <p className="num text-xs uppercase tracking-wider text-g50">Etapa 2</p>
          <h2 className="mt-1 text-lg font-semibold">Esta iniciativa pode se enquadrar na Lei do Bem?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-g60">
            Se houver desenvolvimento técnico ou tecnológico com novidade, incerteza e trabalho experimental,
            responda “Sim” para fazer a triagem preliminar. O resultado orienta a auditoria e não garante elegibilidade.
          </p>
        </div>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">Pode se enquadrar na Lei do Bem?</legend>
          <label className={`rounded-m border p-4 ${leiDoBem ? 'border-[var(--blue)] bg-[var(--sig-done-bg)]' : 'border-g30'}`}>
            <input type="radio" name="lei_do_bem" value="sim" checked={leiDoBem} onChange={() => setLeiDoBem(true)} />
            <span className="ml-2 font-medium text-g90">Sim, fazer a triagem</span>
          </label>
          <label className={`rounded-m border p-4 ${!leiDoBem ? 'border-[var(--blue)] bg-[var(--sig-done-bg)]' : 'border-g30'}`}>
            <input type="radio" name="lei_do_bem" value="nao" checked={!leiDoBem} onChange={() => setLeiDoBem(false)} />
            <span className="ml-2 font-medium text-g90">Não, salvar sem triagem</span>
          </label>
        </fieldset>
      </section>

      <section data-step="projeto" hidden={etapa !== 'projeto'} className="card space-y-4 p-6">
        <div>
          <p className="num text-xs uppercase tracking-wider text-g50">Etapa 3</p>
          <h2 className="mt-1 text-lg font-semibold">Cadastro do projeto</h2>
          <p className="mt-1 text-sm text-g60">Delimite o projeto antes de avaliar seus critérios técnicos.</p>
        </div>
        {CAMPOS_PROJETO.map(([nome, label, ajuda]) => (
          <div key={nome}>
            <label className="label" htmlFor={nome}>{label}</label>
            <textarea id={nome} name={nome} rows={3} className="field mt-1" defaultValue={(valores[nome] as string) ?? ''} placeholder={ajuda} />
          </div>
        ))}
      </section>

      <section data-step="tecnica" hidden={etapa !== 'tecnica'} className="card space-y-4 p-6">
        <div>
          <p className="num text-xs uppercase tracking-wider text-g50">Etapa 4</p>
          <h2 className="mt-1 text-lg font-semibold">Avaliação técnica (Lei do Bem / MCTI)</h2>
          <p className="mt-1 text-sm text-g60">Os cinco blocos seguem a estrutura técnica usada no FormP&amp;D.</p>
        </div>
        {CAMPOS_TECNICOS.map(([nome, label, ajuda]) => (
          <div key={nome}>
            <label className="label" htmlFor={nome}>{label}</label>
            <textarea id={nome} name={nome} rows={4} className="field mt-1" defaultValue={(valores[nome] as string) ?? ''} placeholder={ajuda} />
          </div>
        ))}
      </section>

      <section data-step="triagem" hidden={etapa !== 'triagem'} className="space-y-4">
        <div className="card p-6">
          <p className="num text-xs uppercase tracking-wider text-g50">Etapa 5</p>
          <h2 className="mt-1 text-lg font-semibold">Triagem preliminar</h2>
          <p className="mt-1 text-sm leading-relaxed text-g60">
            Responda todos os itens. Nenhuma classificação bloqueia a iniciativa; a decisão final é humana.
          </p>
        </div>
        <div className="grid gap-3">
          {TRIAGEM_PERGUNTAS.map((pergunta, i) => {
            const nome = `triagem_${String(pergunta.numero).padStart(2, '0')}`;
            return (
              <div key={nome} className="card grid gap-3 p-4 md:grid-cols-[1fr_13rem] md:items-center">
                <label htmlFor={nome} className="text-sm leading-relaxed text-g80">
                  <span className="num mr-2 font-semibold text-g50">{pergunta.numero}.</span>
                  {pergunta.texto}
                  {pergunta.bloqueioDuro && <span className="ml-2 text-xs font-semibold text-[var(--sig-crit)]">Critério essencial</span>}
                </label>
                <select
                  id={nome} name={nome} required={leiDoBem} className="field"
                  value={respostas[i] ?? ''}
                  onChange={(e) => setRespostas((atuais) => atuais.map((r, j) => (
                    j === i ? (e.target.value as LeiDoBemResposta || null) : r
                  )))}
                >
                  <option value="">Selecione</option>
                  {LEI_DO_BEM_RESPOSTAS.map((resposta) => <option key={resposta} value={resposta}>{RESPOSTA_LABEL[resposta]}</option>)}
                </select>
              </div>
            );
          })}
        </div>
        <Resultado resultado={resultado} />
      </section>

      <section data-step="revisao" hidden={etapa !== 'revisao'} className="card space-y-5 p-6">
        <div>
          <p className="num text-xs uppercase tracking-wider text-g50">Etapa final</p>
          <h2 className="mt-1 text-lg font-semibold">Revisão e salvar</h2>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-s bg-g20 p-3"><dt className="text-xs text-g50">Iniciativa</dt><dd className="mt-1 font-medium text-g90">{titulo || 'Sem título'}</dd></div>
          <div className="rounded-s bg-g20 p-3"><dt className="text-xs text-g50">Pré-análise Lei do Bem</dt><dd className="mt-1 font-medium text-g90">{leiDoBem ? 'Incluída' : 'Não incluída'}</dd></div>
          {leiDoBem && (
            <>
              <div className="rounded-s bg-g20 p-3"><dt className="text-xs text-g50">Blocos técnicos</dt><dd className="mt-1 font-medium text-g90">Cadastro do projeto e avaliação MCTI preenchidos</dd></div>
              <div className="rounded-s bg-g20 p-3"><dt className="text-xs text-g50">Resultado preliminar</dt><dd className="mt-1 font-medium text-g90">{CLASSIFICACAO_LABEL[resultado.classificacao]}</dd></div>
            </>
          )}
        </dl>
        {leiDoBem && <Resultado resultado={resultado} />}
        <p className="text-xs leading-relaxed text-g50">
          A triagem preliminar não substitui a validação técnica, fiscal, contábil e documental.
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          {indiceEtapa > 0 && <Button type="button" variant="ghost" onClick={() => irPara(etapas[indiceEtapa - 1])}>Voltar</Button>}
          <Link href={cancelHref} className="inline-flex items-center rounded-s border border-g40 px-4 py-2 text-sm font-medium text-g80 hover:bg-g20">Cancelar</Link>
        </div>
        {etapa === 'revisao' ? <Salvar rotulo={rotulo} /> : <Button type="button" onClick={avancar}>{etapa === 'decisao' && !leiDoBem ? 'Revisar e salvar' : 'Continuar'}</Button>}
      </div>
    </form>
  );
}

function Resultado({ resultado }: { resultado: ReturnType<typeof classificarTriagem> }) {
  return (
    <aside aria-live="polite" className="card space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-s px-2.5 py-1 text-xs font-semibold ${classeClassificacao(resultado.classificacao)}`}>
          {CLASSIFICACAO_LABEL[resultado.classificacao]}
        </span>
        <span className="num text-sm text-g60">
          Índice: {resultado.indice == null ? '—' : `${Math.round(resultado.indice * 100)}%`}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-g80">{resultado.sintese}</p>
      <p className="text-sm"><strong className="text-g90">Próxima ação:</strong> <span className="text-g60">{resultado.proximaAcao}</span></p>
    </aside>
  );
}
