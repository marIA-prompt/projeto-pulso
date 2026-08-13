import { requireUser } from '@/lib/auth';
import { Nav } from '@/components/Nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const perfil = await requireUser();
  return (
    <>
      <Nav isAdmin={perfil.role === 'administrador'} nome={perfil.full_name ?? 'Participante'} />
      <main className="mx-auto max-w-shell px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-shell px-4 pb-10 text-xs text-g50">
        Transparência interna. Os dados desta plataforma não são públicos.
      </footer>
    </>
  );
}
