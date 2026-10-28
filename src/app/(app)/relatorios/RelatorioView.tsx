import Link from 'next/link';
import { clsx } from '@/lib/clsx';
import { dataCurta, horas, moeda, nf, nf1, plural } from '@/lib/format';
import { chaveMes, deslocarMes, type ItemRelatorio, type PacoteRelatorio, type RelatorioDiretoria } from '@/lib/relatorio-mensal';
import { STAGE_LABEL } from '@/lib/types';
import { Button } from '@/components/ui/Button';

const CORES = [
  'var(--cat-1)', 'var(--cat-2)', 'var(--cat-3)', 'var(--cat-4)',
  'var(--cat-5)', 'var(--cat-6)', 'var(--cat-7)', 'var(--cat-8)',
];

function corDaColecao(ordem: number): string {
  if (!Number.isFinite(ordem) || ordem > 1000) return 'var(--g40)';
  const indice = (Math.floor(ordem / 10) - 1) % CORES.length;
  return CORES[(indice + CORES.length) % CORES.length];
}

function Kpi({ valor, rotulo, nota }: { valor: string; rotulo: string; nota?: string }) {
  return (
    <div className="card p-4">
      <p className="num text-2xl font-semibold leading-none text-[var(--ink-strong)]">{valor}</p>
      <p className="mt-2 text-sm font-medium text-g80">{rotulo}</p>
      {nota && <p className="mt-1 text-xs leading-snug text-g50">{nota}</p>}
    </div>
  );
}

function Tabela({
  itens, quando, rotulo,
}: {
  itens: ItemRelatorio[];
  quando: 'criacao' | 'atualizacao';
  rotulo: string;
}) {
  if (itens.length === 0) {
    return (
      <p className="text-sm text-g60">
        {quando === 'criacao'
          ? 'Nenhuma iniciativa criada neste mês.'
          : 'Nenhuma iniciativa atualizada neste mês.'}
      </p>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[46rem] text-left text-sm">
        <caption className="sr-only">{rotulo}</caption>
        <thead>
          <tr className="border-b border-g30 text-xs uppercase tracking-wide text-g50">
            <th scope="col" className="p-3 font-semibold">Iniciativa</th>
            <th scope="col" className="p-3 font-semibold">Estágio</th>
            <th scope="col" className="p-3 font-semibold">Área</th>
            <th scope="col" className="p-3 font-semibold">Proprietário</th>
            <th scope="col" className="p-3 font-semibold">Horas/mês</th>
            <th scope="col" className="p-3 font-semibold">Valor/mês</th>
            <th scope="col" className="p-3 font-semibold">{quando === 'criacao' ? 'Criada em' : 'Atualizada em'}</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <tr key={item.id} className="border-b border-g20 last:border-0">
              <td className="p-3 font-medium">
                <Link href={`/projetos/${item.id}`} className="text-[var(--ink-strong)] hover:underline">
                  {item.title}
                </Link>
              </td>
              <td className="p-3">{STAGE_LABEL[item.stage]}</td>
              <td className="p-3 text-g60">{item.area_name ?? '—'}</td>
              <td className="p-3 text-g60">{item.owner_name}</td>
              <td className="num p-3">{item.hours_saved_month == null ? '—' : `${nf1.format(item.hours_saved_month)} h`}</td>
              <td className="num p-3">{item.cost_saved_month == null ? '—' : `${moeda(item.cost_saved_month)}`}</td>
              <td className="num p-3 text-g60">
                {dataCurta(quando === 'criacao' ? item.created_at : item.last_activity_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RelatorioDaDiretoria({ rel }: { rel: RelatorioDiretoria }) {
  const { metricas: m, ganhos: g, valor: v } = rel;
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-bold tracking-tight">{rel.nome}</h2>
        {rel.slug !== 'sem-diretoria' && (
          <p className="mt-1 text-sm text-g80">
            {rel.diretor_nome ? `Diretor: ${rel.diretor_nome}` : 'Diretor não informado.'}
            {rel.diretor_email ? ` · ${rel.diretor_email}` : ' · e-mail ainda não cadastrado'}
          </p>
        )}
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-g60">
          {plural(m.criadas_no_mes, 'iniciativa criada', 'iniciativas criadas')} e{' '}
          {plural(m.atualizadas_no_mes, 'atualizada', 'atualizadas')} neste mês.
          Criadas não se repetem na segunda lista. A carga legada não entra como criação.
        </p>
      </header>

      <section aria-labelledby="metricas-titulo" className="space-y-3">
        <h3 id="metricas-titulo" className="text-sm font-semibold uppercase tracking-widest text-g50">Métricas</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi valor={nf.format(m.iniciativas)} rotulo="Iniciativas da área" nota={`${nf.format(m.ativas)} ativas · ${nf.format(m.concluidas)} concluídas`} />
          <Kpi valor={nf.format(m.criadas_no_mes)} rotulo="Criadas no mês" />
          <Kpi valor={nf.format(m.atualizadas_no_mes)} rotulo="Atualizadas no mês" />
          <Kpi
            valor={nf.format(m.em_alerta)}
            rotulo="Em alerta"
            nota="Ativas sem atualização há mais de 14 dias."
          />
          <Kpi valor={nf.format(m.concluidas_no_mes)} rotulo="Concluídas no mês" />
          <Kpi valor={nf.format(m.com_ia)} rotulo="Com uso de IA" />
          <Kpi valor={nf.format(m.canceladas)} rotulo="Canceladas" />
          <Kpi valor={nf.format(m.ativas)} rotulo="Ativas agora" />
        </div>
      </section>

      <section aria-labelledby="ganhos-titulo" className="space-y-3">
        <h3 id="ganhos-titulo" className="text-sm font-semibold uppercase tracking-widest text-g50">Ganhos</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            valor={horas(g.horas_devolvidas_mes)}
            rotulo="Horas devolvidas por mês"
            nota="Só iniciativas concluídas. É o ganho realizado da área."
          />
          <Kpi valor={horas(g.horas_concluidas_no_mes)} rotulo="Horas das concluídas no mês" />
          <Kpi valor={horas(g.horas_criadas)} rotulo="Horas nas criadas no mês" />
          <Kpi valor={horas(g.horas_atualizadas)} rotulo="Horas nas atualizadas no mês" />
        </div>
        <p className="text-xs text-g50">
          {m.com_horas} de {m.iniciativas} iniciativas com horas informadas.
          O portfólio inteiro da área soma {horas(g.horas_portfolio)}/mês, em qualquer estágio.
        </p>
      </section>

      <section aria-labelledby="valor-titulo" className="space-y-3">
        <h3 id="valor-titulo" className="text-sm font-semibold uppercase tracking-widest text-g50">Valor para a área</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            valor={moeda(v.mensal_realizado)}
            rotulo="Realizado por mês"
            nota="Soma do R$/mês das concluídas."
          />
          <Kpi valor={moeda(v.anual_realizado)} rotulo="Realizado por ano" nota="O realizado mensal vezes 12." />
          <Kpi valor={moeda(v.mensal_concluidas_no_mes)} rotulo="Concluídas neste mês" />
          <Kpi
            valor={moeda(v.mensal_movimento)}
            rotulo="Movimento do mês"
            nota={`${moeda(v.mensal_criadas)} nas criadas e ${moeda(v.mensal_atualizadas)} nas atualizadas. Não soma com o realizado.`}
          />
        </div>
        <p className="text-xs text-g50">
          {m.com_valor} de {m.iniciativas} iniciativas com valor em R$ informado.
        </p>
      </section>

      <section aria-labelledby="criadas-titulo" className="space-y-3">
        <h3 id="criadas-titulo" className="text-base font-semibold">Iniciativas criadas no mês</h3>
        <Tabela itens={rel.criadas} quando="criacao" rotulo="Iniciativas criadas no mês" />
      </section>

      <section aria-labelledby="atualizadas-titulo" className="space-y-3">
        <h3 id="atualizadas-titulo" className="text-base font-semibold">Iniciativas atualizadas no mês</h3>
        <Tabela itens={rel.atualizadas} quando="atualizacao" rotulo="Iniciativas atualizadas no mês" />
      </section>

      <details className="card p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--ink-strong)]">
          Texto do e-mail desta diretoria
        </summary>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-g80">{rel.texto}</pre>
      </details>
    </div>
  );
}

const ENVIO: Record<string, { tom: 'ok' | 'aviso'; texto: string }> = {
  ok: { tom: 'ok', texto: 'Relatórios do mês enviados ao fluxo n8n (W6).' },
  'sem-webhook': {
    tom: 'aviso',
    texto: 'O webhook W6 não está configurado. Importe o fluxo n8n/w6-relatorio-mensal.json e grave a URL em N8N_WEBHOOK_W6_RELATORIO_MENSAL.',
  },
  'email-ok': { tom: 'ok', texto: 'E-mail do diretor salvo. O envio mensal usa esse endereço.' },
  'email-invalido': { tom: 'aviso', texto: 'E-mail do diretor inválido.' },
  invalido: { tom: 'aviso', texto: 'Mês inválido. Use o formato AAAA-MM.' },
  erro: { tom: 'aviso', texto: 'Não foi possível montar o relatório para envio.' },
};

export function RelatorioView({
  pacote, selecionada, envio,
}: {
  pacote: PacoteRelatorio;
  selecionada: string;
  envio?: string;
}) {
  const rel = pacote.relatorios.find((r) => r.slug === selecionada) ?? pacote.relatorios[0];
  const anterior = deslocarMes(pacote.ano, pacote.mes, -1);
  const proximo = deslocarMes(pacote.ano, pacote.mes, 1);
  const aviso = envio ? ENVIO[envio] : undefined;
  const qs = (mes: { ano: number; mes: number }, slug?: string) => {
    const q = new URLSearchParams({ mes: chaveMes(mes.ano, mes.mes) });
    if (slug) q.set('diretoria', slug);
    return `/relatorios?${q.toString()}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">Relatório mensal</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Por diretoria</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-g60">
            Posição de {pacote.rotulo}. Cada coleção recebe as iniciativas criadas no mês
            e, em separado, as que já existiam e foram atualizadas. O envio automático
            do dia 1 fecha o mês anterior.
          </p>
        </div>
        <form method="get" action="/relatorios" className="flex flex-wrap items-end gap-2">
          {rel && <input type="hidden" name="diretoria" value={rel.slug} />}
          <div className="w-44">
            <label className="label" htmlFor="mes">Mês</label>
            <input
              id="mes"
              name="mes"
              type="month"
              required
              className="field mt-1"
              defaultValue={chaveMes(pacote.ano, pacote.mes)}
            />
          </div>
          <Button type="submit" variant="ghost">Ver mês</Button>
        </form>
      </header>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={qs(anterior, rel?.slug)} className="font-medium text-[var(--blue)] hover:underline">
          Mês anterior
        </Link>
        <Link href={qs(proximo, rel?.slug)} className="font-medium text-[var(--blue)] hover:underline">
          Próximo mês
        </Link>
      </div>

      {aviso && (
        <p
          role="status"
          className={clsx(
            'rounded-s border p-3 text-sm',
            aviso.tom === 'ok'
              ? 'border-[var(--sig-ok)] bg-[var(--sig-ok-bg)] text-[var(--sig-ok)]'
              : 'border-[var(--sig-warn)] bg-[var(--sig-warn-bg)] text-[var(--sig-warn)]',
          )}
        >
          {aviso.texto}
        </p>
      )}

      {pacote.relatorios.length === 0 || !rel ? (
        <p className="card p-8 text-center text-sm text-g60">
          Nenhuma diretoria cadastrada. Aplique as migrations 0017 e 0018.
        </p>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]">
          <nav aria-label="Diretorias" className="card overflow-hidden">
            <p className="border-b border-g30 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-g50">
              Coleções
            </p>
            <ul>
              {pacote.relatorios.map((item) => {
                const ativa = item.slug === rel.slug;
                const movimento = item.metricas.criadas_no_mes + item.metricas.atualizadas_no_mes;
                return (
                  <li key={item.slug} className="border-b border-g20 last:border-0">
                    <Link
                      href={qs({ ano: pacote.ano, mes: pacote.mes }, item.slug)}
                      aria-current={ativa ? 'page' : undefined}
                      className={clsx(
                        'flex items-start gap-2 px-3 py-2.5 text-sm leading-snug',
                        ativa ? 'bg-[var(--sig-done-bg)] font-semibold text-[var(--ink-strong)]' : 'text-g80 hover:bg-g10',
                      )}
                    >
                      <span
                        aria-hidden
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ background: corDaColecao(item.ordem) }}
                      />
                      <span className="min-w-0 flex-1">{item.nome}</span>
                      <span className="num shrink-0 text-xs text-g50">
                        <span className="sr-only">Criadas e atualizadas no mês: </span>
                        {movimento}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <RelatorioDaDiretoria rel={rel} />
        </div>
      )}
    </div>
  );
}
