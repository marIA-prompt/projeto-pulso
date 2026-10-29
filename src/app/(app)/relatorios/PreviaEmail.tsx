import { copiaVisivel } from '@/lib/emails-copia';
import { assuntoEmail, htmlEmailRelatorio } from '@/lib/relatorio-email-html';
import type { RelatorioDiretoria } from '@/lib/relatorio-mensal';

export function PreviaEmail({
  rel, rotulo, dashboardUrl,
}: {
  rel: RelatorioDiretoria;
  rotulo: string;
  dashboardUrl: string | null;
}) {
  const copias = copiaVisivel(rel.emails_copia, rel.diretor_email);
  const html = htmlEmailRelatorio(rel, { rotulo, dashboardUrl });

  return (
    <section aria-labelledby="previa-email" className="card space-y-4 p-4">
      <div>
        <h2 id="previa-email" className="text-sm font-semibold uppercase tracking-widest text-g50">
          Prévia do e-mail
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-g60">
          É o que sai para {rel.nome}. A prévia usa os e-mails já salvos.
          O envio abaixo manda um relatório para cada diretor com endereço, com a cópia da coleção.
        </p>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-3 sm:gap-y-2">
        <dt className="text-g50">Assunto</dt>
        <dd className="min-w-0 break-words font-medium">{assuntoEmail(rel.nome, rotulo)}</dd>
        <dt className="text-g50">Para</dt>
        <dd className="min-w-0 break-words">
          {rel.slug === 'sem-diretoria' || !rel.diretor_email
            ? 'nenhum — esta coleção não é enviada'
            : rel.diretor_email}
        </dd>
        <dt className="text-g50">Cópia</dt>
        <dd className="min-w-0 break-words">{copias.length ? copias.join(', ') : 'nenhuma'}</dd>
      </dl>
      <iframe
        title={`Prévia do e-mail de ${rel.nome}`}
        sandbox=""
        srcDoc={html}
        className="h-[28rem] w-full rounded-s border border-g30 bg-[var(--g10)] sm:h-[36rem]"
      />
    </section>
  );
}
