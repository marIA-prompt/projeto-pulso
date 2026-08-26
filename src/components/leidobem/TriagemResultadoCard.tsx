import { BadgeClassificacao } from './Badges';
import type { TriagemResultado } from '@/lib/leiDoBem';

/**
 * Resultado da triagem preliminar (classificação, índice, síntese, próxima
 * ação) — mesmo bloco "RESULTADO PRELIMINAR" da planilha do time de PD&I.
 * Usado no wizard de cadastro (preview em tempo real) e no painel de detalhe
 * da aba Lei do Bem (valores persistidos).
 */
export function TriagemResultadoCard({
  resultado, compacto = false,
}: { resultado: TriagemResultado; compacto?: boolean }) {
  return (
    <div aria-live="polite" className="rounded-m border border-g30 bg-g10 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-g50">
          Resultado preliminar
        </p>
        <BadgeClassificacao classificacao={resultado.classificacao} />
        <span className="num text-sm font-semibold text-[var(--ink-strong)]">
          {resultado.indice == null ? '—' : `${Math.round(resultado.indice * 100)}%`}
          <span className="ml-1 font-normal text-g50">de aderência</span>
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-g80">{resultado.sintese}</p>
      <p className="mt-1 text-sm text-g60">
        <strong className="font-semibold text-g80">Próxima ação:</strong> {resultado.proximaAcao}
      </p>
      {!compacto && (
        <p className="mt-2 text-xs leading-snug text-g50">
          Triagem preliminar — não substitui a validação técnica, fiscal, contábil e
          documental. Nenhum resultado bloqueia o cadastro: a iniciativa entra na aba
          Lei do Bem para revisão humana da auditoria.
        </p>
      )}
    </div>
  );
}
