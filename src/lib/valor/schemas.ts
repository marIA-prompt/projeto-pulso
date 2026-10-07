import { z } from 'zod';

const texto = z.string().trim().min(1, 'não pode ser vazio');
const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'use AAAA-MM-DD');
const mesIso = z.string().regex(/^\d{4}-\d{2}$/, 'use AAAA-MM');
const numero = z.number({ invalid_type_error: 'deve ser número' }).finite();
const inteiro = numero.int('deve ser inteiro');
const naoNegativo = numero.nonnegative('não pode ser negativo');
const etapa = inteiro.min(0).max(5);

export const SITUACAO_NO_JSON = ['Atendido', 'Parcial', 'Não'] as const;
export type SituacaoNoJson = (typeof SITUACAO_NO_JSON)[number];

export const SITUACAO_INTERNA = ['atendido', 'parcial', 'nao'] as const;
export type SituacaoInterna = (typeof SITUACAO_INTERNA)[number];

export const SITUACAO_DE: Record<SituacaoNoJson, SituacaoInterna> = {
  Atendido: 'atendido',
  Parcial: 'parcial',
  Não: 'nao',
};

export const GRUPO_SOLUCAO = ['disponivel', 'em_teste_ou_desenvolvimento'] as const;

const MapaApelidos = z.record(z.string(), texto);

export const Meta = z.object({
  data_base: dataIso,
  ciclos: texto,
  premissas: z.object({
    custo_hora_padrao_brl: naoNegativo,
    custo_hora_min: naoNegativo,
    custo_hora_max: naoNegativo,
    custo_hora_passo: numero.positive('deve ser positivo'),
    horas_mes_por_pessoa: numero.positive('deve ser positivo'),
    nota_custo_hora: texto,
  }).strict().refine(
    (p) => p.custo_hora_min <= p.custo_hora_padrao_brl && p.custo_hora_padrao_brl <= p.custo_hora_max,
    { message: 'custo_hora_padrao_brl deve estar entre min e max', path: ['custo_hora_padrao_brl'] },
  ),
  fontes: z.array(texto).min(1),
}).strict();

export const Normalizacao = z.object({
  diretoria: MapaApelidos,
  tema: MapaApelidos,
  estagio: MapaApelidos,
  pendente_de_confirmacao: z.array(texto).optional(),
}).strict();

export const Solucao = z.object({
  titulo: texto,
  grupo: z.enum(GRUPO_SOLUCAO),
  status: texto,
  pedido: texto,
  o_que_faz: texto,
  quem_usa: texto,
  exemplos: texto,
}).strict();

export const Solucoes = z.array(Solucao).min(1);

const ItemDiagnostico = z.object({
  titulo: texto,
  texto,
}).strict();

const ItemGanho = z.object({
  valor: texto,
  texto,
  nota: texto.optional(),
  ao_vivo: z.boolean().optional(),
}).strict();

const ItemMovimento = z.object({
  texto,
  serve_a: texto,
}).strict();

export const Gestao = z.object({
  diagnostico: z.array(ItemDiagnostico).min(1),
  ganhos: z.object({
    comprovado: z.array(ItemGanho).min(1),
    estimado: z.array(ItemGanho).min(1),
    sem_medicao: z.array(texto),
  }).strict(),
  movimentos: z.array(ItemMovimento).min(1),
  decisoes_da_diretoria: z.array(texto).min(1),
  riscos_abertos: z.array(texto).min(1),
}).strict();

export const Prioridade = z.object({
  id: z.string().regex(/^P\d+$/, 'use P1, P2, …'),
  titulo: texto,
  status: texto,
  etapa,
  ja_existe: z.array(texto).min(1),
  falta: z.array(texto).min(1),
  proximo_passo: texto,
}).strict();

export const Prioridades = z.array(Prioridade).min(1);

export const ResultadoEsperadoJson = z.object({
  ordem: inteiro.positive(),
  resultado: texto,
  situacao: z.enum(SITUACAO_NO_JSON),
  nota: texto,
}).strict();

export const ResultadosEsperadosJson = z.array(ResultadoEsperadoJson).min(1);

const ETAPAS_REGUA = [
  'Desenhado',
  'Construído',
  'Em teste',
  'Em produção',
  'Resultado medido',
] as const;

const Entrega = z.object({
  titulo: texto,
  evidencia: texto,
  frente: texto,
  etapa,
  serve_a: texto,
}).strict();

export const Entregas = z.object({
  etapas: z.tuple([
    z.literal(ETAPAS_REGUA[0]),
    z.literal(ETAPAS_REGUA[1]),
    z.literal(ETAPAS_REGUA[2]),
    z.literal(ETAPAS_REGUA[3]),
    z.literal(ETAPAS_REGUA[4]),
  ]),
  frentes: z.record(z.string().min(1), texto),
  entregas: z.array(Entrega).min(1),
}).strict().superRefine((val, ctx) => {
  const conhecidas = new Set(Object.keys(val.frentes));
  val.entregas.forEach((e, i) => {
    if (!conhecidas.has(e.frente)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['entregas', i, 'frente'],
        message: `frente desconhecida: ${e.frente}`,
      });
    }
  });
});

export const UsoIa = z.object({
  periodo: texto,
  fonte: texto,
  contas: inteiro.nonnegative(),
  contas_com_uso: inteiro.nonnegative(),
  mensagens_trimestre: inteiro.nonnegative(),
  variacao_mensagens_pct: numero,
  uso_dias_uteis_pct: numero,
  areas_que_geraram_codigo: inteiro.nonnegative(),
  linhas_de_codigo: inteiro.nonnegative(),
  custo_estimado_usd: naoNegativo,
  contas_nominais: inteiro.nonnegative(),
  mensagens_por_mes: z.record(mesIso, inteiro.nonnegative()),
  assistentes_em_uso: inteiro.nonnegative(),
  maturidade_assistentes: z.object({
    antes: numero,
    depois: numero,
  }).strict(),
}).strict();

export type Meta = z.infer<typeof Meta>;
export type Normalizacao = z.infer<typeof Normalizacao>;
export type MapasNormalizacao = Pick<Normalizacao, 'diretoria' | 'tema' | 'estagio'>;
export type Solucao = z.infer<typeof Solucao>;
export type Gestao = z.infer<typeof Gestao>;
export type Prioridade = z.infer<typeof Prioridade>;
export type ResultadoEsperadoJson = z.infer<typeof ResultadoEsperadoJson>;
export type Entregas = z.infer<typeof Entregas>;
export type UsoIa = z.infer<typeof UsoIa>;

/** Valida um JSON editorial. A mensagem cita o arquivo para o build apontar o culpado. */
export function validarJson<T>(arquivo: string, schema: z.ZodType<T>, bruto: unknown): T {
  const r = schema.safeParse(bruto);
  if (!r.success) {
    const detalhe = r.error.issues
      .map((i) => `${i.path.length ? i.path.join('.') : '(raiz)'}: ${i.message}`)
      .join('; ');
    throw new Error(`${arquivo} inválido: ${detalhe}`);
  }
  return r.data;
}
