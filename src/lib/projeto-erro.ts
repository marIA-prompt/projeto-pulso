/**
 * Traduz o erro do banco no cadastro/edição de iniciativa.
 *
 * O trigger `enforce_stage_gate` recusava `em_desenvolvimento` sem os 4 eixos
 * da Matriz. A Matriz saiu do formulário, então o usuário via só
 * "Não foi possível salvar as alterações." sem saber que o campo era o
 * Estágio. A migration 0013 desliga o gate; este mapa cobre o intervalo
 * até ela rodar em produção e qualquer recusa residual.
 */

export function mensagemErroSalvarProjeto(erro: { message?: string } | null | undefined): string {
  if (eGateEstagio(erro?.message)) {
    return 'O campo Estágio no pipeline recusou “Em Desenvolvimento”: a Matriz de 4 eixos saiu do cadastro e o banco ainda exige pontuação. Escolha outro estágio ou peça para aplicar a atualização que libera esse estágio.';
  }
  return 'Não foi possível salvar as alterações.';
}

export function mensagemErroCriarProjeto(erro: { message?: string } | null | undefined): string {
  if (eGateEstagio(erro?.message)) {
    return 'O campo Estágio no pipeline recusou “Em Desenvolvimento”: a Matriz de 4 eixos saiu do cadastro e o banco ainda exige pontuação. Escolha outro estágio ou peça para aplicar a atualização que libera esse estágio.';
  }
  return 'Não foi possível salvar a iniciativa. Revise os campos e tente de novo.';
}

export function mensagemErroMoverEstagio(erro: { message?: string } | null | undefined): string {
  if (eGateEstagio(erro?.message)) {
    return 'Não foi possível mover para Em Desenvolvimento: a Matriz de 4 eixos saiu do cadastro e o banco ainda exige pontuação.';
  }
  return 'Não foi possível mover a iniciativa.';
}

export function eGateEstagio(message?: string): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes('4 eixos') ||
    m.includes('mínimo de 3,0') ||
    m.includes('minimo de 3,0') ||
    m.includes('matriz de priorização') ||
    m.includes('matriz de priorizacao')
  );
}
