function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const a = partes[0][0];
  const b = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (a + b).toUpperCase();
}

/** Cores da paleta, estáveis a partir do nome. */
const CORES = [
  'var(--navy)', 'var(--blue)', 'var(--blue-2)', 'var(--orange)',
  'var(--green)', 'var(--red)', 'var(--cat-7)', 'var(--cat-3)',
];

function corDe(nome: string) {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0;
  return CORES[h % CORES.length];
}

export function Avatar({
  src, nome, size = 32, className = '',
}: {
  src?: string | null;
  nome: string;
  size?: number;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{ width: size, height: size, background: corDe(nome), fontSize: size * 0.36 }}
    >
      {iniciais(nome)}
    </span>
  );
}
