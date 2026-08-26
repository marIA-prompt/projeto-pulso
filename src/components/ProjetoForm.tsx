'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { STAGE_LABEL, STAGES } from '@/lib/types';
import { rotuloPessoa, type PessoaOpcao } from '@/lib/pessoas';
import { calcularTriagem, CLASSIFICACAO_LABEL, PROXIMA_ACAO, TRIAGEM_PERGUNTAS, type TriagemResposta } from '@/lib/lei-do-bem';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';
import type { EstadoProjeto } from '@/app/(app)/projetos/actions';

type Area = { id: string; name: string };
type Valores = Partial<Record<string, string | number | boolean | null>>;
const CADASTRO = [
  ['objetivo_estrategico_okr', 'Objetivo estratégico / OKR', 'Qual objetivo ou resultado estratégico esta iniciativa apoia?'],
  ['contexto_problema', 'Contexto e problema', 'Descreva a situação atual, a dor e quem é afetado.'],
  ['o_que_sera_desenvolvido', 'O que será desenvolvido ou alterado', 'Explique o produto, processo, sistema, serviço ou funcionalidade.'],
  ['resultados_esperados', 'Quais resultados são esperados', 'Descreva os resultados mensuráveis esperados.'],
  ['como_sera_desenvolvido', 'Como será desenvolvido', 'Resuma etapas, abordagens e recursos previstos.'],
  ['fora_do_escopo', 'O que está fora do escopo', 'Delimite o que não será tratado por esta iniciativa.'],
  ['desafios_riscos', 'Principais desafios e riscos', 'Registre riscos e desafios relevantes para a entrega.'],
] as const;
const TECNICOS = [
  ['descricao_projeto', 'Descrição do projeto', 'Descreva o problema tecnológico e o progresso esperado.'],
  ['elemento_tecnologico_novo', 'Elemento tecnologicamente novo ou inovador', 'Explique o que é novo na tecnologia, método ou conhecimento aplicado.'],
  ['barreira_desafio_tecnologico', 'Barreira ou desafio tecnológico superável', 'Caracterize a incerteza ou risco técnico a ser superado.'],
  ['metodologia_metodos', 'Metodologia e métodos utilizados', 'Indique métodos, testes, validações e procedimentos técnicos.'],
  ['descritivo_complementar', 'Descritivo complementar', 'Inclua parcerias, patentes, pesquisas acadêmicas ou outras fontes de financiamento.'],
] as const;

function Salvar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : rotulo}</Button>;
}

function Badge({ classificacao }: { classificacao: ReturnType<typeof calcularTriagem>['classificacao'] }) {
  const cores = classificacao === 'potencialmente_elegivel' ? 'bg-[var(--sig-ok-bg)] text-[var(--sig-ok)]'
    : classificacao === 'potencial_parcial' ? 'bg-[var(--sig-warn-bg)] text-[var(--sig-warn)]'
      : classificacao === 'baixo_potencial' ? 'bg-[var(--sig-crit-bg)] text-[var(--sig-crit)]' : 'bg-g20 text-g60';
  return <span className={`rounded-s px-2 py-1 text-xs font-medium ${cores}`}>{CLASSIFICACAO_LABEL[classificacao]}</span>;
}

export function ProjetoForm({ action, areas, pessoas = [], valores = {}, rotulo = 'Salvar iniciativa', cancelHref = '/projetos', ownerPadrao }: {
  action: (prev: EstadoProjeto, form: FormData) => Promise<EstadoProjeto>;
  areas: Area[]; pessoas?: PessoaOpcao[]; valores?: Valores; rotulo?: string; cancelHref?: string; ownerPadrao?: string;
}) {
  const [estado, formAction] = useFormState(action, {} as EstadoProjeto);
  const [etapa, setEtapa] = useState(0);
  const [leiDoBem, setLeiDoBem] = useState(Boolean(valores.lei_do_bem));
  const [respostas, setRespostas] = useState<Array<TriagemResposta | ''>>(
    Array.from({ length: 12 }, (_, i) => (valores[`triagem_${String(i + 1).padStart(2, '0')}`] as TriagemResposta) ?? ''),
  );
  const resultado = calcularTriagem(respostas);
  const titulos = leiDoBem
    ? ['Dados da iniciativa', 'Lei do Bem', 'Cadastro do projeto', 'Avaliação técnica', 'Triagem preliminar', 'Revisão e salvar']
    : ['Dados da iniciativa', 'Lei do Bem'];
  const ultima = leiDoBem ? 5 : 1;
  const mostrar = (n: number) => etapa === n ? 'space-y-4' : 'hidden';

  return <form action={formAction} className="space-y-6">
    <ol className="flex flex-wrap gap-2" aria-label="Etapas do cadastro">
      {titulos.map((titulo, i) => <li key={titulo} className={`rounded-s px-3 py-1.5 text-xs font-medium ${etapa === i ? 'bg-[var(--blue)] text-white' : i < etapa ? 'bg-[var(--sig-ok-bg)] text-[var(--sig-ok)]' : 'bg-g20 text-g60'}`}>{i + 1}. {titulo}</li>)}
    </ol>
    {estado.erro && <ErroBox mensagem={estado.erro} />}

    <section className={`card p-6 ${mostrar(0)}`}>
      <h2 className="text-base font-semibold">Dados da iniciativa</h2>
      <div><label className="label" htmlFor="title">Título</label><input id="title" name="title" required minLength={3} className="field mt-1" defaultValue={(valores.title as string) ?? ''} /></div>
      <div><label className="label" htmlFor="description">O que ela resolve</label><textarea id="description" name="description" rows={4} className="field mt-1" defaultValue={(valores.description as string) ?? ''} placeholder="Que processo hoje consome tempo, e o que muda depois dela." /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="stage">Estágio no pipeline</label><select id="stage" name="stage" className="field mt-1" defaultValue={(valores.stage as string) ?? 'ideia'}>{STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}</select></div>
        <div><label className="label" htmlFor="area_id">Área</label><select id="area_id" name="area_id" className="field mt-1" defaultValue={(valores.area_id as string) ?? ''}><option value="">Não informada</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        <div><label className="label" htmlFor="owner_id">Criado / proprietário</label><select id="owner_id" name="owner_id" className="field mt-1" defaultValue={(valores.owner_id as string) || ownerPadrao || ''}><option value="">Não informado</option>{pessoas.map((p) => <option key={p.id} value={p.id}>{rotuloPessoa(p)}</option>)}</select></div>
        <div><label className="label" htmlFor="theme">Tema</label><input id="theme" name="theme" className="field mt-1" defaultValue={(valores.theme as string) ?? ''} /></div>
        <div><label className="label" htmlFor="directorate">Diretoria</label><input id="directorate" name="directorate" className="field mt-1" defaultValue={(valores.directorate as string) ?? ''} /></div>
        <div><label className="label" htmlFor="hours_saved_month">Horas economizadas por mês</label><input id="hours_saved_month" name="hours_saved_month" type="number" min={0} step="0.5" className="field mt-1" defaultValue={(valores.hours_saved_month as number) ?? ''} /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="label" htmlFor="target_date">Data alvo</label><input id="target_date" name="target_date" type="date" className="field mt-1" defaultValue={(valores.target_date as string) ?? ''} /></div><div><label className="label" htmlFor="links">Links</label><input id="links" name="links" className="field mt-1" defaultValue={(valores.links as string) ?? ''} /></div></div>
      <fieldset className="flex flex-wrap gap-6"><legend className="label mb-2">Ferramentas</legend><label className="flex items-center gap-2 text-sm text-g80"><input type="checkbox" name="uses_ai" defaultChecked={!!valores.uses_ai} /> Usa IA</label><label className="flex items-center gap-2 text-sm text-g80"><input type="checkbox" name="uses_n8n" defaultChecked={!!valores.uses_n8n} /> Usa n8n</label></fieldset>
      <div><label className="label" htmlFor="notes">Observações</label><textarea id="notes" name="notes" rows={3} className="field mt-1" defaultValue={(valores.notes as string) ?? ''} /></div>
    </section>

    <section className={`card p-6 ${mostrar(1)}`}>
      <h2 className="text-base font-semibold">Esta iniciativa pode se enquadrar na Lei do Bem?</h2>
      <p className="mt-2 text-sm leading-relaxed text-g60">A pré-análise é opcional e reúne informações para uma avaliação técnica inicial. Ela não substitui validação fiscal, contábil e documental.</p>
      <label className="mt-5 flex items-center gap-3 rounded-s border border-g30 p-4 text-sm font-medium text-g80"><input type="checkbox" name="lei_do_bem" checked={leiDoBem} onChange={(e) => setLeiDoBem(e.target.checked)} /> Sim, quero incluir a pré-análise Lei do Bem</label>
    </section>

    <section className={`card p-6 ${mostrar(2)}`}><h2 className="text-base font-semibold">Cadastro do projeto</h2><p className="text-sm text-g60">Defina o contexto, escopo e desafios da iniciativa.</p>{CADASTRO.map(([nome, label, ajuda]) => <div key={nome}><label className="label" htmlFor={nome}>{label}</label><textarea id={nome} name={nome} rows={3} className="field mt-1" defaultValue={(valores[nome] as string) ?? ''} placeholder={ajuda} /></div>)}</section>
    <section className={`card p-6 ${mostrar(3)}`}><h2 className="text-base font-semibold">Avaliação técnica (MCTI)</h2><p className="text-sm text-g60">Registre os elementos técnicos que fundamentam a análise de PD&I.</p>{TECNICOS.map(([nome, label, ajuda]) => <div key={nome}><label className="label" htmlFor={nome}>{label}</label><textarea id={nome} name={nome} rows={4} className="field mt-1" defaultValue={(valores[nome] as string) ?? ''} placeholder={ajuda} /></div>)}</section>
    <section className={`card p-6 ${mostrar(4)}`}><h2 className="text-base font-semibold">Triagem preliminar</h2><p className="text-sm text-g60">Selecione uma resposta por item. A classificação é apenas sinalização, nunca bloqueia o cadastro.</p><div className="space-y-4">{TRIAGEM_PERGUNTAS.map((pergunta, i) => <div key={pergunta}><label className="label" htmlFor={`triagem_${String(i + 1).padStart(2, '0')}`}>{i + 1}. {pergunta}</label><select id={`triagem_${String(i + 1).padStart(2, '0')}`} name={`triagem_${String(i + 1).padStart(2, '0')}`} className="field mt-1" value={respostas[i]} onChange={(e) => setRespostas((atual) => atual.map((r, j) => j === i ? e.target.value as TriagemResposta | '' : r))}><option value="">Selecione uma resposta</option><option value="sim">Sim</option><option value="parcialmente">Parcialmente</option><option value="nao">Não</option><option value="nao_sei">Não sei</option></select></div>)}</div><div className="mt-6 rounded-s bg-g20 p-4"><div className="flex flex-wrap items-center gap-2"><Badge classificacao={resultado.classificacao} />{resultado.indice != null && <strong className="num text-sm">{Math.round(resultado.indice * 100)}% de aderência</strong>}</div><p className="mt-3 text-sm text-g70">{resultado.sintese}</p><p className="mt-2 text-sm font-medium text-g80">Próxima ação: {PROXIMA_ACAO[resultado.classificacao]}</p></div></section>
    <section className={`card p-6 ${mostrar(5)}`}><h2 className="text-base font-semibold">Revisão e salvar</h2><p className="text-sm text-g60">Revise os dados da iniciativa e a sinalização da triagem antes de confirmar.</p><div className="mt-4 rounded-s bg-g20 p-4"><Badge classificacao={resultado.classificacao} /><p className="mt-3 text-sm text-g70">{resultado.sintese}</p><p className="mt-2 text-sm font-medium text-g80">Próxima ação: {PROXIMA_ACAO[resultado.classificacao]}</p></div></section>

    <div className="flex flex-wrap gap-3">
      {etapa > 0 && <Button type="button" variant="ghost" onClick={() => setEtapa((n) => n - 1)}>Voltar</Button>}
      {etapa < ultima ? <Button type="button" onClick={() => setEtapa((n) => n + 1)}>Continuar</Button> : <Salvar rotulo={leiDoBem ? rotulo : 'Salvar iniciativa'} />}
      <Link href={cancelHref} className="inline-flex items-center rounded-s border border-g40 px-4 py-2 text-sm font-medium text-g80 hover:bg-g20">Cancelar</Link>
    </div>
  </form>;
}
