import type { Config } from 'tailwindcss';

/**
 * Os tokens vivem em src/styles/tokens.css (fonte única, extraída do
 * design system Senff). Aqui apenas mapeamos para utilitários — nunca
 * redefinimos valores hexadecimais.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: 'var(--navy)',
        'navy-deep': 'var(--navy-deep)',
        blue: 'var(--blue)',
        'blue-2': 'var(--blue-2)',
        yellow: 'var(--yellow)',
        sky: 'var(--sky)',
        g90: 'var(--g90)', g80: 'var(--g80)', g60: 'var(--g60)',
        g50: 'var(--g50)', g40: 'var(--g40)', g30: 'var(--g30)',
        g20: 'var(--g20)', g10: 'var(--g10)',
        surface: 'var(--white)',
        'sig-ok': 'var(--sig-ok)', 'sig-ok-bg': 'var(--sig-ok-bg)',
        'sig-warn': 'var(--sig-warn)', 'sig-warn-bg': 'var(--sig-warn-bg)',
        'sig-crit': 'var(--sig-crit)', 'sig-crit-bg': 'var(--sig-crit-bg)',
        'sig-done': 'var(--sig-done)', 'sig-done-bg': 'var(--sig-done-bg)',
      },
      fontFamily: { sans: ['var(--ff)'], mono: ['var(--fm)'] },
      borderRadius: { s: 'var(--r-s)', m: 'var(--r-m)', l: 'var(--r-l)' },
      boxShadow: { 1: 'var(--sh-1)', 2: 'var(--sh-2)', 3: 'var(--sh-3)' },
      maxWidth: { shell: 'var(--maxw)' },
    },
  },
  plugins: [],
};
export default config;
