-- =============================================================================
-- Sistema Pulso — Lei do Bem: pré-triagem do portfólio cadastrado
--
-- Lê as iniciativas já no Pulso (título, descrição, tema, ferramentas, flags
-- uses_ai / uses_n8n) e grava a triagem preliminar. A classificação B27–B30
-- continua no trigger; aqui só entram as 12 escolhas + o status de auditoria.
--
-- Régua idêntica a src/lib/lei-do-bem-pre-triagem.ts. Mudou lá, muda aqui.
--
-- experimental → potencialmente_elegivel → enquadrado
-- parcial      → potencial_parcial      → em_avaliacao_interna
-- pronto       → baixo_potencial        → nao_enquadrado
-- incerto      → baixo_potencial        → backlog
--
-- Sem LIMIT: varre 100% das iniciativas ativas (legado + novas).
-- Não sobrescreve avaliação já existente. Idempotente.
-- =============================================================================

create or replace function public.lei_do_bem_normalizar(p text)
returns text
language sql
immutable
as $$
  select lower(translate(
    coalesce(p, ''),
    'ÁÀÂÃÄáàâãäÉÊéêÍíÓÔÕóôõÚÜúüÇç',
    'AAAAAaaaaaEEeeIiOOOooooUUuuCc'
  ));
$$;

create or replace function public.lei_do_bem_contem(p_txt text, p_palavras text[])
returns boolean
language sql
immutable
as $$
  select exists (
    select 1 from unnest(p_palavras) w
    where case
      when char_length(w) <= 4 and position(' ' in w) = 0
        then p_txt ~ ('(^|[^a-z0-9])' || w || '([^a-z0-9]|$)')
      else position(w in p_txt) > 0
    end
  );
$$;

drop function if exists public.lei_do_bem_perfil_pre_triagem(text, boolean, boolean);

create or replace function public.lei_do_bem_perfil_pre_triagem(
  p_txt_pdi text,
  p_txt_geral text,
  p_uses_ai boolean,
  p_uses_n8n boolean
) returns text
language sql
immutable
as $$
  select case
    when public.lei_do_bem_contem(p_txt_pdi, array[
      'classificador', 'classificacao automatic', 'classificacao de e-mail',
      'modelo preditivo', 'machine learning', 'aprendizado de maquina',
      'visao computacional', 'processamento de linguagem', 'nlp', 'llm',
      'fine-tun', 'fine tun', 'treinar modelo', 'treinamento do modelo',
      'algoritmo', 'embedding', 'embeddings', 'rede neural', 'rag', 'ocr',
      'extrator', 'extracao inteligente', 'score de credito', 'scoring',
      'motor de', 'reconhecimento de', 'predicao', 'preditivo', 'cluster',
      'anomalia', 'matching', 'ranking', 'transformer', 'bert',
      'inteligencia artificial', 'ia generativ', 'generativa',
      'sumariz', 'transcri', 'speech', 'tts', 'stt',
      'leitura automatica', 'roteamento inteligente', 'triagem automatic'
    ]) then 'experimental'
    when public.lei_do_bem_contem(p_txt_geral, array[
      'copilot', 'chatgpt', 'implant', 'configur', 'parametr',
      'power bi', 'looker', 'planilha', 'excel', 'dashboard',
      'relatorio', 'treinamento de', 'workshop', 'migracao',
      'licenca', 'suporte', 'manutencao', 'correcao rotin',
      'rollout', 'capacitacao', 'habilitar o', 'ativar o',
      'office 365', 'microsoft 365'
    ]) then 'pronto'
    when coalesce(p_uses_ai, false)
      or coalesce(p_uses_n8n, false)
      or public.lei_do_bem_contem(p_txt_geral, array[
        'n8n', 'rpa', 'automacao', 'automatizar', 'automatica', 'automatico',
        'automatizad', 'chatbot', 'chat bot', 'assistente', 'whatsapp', 'workflow',
        'fluxo de', 'robo ', 'robos', 'uipath', 'power automate',
        'selenium', 'zapier', 'make.com', 'low code', 'nocode', 'no-code',
        'python', 'script', 'crawler', 'scrap', 'orquestra',
        'integra', 'webhook', 'de ia', 'com ia', 'usa ia', ' ia ', 'bot'
      ]) then 'parcial'
    else 'incerto'
  end;
$$;

insert into public.lei_do_bem_avaliacoes (
  project_id,
  objetivo_estrategico_okr,
  contexto_problema,
  o_que_sera_desenvolvido,
  resultados_esperados,
  como_sera_desenvolvido,
  fora_do_escopo,
  desafios_riscos,
  descricao_projeto,
  elemento_tecnologico_novo,
  barreira_desafio_tecnologico,
  metodologia_metodos,
  descritivo_complementar,
  triagem_01, triagem_02, triagem_03, triagem_04,
  triagem_05, triagem_06, triagem_07, triagem_08,
  triagem_09, triagem_10, triagem_11, triagem_12,
  status,
  prioridade,
  parecer,
  enviar_clickup
)
select
  p.id,
  coalesce(nullif(btrim(p.theme), ''), nullif(btrim(p.directorate), ''), a.name,
           'Iniciativa do portfólio Pulso.'),
  coalesce(nullif(btrim(p.description), ''), 'Problema e público afetado não descritos no cadastro.'),
  p.title,
  case
    when p.hours_saved_month is not null
      then 'Economia estimada no cadastro: ' || trim(to_char(p.hours_saved_month, 'FM999990.00')) || ' h/mês.'
    else null
  end,
  concat_ws(
    ' ',
    case when p.uses_ai then 'Uso de IA declarado no cadastro.' end,
    case when p.uses_n8n then 'Uso de n8n declarado no cadastro.' end,
    nullif(btrim(p.tools), '')
  ),
  case f.perfil
    when 'pronto' then 'Implantação, parametrização, suporte e demais atividades rotineiras de ferramenta de mercado.'
    when 'experimental' then 'Atividades de implantação rotineira e operação contínua após o desenvolvimento.'
    else 'Ainda não delimitado no cadastro — a auditoria deve separar o experimental do rotineiro.'
  end,
  case f.perfil
    when 'experimental' then 'Incerteza no desempenho técnico, na qualidade dos dados e no caminho de desenvolvimento.'
    when 'parcial' then 'Riscos mistos: integração, dados e alguma incerteza técnica a confirmar.'
    else 'Riscos aparentes de prazo, adoção ou configuração — sem evidência de desafio tecnológico.'
  end,
  coalesce(nullif(btrim(p.description), ''), p.title),
  case f.perfil
    when 'experimental' then 'Indício de desenvolvimento de modelo, extração, classificação ou algoritmo próprio.'
    when 'parcial' then 'Automação ou uso de IA sobre processo interno; a novidade tecnológica precisa ser confirmada.'
    when 'pronto' then 'Adoção ou configuração de solução pronta, sem elemento tecnologicamente novo evidenciado.'
    else 'Não há evidência suficiente no cadastro para afirmar elemento tecnológico novo.'
  end,
  case f.perfil
    when 'experimental' then 'Caminho de solução não totalmente conhecido no início (dados, desempenho, abordagem).'
    when 'parcial' then 'Pode haver barreira de integração ou de dados; incerteza técnica a detalhar.'
    else 'Não se demonstra incerteza técnica — o caminho parece conhecido (compra, configuração ou relatório).'
  end,
  case f.perfil
    when 'experimental' then 'Hipóteses, testes, protótipos ou validações técnicas a registrar pela auditoria.'
    when 'parcial' then 'Trabalho sistemático de automação; documentar etapas, testes e o que é experimental.'
    else 'Não se evidencia metodologia experimental no cadastro.'
  end,
  'Pré-triagem automática do portfólio cadastrado no Pulso. A auditoria deve revisar as 12 escolhas. Não substitui validação técnica, fiscal, contábil e documental.',
  -- 12 escolhas (espelho de RESPOSTAS_POR_PERFIL)
  case f.perfil when 'experimental' then 'sim' when 'parcial' then 'sim' else 'parcialmente' end,
  case
    when f.perfil = 'experimental' and nullif(btrim(p.description), '') is not null then 'sim'
    when f.perfil in ('experimental', 'parcial') then 'parcialmente'
    when f.perfil = 'incerto' then 'nao'
    else 'parcialmente'
  end,
  case f.perfil when 'experimental' then 'sim' when 'parcial' then 'sim' when 'pronto' then 'nao' else 'parcialmente' end,
  case f.perfil when 'experimental' then 'sim' when 'parcial' then 'parcialmente' else 'nao' end,
  case f.perfil when 'experimental' then 'sim' when 'parcial' then 'parcialmente' else 'nao' end,
  case f.perfil when 'experimental' then 'sim' when 'parcial' then 'parcialmente' else 'nao' end,
  'parcialmente',
  case f.perfil when 'experimental' then 'sim' when 'parcial' then 'sim' else 'parcialmente' end,
  case f.perfil when 'experimental' then 'sim' when 'parcial' then 'parcialmente' else 'nao' end,
  case f.perfil when 'experimental' then 'sim' when 'parcial' then 'parcialmente' else 'nao' end,
  case f.perfil when 'experimental' then 'sim' when 'parcial' then 'parcialmente' else 'nao' end,
  'parcialmente',
  case f.perfil
    when 'experimental' then 'enquadrado'::public.lei_do_bem_status
    when 'parcial' then 'em_avaliacao_interna'::public.lei_do_bem_status
    when 'pronto' then 'nao_enquadrado'::public.lei_do_bem_status
    else 'backlog'::public.lei_do_bem_status
  end,
  case f.perfil
    when 'experimental' then 'alta'::public.lei_do_bem_prioridade
    when 'parcial' then 'media'::public.lei_do_bem_prioridade
    else 'baixa'::public.lei_do_bem_prioridade
  end,
  'Pré-triagem automática a partir do cadastro no Pulso (título, descrição, tema, IA/n8n). '
    || 'Perfil: ' || f.perfil || '. Não substitui validação técnica, fiscal, contábil e documental. '
    || 'A auditoria deve revisar as 12 escolhas.',
  false
from public.projects p
left join public.areas a on a.id = p.area_id
cross join lateral (
  select public.lei_do_bem_perfil_pre_triagem(
    public.lei_do_bem_normalizar(
      ' ' || concat_ws(' ', p.title, p.description, p.notes) || ' '
    ),
    public.lei_do_bem_normalizar(
      ' ' || concat_ws(' ', p.title, p.description, p.notes, p.theme, p.tools) || ' '
    ),
    p.uses_ai,
    p.uses_n8n
  ) as perfil
) f
where p.archived_at is null
  and p.stage is distinct from 'cancelado'
  and not exists (
    select 1 from public.lei_do_bem_avaliacoes x where x.project_id = p.id
  );
