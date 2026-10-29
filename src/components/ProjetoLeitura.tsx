import { STAGE_LABEL, type Stage } from '@/lib/types';
import { diretoriaExibida } from '@/lib/diretorias';
import { diaCurto, nf1 } from '@/lib/format';
import { GRUPO1_CAMPOS_ESCOPO } from '@/lib/lei-do-bem';

type Projeto = {
  title: string;
  objetivo_contexto?: string | null;
  description?: string | null;
  stage: Stage;
  directorate?: string | null;
  hours_saved_month?: number | null;
  dev_hours?: number | null;
  target_date?: string | null;
  links?: string | null;
  uses_ai_tradicional?: boolean | null;
  uses_ai_generativa?: boolean | null;
  uses_n8n?: boolean | null;
  uses_outros?: boolean | null;
  uses_ai?: boolean | null;
};

type LeiDoBem = Partial<Record<string, string | null>> | null;

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-g50">{rotulo}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm text-g80">{valor?.trim() ? valor : '—'}</dd>
    </div>
  );
}

export function ProjetoLeitura({
  projeto, areaNome, ownerNome, leiDoBem,
}: {
  projeto: Projeto;
  areaNome: string | null;
  ownerNome: string | null;
  leiDoBem?: LeiDoBem;
}) {
  const ferramentas = [
    (projeto.uses_ai_tradicional || (projeto.uses_ai && !projeto.uses_ai_generativa)) && 'IA Tradicional',
    projeto.uses_ai_generativa && 'IA Generativa',
    projeto.uses_n8n && 'n8n',
    projeto.uses_outros && 'Outros',
  ].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold">Dados da iniciativa</h2>
        <dl className="space-y-3">
          <Linha rotulo="Título" valor={projeto.title} />
          <Linha rotulo="Objetivo e Contexto" valor={projeto.objetivo_contexto} />
          <Linha rotulo="Descrição da iniciativa" valor={projeto.description} />
          <Linha rotulo="Estágio no pipeline" valor={STAGE_LABEL[projeto.stage]} />
          <Linha rotulo="Área" valor={areaNome} />
          <Linha rotulo="Criado / proprietário" valor={ownerNome} />
          <Linha rotulo="Diretoria" valor={diretoriaExibida(areaNome, projeto.directorate) ?? projeto.directorate} />
          <Linha
            rotulo="Horas economizadas por mês"
            valor={projeto.hours_saved_month == null ? null : `${nf1.format(projeto.hours_saved_month)} h`}
          />
          <Linha
            rotulo="Estimativa de tempo do desenvolvimento"
            valor={projeto.dev_hours == null ? null : `${nf1.format(projeto.dev_hours)} h`}
          />
          <Linha rotulo="Data alvo" valor={projeto.target_date ? diaCurto(projeto.target_date) : null} />
          <Linha rotulo="Ferramentas" valor={ferramentas || null} />
          <Linha rotulo="Links" valor={projeto.links} />
        </dl>
      </section>

      {leiDoBem && (
        <section className="card space-y-4 p-6">
          <h2 className="text-base font-semibold">Cadastro do projeto (Lei do Bem)</h2>
          <p className="text-sm leading-relaxed text-g60">
            Escopo informado na etapa da Lei do Bem — somente visualização.
          </p>
          <dl className="space-y-3">
            {GRUPO1_CAMPOS_ESCOPO.map((c) => (
              <Linha key={c.name} rotulo={c.label} valor={leiDoBem[c.name]} />
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
