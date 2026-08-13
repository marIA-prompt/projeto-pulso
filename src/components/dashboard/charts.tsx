'use client';

import { nf, nf1 } from '@/lib/format';

const CAT = ['var(--cat-1)','var(--cat-2)','var(--cat-3)','var(--cat-4)',
             'var(--cat-5)','var(--cat-6)','var(--cat-7)','var(--cat-8)'];

/**
 * A cor de cada categoria vem do índice em uma ordem estável (alfabética),
 * não do ranking. Se colorisse por rank, a mesma categoria trocaria de cor
 * ao mudar o filtro e o leitor perderia a referência.
 */
function corEstavel(chave: string, universo: string[]) {
  const i = universo.indexOf(chave);
  return CAT[(i < 0 ? 0 : i) % CAT.length];
}

export function Donut({
  dados, titulo,
}: { dados: { rotulo: string; valor: number }[]; titulo: string }) {
  const total = dados.reduce((s, d) => s + d.valor, 0);
  const universo = dados.map((d) => d.rotulo).sort();
  const R = 60, C = 2 * Math.PI * R;
  let offset = 0;

  const descricao = dados
    .map((d) => `${d.rotulo}: ${nf.format(d.valor)} (${((d.valor / total) * 100).toFixed(0)}%)`)
    .join('; ');

  if (!total) return <p className="text-sm text-g50">Sem iniciativas no filtro atual.</p>;

  return (
    <figure className="flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 160 160" width="160" height="160" role="img" aria-labelledby="donut-t donut-d">
        <title id="donut-t">{titulo}</title>
        <desc id="donut-d">{descricao}</desc>
        <g transform="translate(80,80) rotate(-90)">
          {dados.map((d) => {
            const frac = d.valor / total;
            const dash = `${C * frac} ${C * (1 - frac)}`;
            const el = (
              <circle
                key={d.rotulo} r={R} fill="none" strokeWidth={22}
                stroke={corEstavel(d.rotulo, universo)}
                strokeDasharray={dash} strokeDashoffset={-offset}
              />
            );
            offset += C * frac;
            return el;
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" className="num" fontSize="22"
              fill="var(--ink-strong)" fontWeight="600">{nf.format(total)}</text>
        <text x="80" y="94" textAnchor="middle" fontSize="10" fill="var(--g50)">iniciativas</text>
      </svg>

      <figcaption className="w-full">
        <ul className="space-y-1">
          {dados.map((d) => (
            <li key={d.rotulo} className="flex items-center gap-2 text-sm">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: corEstavel(d.rotulo, universo) }} />
              <span className="flex-1 truncate text-g80">{d.rotulo}</span>
              <span className="num text-g60">{nf.format(d.valor)}</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

export function Barras({
  dados, titulo, unidade = '',
}: { dados: { rotulo: string; valor: number }[]; titulo: string; unidade?: string }) {
  const max = Math.max(...dados.map((d) => d.valor), 1);
  if (!dados.length) return <p className="text-sm text-g50">Sem dados no filtro atual.</p>;

  return (
    <figure>
      <figcaption className="sr-only">
        {titulo}. {dados.map((d) => `${d.rotulo}: ${nf1.format(d.valor)}${unidade}`).join('; ')}
      </figcaption>
      <ul className="space-y-2">
        {dados.map((d) => (
          <li key={d.rotulo} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3">
            <span className="truncate text-sm text-g80" title={d.rotulo}>{d.rotulo}</span>
            <span aria-hidden className="h-2.5 rounded-full bg-g20">
              <span className="block h-full rounded-full bg-[var(--blue)]"
                    style={{ width: `${(d.valor / max) * 100}%` }} />
            </span>
            <span className="num text-sm text-g60">{nf1.format(d.valor)}{unidade}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Linha do tempo estilo ECG: registros por mês. */
export function Ecg({ dados }: { dados: { mes: string; valor: number }[] }) {
  if (dados.length < 2) return <p className="text-sm text-g50">Série curta demais para desenhar.</p>;
  const W = 640, H = 120, P = 8;
  const max = Math.max(...dados.map((d) => d.valor), 1);
  const passo = (W - P * 2) / (dados.length - 1);
  const pontos = dados.map((d, i) => {
    const x = P + i * passo;
    const y = H - P - (d.valor / max) * (H - P * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-labelledby="ecg-t ecg-d">
        <title id="ecg-t">Iniciativas registradas por mês</title>
        <desc id="ecg-d">
          {dados.map((d) => `${d.mes}: ${nf.format(d.valor)}`).join('; ')}
        </desc>
        <polyline
          points={pontos.join(' ')} fill="none"
          stroke="var(--blue)" strokeWidth={2}
          strokeLinejoin="round" strokeLinecap="round"
        />
        {dados.map((d, i) => (
          <circle key={d.mes} r={2.5} fill="var(--yellow)"
                  cx={P + i * passo}
                  cy={H - P - (d.valor / max) * (H - P * 2)} />
        ))}
      </svg>
      <figcaption className="num mt-1 flex justify-between text-xs text-g50">
        <span>{dados[0].mes}</span>
        <span>{dados[dados.length - 1].mes}</span>
      </figcaption>
    </figure>
  );
}
