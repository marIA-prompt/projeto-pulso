/** Links da barra principal, conforme o papel. */
export function linksDaNav({
  isGerencial, isAdmin,
}: {
  isGerencial: boolean;
  isAdmin: boolean;
}) {
  return [
    { href: '/dashboard', label: 'Acompanhamento' },
    ...(isGerencial ? [{ href: '/rankings', label: 'Rankings' }] : []),
    ...(isAdmin ? [{ href: '/relatorios', label: 'Relatórios' }] : []),
    { href: '/projetos', label: 'Iniciativas' },
    ...(isGerencial ? [{ href: '/lei-do-bem', label: 'Lei do Bem' }] : []),
    { href: '/comunidade', label: 'Comunidade' },
    { href: '/frequencias', label: 'Frequências' },
    { href: '/manifesto', label: 'Manifesto' },
    { href: '/metodologia/metodologia-grupo', label: 'Metodologia' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];
}
