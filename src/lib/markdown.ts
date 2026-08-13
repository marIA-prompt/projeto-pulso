/**
 * Conversor mínimo de markdown → HTML, suficiente para o Manifesto e as
 * Metodologias. Escapa a entrada ANTES de aplicar qualquer marcação: o
 * conteúdo vem do banco e um admin poderia colar HTML por engano.
 */
function esc(s: string) {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function slugificar(texto: string) {
  return texto
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function extrairSecoes(md: string) {
  return md.split('\n')
    .filter((l) => /^##\s+/.test(l))
    .map((l) => {
      const texto = l.replace(/^##\s+/, '').replace(/[*_`]/g, '').trim();
      return { id: slugificar(texto), texto };
    });
}

function inline(s: string) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+?)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+?)`/g, '<code>$1</code>');
}

export function markdownToHtml(md: string): string {
  const out: string[] = [];
  const linhas = md.split('\n');
  let lista: 'ul' | 'ol' | null = null;
  let tabela: string[][] = [];

  const fecharLista = () => { if (lista) { out.push(`</${lista}>`); lista = null; } };
  const fecharTabela = () => {
    if (!tabela.length) return;
    const [cab, ...corpo] = tabela;
    out.push('<div class="tabela-scroll"><table><thead><tr>');
    cab.forEach((c) => out.push(`<th scope="col">${inline(c)}</th>`));
    out.push('</tr></thead><tbody>');
    corpo.forEach((l) => {
      out.push('<tr>');
      l.forEach((c) => out.push(`<td>${inline(c)}</td>`));
      out.push('</tr>');
    });
    out.push('</tbody></table></div>');
    tabela = [];
  };

  for (const linha of linhas) {
    const l = linha.trimEnd();

    if (/^\|/.test(l)) {
      const celulas = l.split('|').slice(1, -1).map((c) => c.trim());
      if (celulas.every((c) => /^:?-{2,}:?$/.test(c))) continue; // separador
      fecharLista();
      tabela.push(celulas);
      continue;
    }
    fecharTabela();

    if (!l.trim()) { fecharLista(); continue; }

    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      fecharLista();
      const nivel = h[1].length;
      const texto = h[2].replace(/[*_`]/g, '').trim();
      out.push(`<h${nivel} id="${slugificar(texto)}">${inline(h[2])}</h${nivel}>`);
      continue;
    }

    if (/^>\s?/.test(l)) { fecharLista(); out.push(`<blockquote>${inline(l.replace(/^>\s?/, ''))}</blockquote>`); continue; }
    if (/^---+$/.test(l)) { fecharLista(); out.push('<hr />'); continue; }

    const oli = l.match(/^\d+\.\s+(.*)$/);
    if (oli) {
      if (lista !== 'ol') { fecharLista(); out.push('<ol>'); lista = 'ol'; }
      out.push(`<li>${inline(oli[1])}</li>`);
      continue;
    }
    const uli = l.match(/^[-*•→✗]\s+(.*)$/);
    if (uli) {
      if (lista !== 'ul') { fecharLista(); out.push('<ul>'); lista = 'ul'; }
      out.push(`<li>${inline(uli[1])}</li>`);
      continue;
    }

    fecharLista();
    out.push(`<p>${inline(l)}</p>`);
  }
  fecharLista();
  fecharTabela();
  return out.join('\n');
}
