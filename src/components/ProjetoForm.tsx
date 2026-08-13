'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { EIXOS, scoreFinal, classificar, GATE_DESENVOLVIMENTO, type EixoKey } from '@/lib/scoring';
import { STAGE_LABEL, STAGES } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';
import type { EstadoProjeto } from '@/app/(app)/projetos/actions';

type Area = { id: string; name: string };
type Valores = Partial<Record<string, string | number | boolean | null>>;

function Salvar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : rotulo}</Button>;
}

export function ProjetoForm({
  action, areas, valores = {}, rotulo = 'Salvar iniciativa',
}: {
  action: (prev: EstadoProjeto, form: FormData) => Promise<EstadoProjeto>;
  areas: Area[];
  valores?: Valores;
  rotulo?: string;
}) {
  const [estado, formAction] = useFormState(action, {} as EstadoProjeto);
  const [notas, setNotas] = useState<Record<EixoKey, number | null>>({
    impacto: (valores.score_impacto as number) ?? null,
    viabilidade: (valores.score_viabilidade as number) ?? null,
    alinhamento: (valores.score_alinhamento as number) ?? null,
    urgencia: (valores.score_urgencia as number) ?? null,
  });

  const score = scoreFinal(notas);
  const classe = classificar(score);
  const abaixoDoGate = score != null && score < GATE_DESENVOLVIMENTO;

  return (
    <form action={formAction} className="space-y-6">
      {estado.erro && <ErroBox mensagem={estado.erro} />}

      <section className="card space-y-4 p-6">
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
            {abaixoDoGate && (
              <p className="mt-1 text-xs text-[var(--sig-warn)]">
                Com score abaixo de {GATE_DESENVOLVIMENTO.toFixed(1)}, a iniciativa ainda não passa
                o gate para Em Desenvolvimento.
              </p>
            )}
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

      <section className="card space-y-4 p-6">
        <div>
          <h2 className="text-base font-semibold">Matriz de priorização</h2>
          <p className="mt-1 text-sm leading-relaxed text-g60">
            Quatro eixos, nota de 1 a 5. Deixe em branco se ainda não dá para avaliar —
            uma iniciativa não pontuada fica visível, só não entra na fila de priorização.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {EIXOS.map((e) => (
            <div key={e.key}>
              <label className="label" htmlFor={`score_${e.key}`}>
                {e.label} <span className="num font-normal text-g50">· peso {e.peso}%</span>
              </label>
              <select
                id={`score_${e.key}`} name={`score_${e.key}`} className="field mt-1"
                defaultValue={notas[e.key] ?? ''}
                aria-describedby={`ajuda_${e.key}`}
                onChange={(ev) =>
                  setNotas((n) => ({ ...n, [e.key]: ev.target.value ? Number(ev.target.value) : null }))
                }
              >
                <option value="">Não avaliado</option>
                {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <p id={`ajuda_${e.key}`} className="mt-1 text-xs leading-snug text-g50">{e.ajuda}</p>
            </div>
          ))}
        </div>

        <p aria-live="polite" className="rounded-s bg-g20 px-4 py-3 text-sm">
          Score final:{' '}
          <strong className="num text-base text-[var(--ink-strong)]">
            {score == null ? '—' : score.toFixed(2)}
          </strong>{' '}
          <span className="text-g60">· {classe.label}</span>
        </p>
      </section>

      <div className="flex gap-3">
        <Salvar rotulo={rotulo} />
      </div>
    </form>
  );
}
