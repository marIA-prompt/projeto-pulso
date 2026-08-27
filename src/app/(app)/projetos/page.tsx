import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { STAGE_LABEL, type Stage, hasRoleAtLeast } from '@/lib/types';
import { nomeProprietario } from '@/lib/pessoas';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/ui/Card';
import { ProjetosKanban, type CardProjeto } from '@/components/ProjetosKanban';
import { IniciativasLista } from './IniciativasLista';
import { FiltroProprietario } from './FiltroProprietario';

export const metadata = { title: 'Iniciativas — Pulso' };
export const dynamic = 'force-dynamic';

type Linha = {
  id: string; title: string; stage: Stage; theme: string | null;
  owner_id: string | null; hours_saved_month: number | null;
  cost_saved_month: number | null;
  last_activity_at: string;
  areas: { name: string } | null;
  profiles: { full_name: string | null } | null;
};

export default async function ProjetosPage({
  searchParams,
}: { searchParams: { stage?: string; meus?: string; ok?: string; view?: string; owner?: string } }) {
  const perfil = await requireUser();
  const supabase = createClient();
  const podeCadastrar = hasRoleAtLeast(perfil.role, 'participante');
  const kanban = searchParams.view === 'kanban';
  const ownerFiltro = searchParams.meus === '1' ? perfil.id : (searchParams.owner || '');

  const [{ data }, { data: pessoas }] = await Promise.all([
    (function () {
      let q = supabase
        .from('projects')
        .select('id, title, stage, theme, owner_id, hours_saved_month, cost_saved_month, last_activity_at, areas(name), profiles!owner_id(full_name)')
        .is('archived_at', null)
        .order('last_activity_at', { ascending: false });

      if (searchParams.stage && !kanban) q = q.eq('stage', searchParams.stage);
      if (ownerFiltro) q = q.eq('owner_id', ownerFiltro);
      return q;
    })(),
    supabase.from('profiles').select('id, full_name').eq('active', true).order('full_name'),
  ]);
  const linhas = ((data ?? []) as unknown as Linha[]).map((p) => ({
    ...p,
    profiles: Array.isArray(p.profiles) ? (p.profiles[0] ?? null) : p.profiles,
  }));

  const preservar = (extra: Record<string, string>) => {
    const sp = new URLSearchParams();
    if (ownerFiltro && extra.owner === undefined && extra.meus === undefined) sp.set('owner', ownerFiltro);
    if (searchParams.stage && !kanban) sp.set('stage', searchParams.stage);
    Object.entries(extra).forEach(([k, v]) => (v ? sp.set(k, v) : sp.delete(k)));
    const s = sp.toString();
    return s ? `/projetos?${s}` : '/projetos';
  };

  const cards: CardProjeto[] = linhas.map((p) => ({
    id: p.id, title: p.title, stage: p.stage, theme: p.theme,
    owner_id: p.owner_id, hours_saved_month: p.hours_saved_month,
    cost_saved_month: p.cost_saved_month,
    area_name: p.areas?.name ?? null,
    owner_name: nomeProprietario(p.owner_id, p.profiles),
  }));

  const minhasAtivo = ownerFiltro === perfil.id;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Iniciativas</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-g60">
            {podeCadastrar
              ? 'Qualquer participante cadastra. Você edita as suas; administradores editam todas.'
              : 'Seu perfil é somente leitura: você acompanha todas as iniciativas, mas não cadastra nem edita.'}
          </p>
        </div>
        {podeCadastrar && (
          <Link href="/projetos/novo"><Button>Cadastrar iniciativa</Button></Link>
        )}
      </header>

      {searchParams.ok && (
        <p role="status" className="rounded-s bg-[var(--sig-ok-bg)] px-3 py-2 text-sm text-[var(--sig-ok)]">
          {searchParams.ok === 'criada' ? 'Iniciativa cadastrada.' : 'Alterações salvas.'}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filtros rápidos" className="flex flex-wrap gap-2">
          <FiltroLink href={preservar({ view: kanban ? 'kanban' : '', owner: '', meus: '', stage: '' })}
                      ativo={!searchParams.stage && !ownerFiltro}>Todas</FiltroLink>
          <FiltroLink href={preservar({ owner: perfil.id, meus: '', view: kanban ? 'kanban' : '' })}
                      ativo={minhasAtivo}>As minhas</FiltroLink>
          {!kanban && (['backlog', 'em_desenvolvimento', 'em_teste', 'concluido'] as Stage[]).map((s) => (
            <FiltroLink key={s} href={preservar({ stage: s, view: '' })} ativo={searchParams.stage === s}>
              {STAGE_LABEL[s]}
            </FiltroLink>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <FiltroProprietario
            pessoas={pessoas ?? []}
            valor={ownerFiltro}
            query={{
              ...(kanban ? { view: 'kanban' } : {}),
              ...(searchParams.stage && !kanban ? { stage: searchParams.stage } : {}),
            }}
          />
          <nav aria-label="Modo de visualização" className="flex gap-2">
            <FiltroLink href={preservar({ view: '' })} ativo={!kanban}>Lista</FiltroLink>
            <FiltroLink href={preservar({ view: 'kanban' })} ativo={kanban}>Kanban</FiltroLink>
          </nav>
        </div>
      </div>

      {kanban ? (
        cards.length === 0 ? (
          <Empty titulo="Nenhuma iniciativa neste recorte." />
        ) : (
          <ProjetosKanban projetos={cards} meuId={perfil.id} podeMover={podeCadastrar} />
        )
      ) : linhas.length === 0 ? (
        <Empty
          titulo="Nenhuma iniciativa neste recorte."
          acao={podeCadastrar
            ? <Link href="/projetos/novo"><Button variant="ghost">Cadastrar a primeira</Button></Link>
            : undefined}
        />
      ) : (
        <IniciativasLista
          linhas={linhas.map((p) => ({
            id: p.id,
            title: p.title,
            stage: p.stage,
            theme: p.theme,
            area_name: p.areas?.name ?? null,
            owner_id: p.owner_id,
            owner_name: nomeProprietario(p.owner_id, p.profiles),
            hours_saved_month: p.hours_saved_month,
            last_activity_at: p.last_activity_at,
          }))}
          meuId={perfil.id}
          podeGerenciar={hasRoleAtLeast(perfil.role, 'gerencial')}
        />
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
