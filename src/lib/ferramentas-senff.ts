/**
 * Ambientes de IA da Senff que pesam no ranking de especialistas.
 * A lista de referência fica em
 * https://hml-prototipos.senff.com.br/senff-ia/ambientes/
 *
 * Claude vale 10. ChatGPT, Airflow e Agentes de Monitoramento valem 20.
 * Habilidade que não é um desses ambientes continua em 10.
 */

export const PONTOS_HABILIDADE_BASE = 10;

export type AmbienteSenff = {
  id: string;
  rotulo: string;
  pontos: number;
  /** Frases normalizadas. Casam o texto inteiro ou um trecho delimitado. */
  chaves: readonly string[];
  /** Só casam quando a habilidade, sem verbo, é exatamente isto. */
  exatas: readonly string[];
};

export const AMBIENTES_SENFF: readonly AmbienteSenff[] = [
  {
    id: 'claude',
    rotulo: 'Claude',
    pontos: 10,
    chaves: ['claude'],
    exatas: [],
  },
  {
    id: 'chatgpt',
    rotulo: 'ChatGPT',
    pontos: 20,
    chaves: ['chatgpt', 'chat gpt'],
    exatas: ['gpt', 'gpt-4', 'gpt4', 'gpt-4o'],
  },
  {
    id: 'airflow',
    rotulo: 'Airflow',
    pontos: 20,
    chaves: ['airflow', 'apache airflow', 'arflow'],
    exatas: [],
  },
  {
    id: 'agentes-monitoramento',
    rotulo: 'Agentes de Monitoramento',
    pontos: 20,
    chaves: [
      'agentes de monitoramento',
      'agente de monitoramento',
      'agentes monitoramento',
      'agente monitoramento',
    ],
    exatas: [],
  },
];

export const SUGESTOES_AMBIENTES_SENFF: readonly string[] = AMBIENTES_SENFF.map((a) => a.rotulo);

export type HabilidadePontuada = {
  nome: string;
  pontos: number;
  senff: boolean;
  ambiente: string | null;
};

const VERBO = /^(?:saber|usar|utilizar|lancar|conhecer|operar)(?:\s+(?:o|a|os|as))?\s+/;

export function normalizarAmbiente(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

function semVerbo(valor: string): string {
  let atual = valor;
  for (let i = 0; i < 3; i += 1) {
    const proximo = atual.replace(VERBO, '').trim();
    if (proximo === atual) break;
    atual = proximo;
  }
  return atual;
}

function escapar(chave: string): string {
  return chave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}

function contemChave(texto: string, chave: string): boolean {
  return new RegExp(`(?:^|\\s)${escapar(chave)}(?:$|\\s|[.,;:/-])`).test(texto);
}

export function identificarAmbienteSenff(valor: string): AmbienteSenff | null {
  const normalizado = semVerbo(normalizarAmbiente(valor));
  if (!normalizado) return null;

  let melhor: AmbienteSenff | null = null;
  let melhorTamanho = 0;
  for (const ambiente of AMBIENTES_SENFF) {
    if (ambiente.exatas.some((chave) => normalizado === chave) && normalizado.length > melhorTamanho) {
      melhor = ambiente;
      melhorTamanho = normalizado.length;
    }
    for (const chave of ambiente.chaves) {
      if (!contemChave(normalizado, chave)) continue;
      if (chave.length > melhorTamanho) {
        melhor = ambiente;
        melhorTamanho = chave.length;
      }
    }
  }
  return melhor;
}

/** Soma os pontos das habilidades do Hub. O mesmo ambiente não pontua duas vezes. */
export function pontuarHabilidades(
  languages: string[] | null | undefined,
  automations: string[] | null | undefined,
): { itens: HabilidadePontuada[]; total: number } {
  const vistos = new Set<string>();
  const ambientes = new Set<string>();
  const itens: HabilidadePontuada[] = [];

  for (const bruto of [...(languages ?? []), ...(automations ?? [])]) {
    const nome = bruto.trim();
    const chave = normalizarAmbiente(nome);
    if (!chave || vistos.has(chave)) continue;
    vistos.add(chave);

    const ambiente = identificarAmbienteSenff(nome);
    if (ambiente) {
      if (ambientes.has(ambiente.id)) continue;
      ambientes.add(ambiente.id);
      itens.push({
        nome,
        pontos: ambiente.pontos,
        senff: true,
        ambiente: ambiente.rotulo,
      });
      continue;
    }

    itens.push({
      nome,
      pontos: PONTOS_HABILIDADE_BASE,
      senff: false,
      ambiente: null,
    });
  }

  return {
    itens,
    total: itens.reduce((soma, item) => soma + item.pontos, 0),
  };
}
