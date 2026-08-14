'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { dataHora } from '@/lib/format';

export type LinhaFrequencia = {
  meeting_id: string;
  title: string;
  scheduled_at: string;
  convidados: number;
  confirmaram: number;
  presentes: number;
  taxa_presenca: number | null;
};

export function ExportarCsv({ linhas }: { linhas: LinhaFrequencia[] }) {
  const exportar = useCallback(() => {
    const cab = ['Encontro', 'Data', 'Convidados', 'Confirmaram', 'Presentes', 'Taxa de presença (%)'];
    const corpo = linhas.map((k) => [
      k.title, dataHora(k.scheduled_at), k.convidados, k.confirmaram, k.presentes,
      k.taxa_presenca == null ? '' : k.taxa_presenca,
    ]);
    const tConv = linhas.reduce((s, k) => s + k.convidados, 0);
    const tConf = linhas.reduce((s, k) => s + k.confirmaram, 0);
    const tPres = linhas.reduce((s, k) => s + k.presentes, 0);
    const taxa = tConv ? Math.round((1000 * tPres) / tConv) / 10 : '';
    corpo.push(['Total', '', tConv, tConf, tPres, taxa]);

    const csv = [cab, ...corpo]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulso-frequencias-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [linhas]);

  return <Button variant="ghost" onClick={exportar}>Baixar CSV</Button>;
}
