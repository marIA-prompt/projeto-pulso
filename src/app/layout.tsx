import type { Metadata } from 'next';
import Script from 'next/script';
import { TEMA_BOOT_SCRIPT } from '@/lib/tema';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pulso — IA & Automação Senff',
  description: 'Plataforma do projeto de Inteligência Artificial e Automação da Senff.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
      <head>
        <Script id="pulso-tema" strategy="beforeInteractive">
          {TEMA_BOOT_SCRIPT}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
