import { markdownToHtml, extrairSecoes } from '@/lib/markdown';

/**
 * Renderiza conteúdo vindo de content_pages. O markdown é convertido no
 * servidor com escape de HTML — nada de dangerouslySetInnerHTML sobre
 * entrada não sanitizada.
 */
export function ContentPage({ titulo, corpo }: { titulo: string; corpo: string }) {
  const secoes = extrairSecoes(corpo);
  const html = markdownToHtml(corpo);

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <nav aria-label="Seções do documento" className="lg:sticky lg:top-20 lg:self-start">
        <p className="label mb-2">Neste documento</p>
        <ol className="space-y-1 border-l border-g30 pl-3">
          {secoes.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="block py-0.5 text-sm text-g60 hover:text-[var(--blue)]">
                {s.texto}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <article className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        <div
          className="prose-pulso mt-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}
