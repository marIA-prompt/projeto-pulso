import { nf, nf1 } from '@/lib/format';
import type { PortfolioKpis, AttendanceKpi } from '@/lib/types';

function Kpi({
  valor, rotulo, nota,
}: { valor: string; rotulo: string; nota?: string }) {
  return (
    <div className="card p-4">
      <p className="num text-2xl font-semibold leading-none text-[var(--ink-strong)]">{valor}</p>
      <p className="mt-2 text-sm font-medium text-g80">{rotulo}</p>
      {nota && <p className="mt-1 text-xs leading-snug text-g50">{nota}</p>}
    </div>
  );
}

export function Kpis({
  kpis, frequencia,
}: { kpis: PortfolioKpis; frequencia: AttendanceKpi | null }) {
  return (
    <section aria-labelledby="kpis-titulo">
      <h2 id="kpis-titulo" className="sr-only">Indicadores do portfólio</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi valor={nf.format(kpis.total_iniciativas)} rotulo="Iniciativas mapeadas" />
        <Kpi
          valor={`${nf1.format(kpis.horas_mes_devolvidas)} h`}
          rotulo="Horas devolvidas por mês"
          nota={`Só iniciativas concluídas. Portfólio inteiro: ${nf1.format(kpis.horas_mes_portfolio_total)} h.`}
        />
        <Kpi valor={nf.format(kpis.areas_com_iniciativa)} rotulo="Áreas com iniciativa" />
        <Kpi
          valor={nf.format(kpis.ativas)}
          rotulo="Iniciativas ativas"
          nota={`${nf.format(kpis.concluidas)} concluídas até aqui.`}
        />
      </div>

      {frequencia && (
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            valor={frequencia.taxa_confirmacao == null ? '—' : `${nf1.format(frequencia.taxa_confirmacao)}%`}
            rotulo="Confirmaram presença"
            nota={frequencia.title}
          />
          <Kpi
            valor={frequencia.taxa_presenca == null ? '—' : `${nf1.format(frequencia.taxa_presenca)}%`}
            rotulo="Presença no último encontro"
            nota={
              (frequencia.taxa_presenca ?? 0) >= 80
                ? 'Meta de 80% atingida.'
                : 'Meta da metodologia: 80%.'
            }
          />
        </div>
      )}
    </section>
  );
}
