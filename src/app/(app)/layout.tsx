import { requireUser } from '@/lib/auth';
import { hasRoleAtLeast } from '@/lib/types';
import { Nav } from '@/components/Nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const perfil = await requireUser();
  return (
    <>
      <Nav
        isGerencial={hasRoleAtLeast(perfil.role, 'gerencial')}
        isAdmin={perfil.role === 'administrador'}
        nome={perfil.full_name ?? 'Participante'}
        apelido={perfil.nickname}
        avatarUrl={perfil.avatar_url}
        userId={perfil.id}
      />
      <main className="mx-auto max-w-shell px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-shell px-4 pb-10 text-xs text-g50">
        Transparência interna. Os dados desta plataforma não são públicos.
      </footer>
    </>
  );
}
