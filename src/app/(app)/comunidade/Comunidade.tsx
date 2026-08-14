'use client';

import { useMemo, useState } from 'react';
import type { HubProfile } from '@/lib/types';
import { EXPERIENCE_LABEL, EXPERIENCE_LEVELS, ROLE_LABEL, type ExperienceLevel } from '@/lib/types';

function nomeDe(p: HubProfile) {
  return p.nickname?.trim() || p.full_name?.trim() || 'Sem nome';
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

// Cor estável a partir do nome, para o avatar de iniciais.
const CORES = ['#1E3A8A', '#0E7490', '#6D28D9', '#B45309', '#047857', '#9D174D', '#3730A3', '#B91C1C'];
function corDe(nome: string) {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return CORES[h % CORES.length];
}

function Avatar({ p, size = 56 }: { p: HubProfile; size?: number }) {
  const nome = nomeDe(p);
  if (p.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={p.avatar_url}
        alt={`Foto de ${nome}`}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: corDe(nome), fontSize: size * 0.36 }}
    >
      {iniciais(nome)}
    </span>
  );
}

function Tag({ children, tom = 'g' }: { children: React.ReactNode; tom?: 'g' | 'blue' | 'purple' }) {
  const cls =
    tom === 'blue' ? 'bg-[var(--sig-ok-bg)] text-[var(--sig-ok)]'
    : tom === 'purple' ? 'bg-g20 text-[var(--navy)]'
    : 'bg-g20 text-g70';
  return <span className={`rounded-s px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

function unicos(pessoas: HubProfile[], campo: 'languages' | 'automations' | 'interests') {
  const s = new Set<string>();
  pessoas.forEach((p) => p[campo].forEach((v) => s.add(v)));
  return [...s].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function Comunidade({ pessoas, meuId }: { pessoas: HubProfile[]; meuId: string }) {
  const [q, setQ] = useState('');
  const [nivel, setNivel] = useState('');
  const [lang, setLang] = useState('');
  const [autom, setAutom] = useState('');
  const [interesse, setInteresse] = useState('');
  const [area, setArea] = useState('');
  const [soDisponiveis, setSoDisponiveis] = useState(false);
  const [selecionada, setSelecionada] = useState<HubProfile | null>(null);

  const langs = useMemo(() => unicos(pessoas, 'languages'), [pessoas]);
  const automs = useMemo(() => unicos(pessoas, 'automations'), [pessoas]);
  const interesses = useMemo(() => unicos(pessoas, 'interests'), [pessoas]);
  const areas = useMemo(
    () => [...new Set(pessoas.map((p) => p.area_name).filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [pessoas],
  );

  const filtradas = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return pessoas.filter((p) => {
      if (soDisponiveis && !p.available) return false;
      if (nivel && p.experience_level !== nivel) return false;
      if (lang && !p.languages.includes(lang)) return false;
      if (autom && !p.automations.includes(autom)) return false;
      if (interesse && !p.interests.includes(interesse)) return false;
      if (area && p.area_name !== area) return false;
      if (termo) {
        const bolsa = [
          p.full_name, p.nickname, p.headline, p.bio, p.projects_done, p.area_name,
          ...p.languages, ...p.automations, ...p.interests,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!bolsa.includes(termo)) return false;
      }
      return true;
    });
  }, [pessoas, q, nivel, lang, autom, interesse, area, soDisponiveis]);

  const limpar = () => { setQ(''); setNivel(''); setLang(''); setAutom(''); setInteresse(''); setArea(''); setSoDisponiveis(false); };

  return (
    <div className="space-y-5">
      {/* Busca + filtros */}
      <section className="card space-y-4 p-4" aria-label="Busca e filtros">
        <div>
          <label className="label" htmlFor="busca">Buscar pessoa, habilidade, ferramenta ou interesse</label>
          <input
            id="busca" type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Ex.: Python, n8n, dashboards, atendimento…" className="field mt-1"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Filtro id="fNivel" rotulo="Nível de experiência" valor={nivel} onChange={setNivel}
                  opcoes={EXPERIENCE_LEVELS.map((n) => ({ v: n, r: EXPERIENCE_LABEL[n] }))} />
          <Filtro id="fLang" rotulo="Linguagem" valor={lang} onChange={setLang}
                  opcoes={langs.map((v) => ({ v, r: v }))} />
          <Filtro id="fAutom" rotulo="Automação/Ferramenta" valor={autom} onChange={setAutom}
                  opcoes={automs.map((v) => ({ v, r: v }))} />
          <Filtro id="fInt" rotulo="Interesse" valor={interesse} onChange={setInteresse}
                  opcoes={interesses.map((v) => ({ v, r: v }))} />
          <Filtro id="fArea" rotulo="Área" valor={area} onChange={setArea}
                  opcoes={areas.map((v) => ({ v, r: v }))} />
          <label className="flex items-end gap-2 pb-2 text-sm text-g80">
            <input type="checkbox" checked={soDisponiveis} onChange={(e) => setSoDisponiveis(e.target.checked)} />
            Só quem está disponível para colaborar
          </label>
        </div>
        <div className="flex items-center justify-between">
          <p aria-live="polite" className="text-sm text-g60">
            <strong className="num text-g90">{filtradas.length}</strong> de{' '}
            <span className="num">{pessoas.length}</span> pessoas
          </p>
          <button onClick={limpar} className="rounded-s border border-g40 px-3 py-1.5 text-sm font-medium text-g60 hover:bg-g20">
            Limpar filtros
          </button>
        </div>
      </section>

      {/* Grid */}
      {filtradas.length === 0 ? (
        <p className="card p-8 text-center text-sm text-g50">
          Ninguém corresponde a esses filtros. Tente afrouxar a busca.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((p) => {
            const nome = nomeDe(p);
            const skills = [...p.languages, ...p.automations].slice(0, 4);
            return (
              <li key={p.id}>
                <button
                  onClick={() => setSelecionada(p)}
                  className="card flex h-full w-full flex-col gap-3 p-4 text-left transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <Avatar p={p} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-g90">{nome}</span>
                        {p.id === meuId && <span className="text-xs text-g50">(você)</span>}
                      </div>
                      {p.headline && <p className="mt-0.5 line-clamp-2 text-xs text-g60">{p.headline}</p>}
                      <p className="mt-1 text-xs text-g50">{p.area_name ?? 'Área não informada'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {p.experience_level && <Tag tom="purple">{EXPERIENCE_LABEL[p.experience_level]}</Tag>}
                    {p.available && <Tag tom="blue">Disponível</Tag>}
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s) => <Tag key={s}>{s}</Tag>)}
                      {p.languages.length + p.automations.length > skills.length && (
                        <Tag>+{p.languages.length + p.automations.length - skills.length}</Tag>
                      )}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selecionada && (
        <DetalhePessoa pessoa={selecionada} ehVoce={selecionada.id === meuId} onFechar={() => setSelecionada(null)} />
      )}
    </div>
  );
}

function Filtro({
  id, rotulo, valor, onChange, opcoes,
}: { id: string; rotulo: string; valor: string; onChange: (v: string) => void; opcoes: { v: string; r: string }[] }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{rotulo}</label>
      <select id={id} className="field mt-1" value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todos</option>
        {opcoes.map((o) => <option key={o.v} value={o.v}>{o.r}</option>)}
      </select>
    </div>
  );
}

function DetalhePessoa({ pessoa, ehVoce, onFechar }: { pessoa: HubProfile; ehVoce: boolean; onFechar: () => void }) {
  const nome = nomeDe(pessoa);
  return (
    <div
      role="dialog" aria-modal="true" aria-label={`Perfil de ${nome}`}
      onClick={onFechar}
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
    >
      <div onClick={(e) => e.stopPropagation()} className="card max-h-[88vh] w-full max-w-lg overflow-y-auto p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar p={pessoa} size={72} />
            <div>
              <h3 className="text-lg font-bold text-g90">{nome}</h3>
              {pessoa.nickname && pessoa.full_name && pessoa.nickname !== pessoa.full_name && (
                <p className="text-xs text-g50">{pessoa.full_name}</p>
              )}
              {pessoa.headline && <p className="mt-0.5 text-sm text-g60">{pessoa.headline}</p>}
            </div>
          </div>
          <button onClick={onFechar} aria-label="Fechar" className="shrink-0 rounded-s border border-g40 px-2 py-1 text-sm text-g60 hover:bg-g20">✕</button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {pessoa.experience_level && <Tag tom="purple">{EXPERIENCE_LABEL[pessoa.experience_level]}</Tag>}
          {pessoa.available ? <Tag tom="blue">Disponível para colaborar</Tag> : <Tag>Sem disponibilidade agora</Tag>}
          <Tag>{pessoa.area_name ?? 'Área não informada'}</Tag>
          <Tag>{ROLE_LABEL[pessoa.role]}</Tag>
        </div>

        {pessoa.bio && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-g70">{pessoa.bio}</p>}

        <Secao titulo="Linguagens de programação" itens={pessoa.languages} />
        <Secao titulo="Automações & ferramentas" itens={pessoa.automations} />
        <Secao titulo="Interesses" itens={pessoa.interests} />

        {pessoa.projects_done && (
          <div className="mt-4">
            <p className="label mb-1">Projetos realizados</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-g70">{pessoa.projects_done}</p>
          </div>
        )}

        {pessoa.contact && (
          <div className="mt-4">
            <p className="label mb-1">Contato</p>
            <p className="text-sm text-g80">{pessoa.contact}</p>
          </div>
        )}

        {ehVoce && (
          <div className="mt-6 flex justify-end">
            <a href="/comunidade/perfil" className="rounded-s bg-[var(--blue)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--blue-2)]">
              Editar meu perfil
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Secao({ titulo, itens }: { titulo: string; itens: string[] }) {
  if (!itens.length) return null;
  return (
    <div className="mt-4">
      <p className="label mb-1.5">{titulo}</p>
      <div className="flex flex-wrap gap-1.5">
        {itens.map((s) => <Tag key={s}>{s}</Tag>)}
      </div>
    </div>
  );
}
