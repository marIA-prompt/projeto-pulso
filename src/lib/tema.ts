export const TEMA_KEY = 'pulso-tema';
export type Tema = 'light' | 'dark';

export function ehTema(v: string | null | undefined): v is Tema {
  return v === 'light' || v === 'dark';
}

/** Roda antes da pintura para o HTML já nascer no tema gravado. */
export const TEMA_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${TEMA_KEY}');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export function aplicarTema(tema: Tema) {
  document.documentElement.setAttribute('data-theme', tema);
  try { localStorage.setItem(TEMA_KEY, tema); } catch { /* modo privado / storage bloqueado */ }
}

export function temaAtual(): Tema {
  const attr = document.documentElement.getAttribute('data-theme');
  if (ehTema(attr)) return attr;
  try {
    const gravado = localStorage.getItem(TEMA_KEY);
    if (ehTema(gravado)) return gravado;
  } catch { /* ignore */ }
  return 'light';
}
