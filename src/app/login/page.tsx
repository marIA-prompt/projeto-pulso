import { LoginForm } from './LoginForm';

export const metadata = { title: 'Entrar — Pulso' };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; erro?: string };
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--g10)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="num text-[0.65rem] uppercase tracking-[0.2em] text-g50">Senff</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Pulso</h1>
          <p className="mt-3 text-sm leading-relaxed text-g60">
            Plataforma do projeto de IA &amp; Automação. O acesso é por convite —
            fale com um administrador se ainda não recebeu o seu.
          </p>
        </div>

        {searchParams.erro === 'sem-permissao' && (
          <p role="alert" className="mb-4 rounded-s border border-[var(--sig-warn)] bg-[var(--sig-warn-bg)] px-3 py-2 text-sm text-[var(--sig-warn)]">
            Essa área é restrita a administradores.
          </p>
        )}

        <LoginForm next={searchParams.next} />
      </div>
    </main>
  );
}
