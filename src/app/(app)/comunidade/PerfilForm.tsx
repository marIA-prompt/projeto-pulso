'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { atualizarPerfilHub, type EstadoPerfil } from './actions';
import { TagInput } from './TagInput';
import { Button } from '@/components/ui/Button';
import { ErroBox } from '@/components/ui/Card';
import { EXPERIENCE_LEVELS, EXPERIENCE_LABEL } from '@/lib/types';

type Valores = {
  full_name?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  headline?: string | null;
  bio?: string | null;
  experience_level?: string | null;
  languages?: string[] | null;
  automations?: string[] | null;
  interests?: string[] | null;
  projects_done?: string | null;
  contact?: string | null;
  available?: boolean | null;
};

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : 'Salvar perfil'}</Button>;
}

export function PerfilForm({ valores, nomeCompleto }: { valores: Valores; nomeCompleto: string | null }) {
  const [estado, action] = useFormState(atualizarPerfilHub, {} as EstadoPerfil);
  const [preview, setPreview] = useState<string | null>(valores.avatar_url ?? null);

  return (
    <form action={action} className="space-y-6">
      {estado.erro && <ErroBox mensagem={estado.erro} />}

      <section className="card space-y-4 p-6">
        <h2 className="text-base font-semibold">Identificação</h2>

        <div className="flex flex-wrap items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Prévia da foto de perfil" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-g20 text-xs text-g50">Sem foto</span>
          )}
          <div>
            <label className="label" htmlFor="avatar">Foto de perfil</label>
            <input
              id="avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif"
              className="mt-1 block text-sm text-g70 file:mr-3 file:rounded-s file:border file:border-g40 file:bg-g10 file:px-3 file:py-1.5 file:text-sm file:text-g80"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setPreview(f ? URL.createObjectURL(f) : (valores.avatar_url ?? null));
              }}
            />
            <p className="mt-1 text-xs text-g50">PNG, JPG, WEBP ou GIF, até 3 MB.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="nickname">Nome ou apelido de exibição</label>
            <input id="nickname" name="nickname" className="field mt-1"
                   defaultValue={valores.nickname ?? ''} placeholder={nomeCompleto ?? 'Como quer ser chamado(a)'} />
            <p className="mt-1 text-xs text-g50">Se vazio, usamos seu nome completo{nomeCompleto ? ` (${nomeCompleto})` : ''}.</p>
          </div>
          <div>
            <label className="label" htmlFor="experience_level">Nível de experiência</label>
            <select id="experience_level" name="experience_level" className="field mt-1"
                    defaultValue={valores.experience_level ?? ''}>
              <option value="">Não informado</option>
              {EXPERIENCE_LEVELS.map((n) => <option key={n} value={n}>{EXPERIENCE_LABEL[n]}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="headline">Resumo (uma linha)</label>
          <input id="headline" name="headline" maxLength={140} className="field mt-1"
                 defaultValue={valores.headline ?? ''} placeholder="Ex.: Analista de Dados | Entusiasta de IA e automações" />
        </div>

        <div>
          <label className="label" htmlFor="bio">Sobre você</label>
          <textarea id="bio" name="bio" rows={3} className="field mt-1"
                    defaultValue={valores.bio ?? ''} placeholder="Conte o que você gosta de resolver e como pode ajudar." />
        </div>

        <label className="flex items-center gap-2 text-sm text-g80">
          <input type="checkbox" name="available" defaultChecked={valores.available ?? true} />
          Estou disponível para colaborar em novas iniciativas
        </label>
      </section>

      <section className="card space-y-4 p-6">
        <div>
          <h2 className="text-base font-semibold">Habilidades</h2>
          <p className="mt-1 text-sm text-g60">Separe por vírgula. Elas viram os filtros e a busca da comunidade.</p>
        </div>

        <TagInput
          name="languages" label="Linguagens de programação"
          valorInicial={valores.languages ?? []}
          sugestoes={['Python', 'SQL', 'JavaScript', 'TypeScript', 'Java', 'C#', 'R', 'Go', 'PHP', 'VBA']}
          placeholder="Python, SQL, JavaScript…"
        />

        <TagInput
          name="automations" label="Automações & ferramentas"
          valorInicial={valores.automations ?? []}
          sugestoes={['n8n', 'Power Automate', 'ClickUp', 'Bitrix', 'Zapier', 'Make', 'Power BI', 'Excel Avançado', 'RPA']}
          placeholder="n8n, Power Automate, ClickUp…"
        />

        <TagInput
          name="interests" label="Interesses"
          valorInicial={valores.interests ?? []}
          sugestoes={['IA Generativa', 'Dados & BI', 'Automação de Processos', 'Atendimento', 'RPA', 'Machine Learning', 'Integrações/APIs', 'Compliance']}
          placeholder="IA Generativa, Dados & BI…"
        />

        <div>
          <label className="label" htmlFor="projects_done">Projetos realizados</label>
          <textarea id="projects_done" name="projects_done" rows={3} className="field mt-1"
                    defaultValue={valores.projects_done ?? ''} placeholder="Liste iniciativas ou automações que você já entregou." />
        </div>

        <div>
          <label className="label" htmlFor="contact">Contato (opcional)</label>
          <input id="contact" name="contact" className="field mt-1"
                 defaultValue={valores.contact ?? ''} placeholder="Teams, e-mail ou @usuário" />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Salvar />
        <Link href="/comunidade" className="inline-flex items-center rounded-s border border-g40 px-4 py-2 text-sm font-medium text-g80 hover:bg-g20">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
