/**
 * Ambientes do Guia de Ambientes de IA da Senff (data.js do protótipo,
 * 17 ambientes). Conversar com a IA e a Plataforma Pulso valem 10, no mesmo
 * patamar de uma habilidade comum. O ChatGPT vale 20, como construir,
 * automatizar e dados. Habilidade fora do guia continua em 10.
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
    id: 'chatgpt',
    rotulo: 'ChatGPT',
    pontos: 20,
    chaves: ['chatgpt', 'chat gpt'],
    exatas: ['gpt', 'gpt-4', 'gpt4', 'gpt-4o'],
  },
  {
    id: 'claude',
    rotulo: 'Claude',
    pontos: 10,
    chaves: ['claude'],
    exatas: [],
  },
  {
    id: 'copilot',
    rotulo: 'Microsoft 365 Copilot',
    pontos: 10,
    chaves: ['microsoft 365 copilot', 'm365 copilot', 'copilot'],
    exatas: [],
  },
  {
    id: 'gemini',
    rotulo: 'Gemini',
    pontos: 10,
    chaves: ['google gemini', 'gemini'],
    exatas: [],
  },
  {
    id: 'codex',
    rotulo: 'Codex',
    pontos: 20,
    chaves: ['openai codex', 'codex'],
    exatas: [],
  },
  {
    id: 'cursor',
    rotulo: 'Cursor',
    pontos: 20,
    chaves: ['cursor'],
    exatas: [],
  },
  {
    id: 'vscode',
    rotulo: 'VS Code',
    pontos: 20,
    chaves: ['visual studio code', 'vs code', 'vscode'],
    exatas: [],
  },
  {
    id: 'python',
    rotulo: 'Python',
    pontos: 20,
    chaves: ['python'],
    exatas: [],
  },
  {
    id: 'navigate',
    rotulo: 'Navigate',
    pontos: 20,
    chaves: ['navigate'],
    exatas: [],
  },
  {
    id: 'n8n',
    rotulo: 'n8n',
    pontos: 20,
    chaves: ['n8n'],
    exatas: [],
  },
  {
    id: 'clickup',
    rotulo: 'Esteira de API do ClickUp',
    pontos: 20,
    chaves: ['esteira de api do clickup', 'clickup', 'click up'],
    exatas: [],
  },
  {
    id: 'agentes',
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
  {
    id: 'maf',
    rotulo: 'MAF',
    pontos: 20,
    chaves: ['microsoft agent framework', 'maf'],
    exatas: [],
  },
  {
    id: 'airflow',
    rotulo: 'Airflow',
    pontos: 20,
    chaves: ['apache airflow', 'airflow', 'arflow'],
    exatas: [],
  },
  {
    id: 'powerbi',
    rotulo: 'Power BI',
    pontos: 20,
    chaves: ['power bi', 'powerbi'],
    exatas: [],
  },
  {
    id: 'api',
    rotulo: 'API das LLMs',
    pontos: 20,
    chaves: ['api das llms', 'api das llm', 'api de llms', 'api de llm', 'litellm', 'lite llm'],
    exatas: [],
  },
  {
    id: 'pulso',
    rotulo: 'Plataforma Pulso',
    pontos: 10,
    chaves: ['plataforma pulso', 'pulso'],
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
