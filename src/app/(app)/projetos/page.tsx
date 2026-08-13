import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { STAGE_LABEL, type Stage } from '@/lib/types';
import { classificar } from '@/lib/scoring';
import { nf1, dataCurta } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/ui/Card';

export const metadata = { title: 'Iniciativas — Pulso' };
export const dynamic = 'force-dynamic';

type Linha = {
  id: string; title: string; stage: Stage; theme: string | null;
  owner_id: string | null; hours_saved_month: number | null;
  score_final: number | null; last_activity_at: string;
  areas: { name: string } | null;
};

export default async function ProjetosPage({
  searchParams,
}: { searchParams: { stage?: string; meus?: string; ok?: string } }) {
  const perfil = await requireUser();
  const supabase = createClient();

  let q = supabase
    .from('projects')
    .select('id, title, stage, theme, owner_id, hours_saved_month, score_final, last_activity_at, areas(name)')
    .is('archived_at', null)
    .order('last_activity_at', { ascending: false });

  if (searchParams.stage) q = q.eq('stage', searchParams.stage);
  if (searchParams.meus === '1') q = q.eq('owner_id', perfil.id);

  const { data } = await q;
  const linhas = (data ?? []) as unknown as Linha[];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Iniciativas</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-g60">
            Qualquer participante cadastra. Você edita as suas; administradores editam todas.
          </p>
        </div>
        <Link href="/projetos/novo"><Button>Cadastrar iniciativa</Button></Link>
      </header>

      {searchParams.ok && (
        <p role="status" className="rounded-s bg-[var(--sig-ok-bg)] px-3 py-2 text-sm text-[var(--sig-ok)]">
          {searchParams.ok === 'criada' ? 'Iniciativa cadastrada.' : 'Alterações salvas.'}
        </p>
      )}

      <nav aria-label="Filtros rápidos" className="flex flex-wrap gap-2">
        <FiltroLink href="/projetos" ativo={!searchParams.stage && searchParams.meus !== '1'}>Todas</FiltroLink>
        <FiltroLink href="/projetos?meus=1" ativo={searchParams.meus === '1'}>As minhas</FiltroLink>
        {(['backlog', 'em_desenvolvimento', 'em_teste', 'concluido'] as Stage[]).map((s) => (
          <FiltroLink key={s} href={`/projetos?stage=${s}`} ativo={searchParams.stage === s}>
            {STAGE_LABEL[s]}
          </FiltroLink>
        ))}
      </nav>

      {linhas.length === 0 ? (
        <Empty
          titulo="Nenhuma iniciativa neste recorte."
          acao={<Link href="/projetos/novo"><Button variant="ghost">Cadastrar a primeira</Button></Link>}
        />
      ) : (
        <ul className="grid gap-3">
          {linhas.map((p) => {
            const classe = classificar(p.score_final);
            const meu = p.owner_id === perfil.id;
            return (
              <li key={p.id} className="card flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
                <div className="min-w-[14rem] flex-1">
                  <Link href={`/projetos/${p.id}`} className="font-medium text-g90 hover:text-[var(--blue)]">
                    {p.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-g50">
                    {p.areas?.name ?? 'Área não informada'}
                    {p.theme && ` · ${p.theme}`}
                    {meu && ' · sua iniciativa'}
                  </p>
                </div>
                <span className="rounded-s bg-g20 px-2 py-0.5 text-xs font-medium text-g80">
                  {STAGE_LABEL[p.stage]}
                </span>
                <span className="num text-sm text-g60">
                  {p.hours_saved_month == null ? '—' : `${nf1.format(p.hours_saved_month)} h/mês`}
                </span>
                <span className="text-xs text-g50">
                  {p.score_final == null ? 'Não pontuada' : `${classe.label} · ${p.score_final.toFixed(2)}`}
                </span>
                <span className="num text-xs text-g50">
                  atualizada em {dataCurta(p.last_activity_at)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FiltroLink({ href, ativo, children }: { href: string; ativo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={ativo ? 'true' : undefined}
      className={
        ativo
          ? 'rounded-s bg-[var(--navy)] px-3 py-1.5 text-sm font-medium text-white'
          : 'rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g60 hover:bg-g20'
      }
    >
      {children}
    </Link>
  );
}
