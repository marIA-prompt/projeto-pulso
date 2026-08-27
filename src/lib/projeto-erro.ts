/**
 * Traduz o erro do banco no cadastro/edição de iniciativa.
 *
 * Causas reais do "não foi possível cadastrar":
 * 1. Trigger da Matriz de 4 eixos recusa `em_desenvolvimento` sem pontuação
 *    (mesmo depois de a Matriz sair do formulário).
 * 2. Colunas novas do cadastro (0012) ainda não existem no banco.
 *
 * A Matriz não classifica nem bloqueia mais nada na aplicação. Estas
 * mensagens só cobrem o intervalo até as migrations 0013/0014 rodarem.
 */

type ErroBanco = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
} | null | undefined;

function textoErro(erro: ErroBanco): string {
  if (!erro) return '';
  return [erro.message, erro.details, erro.hint].filter(Boolean).join(' ');
}

export function eGateEstagio(message?: string): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes('4 eixos') ||
    m.includes('mínimo de 3,0') ||
    m.includes('minimo de 3,0') ||
    m.includes('matriz de priorização') ||
    m.includes('matriz de priorizacao') ||
    m.includes('pontue os')
  );
}

export function eColunaAusente(message?: string): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes('schema cache') ||
    m.includes('does not exist') ||
    m.includes('objetivo_contexto') ||
    m.includes('uses_ai_tradicional') ||
    m.includes('uses_ai_generativa') ||
    m.includes('uses_outros')
  );
}

const MSG_GATE =
  'O campo Estágio no pipeline recusou “Em Desenvolvimento”. Essa trava vinha da Matriz de Priorização, que não existe mais no cadastro. Depois da atualização do banco o estágio grava normalmente.';

const MSG_COLUNA =
  'O cadastro usa campos novos que ainda não estão no banco. Aplique as migrations pendentes no Supabase (0012 em diante).';

export function mensagemErroSalvarProjeto(erro: ErroBanco): string {
  const t = textoErro(erro);
  if (eGateEstagio(t)) return MSG_GATE;
  if (eColunaAusente(t)) return MSG_COLUNA;
  return 'Não foi possível salvar as alterações.';
}

export function mensagemErroCriarProjeto(erro: ErroBanco): string {
  const t = textoErro(erro);
  if (eGateEstagio(t)) return MSG_GATE;
  if (eColunaAusente(t)) return MSG_COLUNA;
  return 'Não foi possível salvar a iniciativa. Revise os campos e tente de novo.';
}

export function mensagemErroMoverEstagio(erro: ErroBanco): string {
  const t = textoErro(erro);
  if (eGateEstagio(t)) return MSG_GATE;
  if (eColunaAusente(t)) return MSG_COLUNA;
  return 'Não foi possível mover a iniciativa.';
}
