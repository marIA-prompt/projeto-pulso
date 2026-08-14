-- =============================================================================
-- Sistema Pulso — Remoção definitiva do callout de origem (tarja amarela)
-- da Metodologia Executiva.
--
-- A 0005 usava um regex multi-linha não-guloso (`[\s\S]*?`) que, dependendo do
-- ambiente/conteúdo em produção, podia não casar — e o callout continuou
-- aparecendo. Aqui a remoção é feita LINHA A LINHA, em modo newline-sensitive
-- ('n'), mirando apenas as três linhas do callout pelos seus textos-âncora.
-- A citação legítima da §4.1 ("> Se o portfólio está saudável...") é preservada.
-- Idempotente: pode ser reexecutada sem efeito se o callout já não existir.
-- =============================================================================

update public.content_pages
   set body_md = regexp_replace(
         body_md,
         '^>.*(Extraído do PDF oficial|existia em markdown|inteiramente dele).*(\n|$)',
         '',
         'ng'
       ),
       updated_at = now()
 where slug = 'metodologia-executiva';
