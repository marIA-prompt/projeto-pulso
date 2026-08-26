-- =============================================================================
-- Sistema Pulso — Lei do Bem (pré-análise de enquadramento, Lei 11.196/2005)
--
-- Cria a avaliação 1:1 com projects (tabela filha, para não inchar projects
-- com ~24 campos que só existem para quem opta pela Lei do Bem):
--   • Bloco "Cadastro do Projeto"  (7 campos, itens 4–10 do doc de referência)
--   • Bloco técnico MCTI           (5 campos, Guia Prático da Lei do Bem §6)
--   • Questionário de triagem      (12 itens, planilha
--     Triagem_Preliminar_Lei_do_Bem_Simples.xlsx — fonte de verdade da lógica)
--   • Gestão do processo de auditoria (status, responsável, parecer,
--     prioridade, flag de envio ao ClickUp — a integração real fica p/ depois)
--
-- A classificação automática replica 1:1 as fórmulas da planilha
-- (B27 Classificação, B28 Índice de aderência, B29 Síntese, B30 Próxima ação).
-- A triagem NUNCA bloqueia o cadastro: é sinalização para revisão humana.
--
-- Também remove o gate da Matriz de Priorização (trigger projects_stage_gate):
-- a Matriz de 4 Eixos saiu do cadastro de iniciativa (decisão de produto desta
-- entrega). Com o formulário sem os 4 eixos, manter o gate tornaria impossível
-- mover qualquer iniciativa nova para Em Desenvolvimento. As colunas de score
-- permanecem no schema como dado histórico/legado.
--
-- Idempotente: pode ser reexecutada.
-- =============================================================================


-- =============================================================================
-- 1. ENUMS
-- =============================================================================

-- Estágio do processo de auditoria (controlado manualmente pelo time de PD&I).
do $$ begin
  create type public.lei_do_bem_status as enum (
    'backlog', 'em_avaliacao_interna', 'enquadrado', 'nao_enquadrado'
  );
exception when duplicate_object then null; end $$;

-- Escala de resposta do questionário — idêntica ao dropdown da planilha.
do $$ begin
  create type public.lei_do_bem_resposta as enum ('sim', 'parcialmente', 'nao', 'nao_sei');
exception when duplicate_object then null; end $$;

-- Classificação automática — idêntica à célula "Classificação" da planilha.
do $$ begin
  create type public.lei_do_bem_classificacao as enum (
    'pendente',                  -- nem todas as 12 respondidas
    'informacoes_insuficientes', -- alguma resposta = "não sei"
    'baixo_potencial',           -- bloqueio duro OU índice < 0,5
    'potencial_parcial',         -- índice entre 0,5 e 0,75
    'potencialmente_elegivel'    -- índice >= 0,75 e nenhum bloqueio duro
  );
exception when duplicate_object then null; end $$;


-- =============================================================================
-- 2. TABELA
-- =============================================================================
-- Nome do projeto, responsável e data NÃO são duplicados: já existem em
-- projects (title, owner_id, created_at). A planilha os pede porque é avulsa.

create table if not exists public.lei_do_bem_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,

  -- === Bloco "Cadastro do Projeto" (itens 4–10 do documento de referência) ===
  objetivo_estrategico_okr text,
  contexto_problema text,
  o_que_sera_desenvolvido text,
  resultados_esperados text,
  como_sera_desenvolvido text,
  fora_do_escopo text,
  desafios_riscos text,

  -- === Bloco técnico MCTI (Guia Prático da Lei do Bem, seção 6) ===
  -- Cada campo corresponde a 1 dos 5 critérios de PD&I do Manual de Frascati
  -- (inovador / criativo / incerto / sistemático / transferível-reprodutível).
  descricao_projeto text,              -- 6.1 problema tecnológico + progresso
  elemento_tecnologico_novo text,      -- 6.2 o que é novo/inovador
  barreira_desafio_tecnologico text,   -- 6.3 incerteza/risco tecnológico
  metodologia_metodos text,            -- 6.4 metodologia e métodos
  descritivo_complementar text,        -- 6.5 parcerias, patentes etc.

  -- === Questionário de triagem preliminar (12 itens da planilha) ===
  -- Bloqueios duros ("Não" derruba para baixo_potencial): 3,4,5,6,9,10,11.
  triagem_01 public.lei_do_bem_resposta,
  triagem_02 public.lei_do_bem_resposta,
  triagem_03 public.lei_do_bem_resposta,
  triagem_04 public.lei_do_bem_resposta,
  triagem_05 public.lei_do_bem_resposta,
  triagem_06 public.lei_do_bem_resposta,
  triagem_07 public.lei_do_bem_resposta,
  triagem_08 public.lei_do_bem_resposta,
  triagem_09 public.lei_do_bem_resposta,
  triagem_10 public.lei_do_bem_resposta,
  triagem_11 public.lei_do_bem_resposta,
  triagem_12 public.lei_do_bem_resposta,

  -- Calculados pelo trigger abaixo a cada escrita — persistidos para
  -- listar/filtrar/ordenar sem recalcular (volume de escrita é baixo).
  triagem_classificacao public.lei_do_bem_classificacao,
  triagem_indice_aderencia numeric(4,2),   -- (Sim*2 + Parcialmente) / 24
  triagem_sintese text,
  triagem_proxima_acao text,
  triagem_atualizada_em timestamptz,

  -- === Gestão do processo de auditoria (tela "Lei do Bem", time de PD&I) ===
  status public.lei_do_bem_status not null default 'backlog',
  responsavel_auditoria_id uuid references public.profiles(id),
  parecer text,
  prioridade text check (prioridade in ('baixa', 'media', 'alta')),
  enviar_clickup boolean not null default false,
  clickup_sincronizado_em timestamptz,  -- nulo até a automação (2ª parte)

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (project_id)
);

comment on table public.lei_do_bem_avaliacoes is
  'Pré-análise de enquadramento na Lei do Bem (11.196/2005). 1:1 com projects. '
  'A classificação da triagem replica a planilha do time de PD&I e é apenas '
  'sinalização — nenhum resultado bloqueia o cadastro da iniciativa.';

comment on column public.lei_do_bem_avaliacoes.prioridade is
  'Escala própria da auditoria (baixa/media/alta). A Matriz de 4 Eixos saiu do '
  'cadastro geral, então não há mais escala compartilhada a reaproveitar — '
  'domínio a confirmar com o time (pergunta em aberto §10.2 do briefing).';

comment on column public.lei_do_bem_avaliacoes.clickup_sincronizado_em is
  'Fica nulo até existir a automação de envio (N8N/API do ClickUp — 2ª parte). '
  'Consultável: enviar_clickup = true AND clickup_sincronizado_em IS NULL = '
  '"pronta para envio".';

create index if not exists ldb_avaliacoes_status_idx
  on public.lei_do_bem_avaliacoes (status);
create index if not exists ldb_avaliacoes_classificacao_idx
  on public.lei_do_bem_avaliacoes (triagem_classificacao);
create index if not exists ldb_avaliacoes_responsavel_idx
  on public.lei_do_bem_avaliacoes (responsavel_auditoria_id);

drop trigger if exists ldb_avaliacoes_touch on public.lei_do_bem_avaliacoes;
create trigger ldb_avaliacoes_touch before update on public.lei_do_bem_avaliacoes
  for each row execute function public.touch_updated_at();


-- =============================================================================
-- 3. CLASSIFICAÇÃO AUTOMÁTICA — tradução 1:1 das fórmulas da planilha
--    (B27 Classificação, B28 Índice, B29 Síntese, B30 Próxima ação)
-- =============================================================================
-- Ordem de avaliação (a primeira condição que bater decide):
--   1. < 12 respostas                        → pendente (índice nulo)
--   2. alguma resposta "não sei"             → informacoes_insuficientes
--   3. bloqueio duro (3,4,5,6,9,10,11) "não" → baixo_potencial
--   4. índice = (sim*2 + parcialmente)/24:
--        >= 0,75 → potencialmente_elegivel · >= 0,5 → potencial_parcial
--        <  0,5  → baixo_potencial

create or replace function public.lei_do_bem_classificar()
returns trigger language plpgsql as $$
declare
  respostas public.lei_do_bem_resposta[];
  -- Itens de bloqueio duro (posições no array 1-based): 3,4,5,6,9,10,11.
  bloqueios constant int[] := array[3, 4, 5, 6, 9, 10, 11];
  -- Frases da síntese por item respondido "Não" (célula B29 da planilha,
  -- aba "Triagem Preliminar"), na ordem 1→12.
  frases_nao constant text[] := array[
    'Objetivo estratégico não evidenciado.',
    'Problema e público afetado não definidos.',
    'Não há desenvolvimento ou alteração relevante de produto, processo, sistema ou serviço.',
    'Novidade ou ganho técnico/tecnológico não evidenciado.',
    'Incerteza técnica não demonstrada.',
    'Ausência de hipóteses, testes, protótipos ou validações técnicas.',
    'Trabalho sem planejamento e documentação por etapas.',
    'Conhecimento gerado não reproduzível ou transferível.',
    'Desenvolvimento experimental não separável das atividades rotineiras.',
    'Desafios apontados não são técnicos/tecnológicos.',
    'O projeto aparenta limitar-se a solução pronta.',
    'Sem registros de atividades, horas, testes, decisões e gastos.'
  ];
  n_respondidas int := 0;
  n_sim int := 0;
  n_parcial int := 0;
  tem_nao_sei boolean := false;
  tem_bloqueio boolean := false;
  sintese text := '';
  i int;
begin
  respostas := array[
    new.triagem_01, new.triagem_02, new.triagem_03, new.triagem_04,
    new.triagem_05, new.triagem_06, new.triagem_07, new.triagem_08,
    new.triagem_09, new.triagem_10, new.triagem_11, new.triagem_12
  ];

  for i in 1..12 loop
    if respostas[i] is not null then
      n_respondidas := n_respondidas + 1;
      if respostas[i] = 'sim'          then n_sim := n_sim + 1; end if;
      if respostas[i] = 'parcialmente' then n_parcial := n_parcial + 1; end if;
      if respostas[i] = 'nao_sei'      then tem_nao_sei := true; end if;
      if respostas[i] = 'nao' and i = any (bloqueios) then
        tem_bloqueio := true;
      end if;
    end if;
  end loop;

  -- Índice de aderência: só existe com as 12 respondidas (B28 da planilha).
  -- "sim" vale 2, "parcialmente" vale 1, "não"/"não sei" valem 0; máximo 24.
  if n_respondidas < 12 then
    new.triagem_indice_aderencia := null;
  else
    new.triagem_indice_aderencia := round((n_sim * 2 + n_parcial)::numeric / 24, 2);
  end if;

  -- B27 — Classificação (ordem de avaliação acima).
  if n_respondidas < 12 then
    new.triagem_classificacao := 'pendente';
  elsif tem_nao_sei then
    new.triagem_classificacao := 'informacoes_insuficientes';
  elsif tem_bloqueio or new.triagem_indice_aderencia < 0.5 then
    new.triagem_classificacao := 'baixo_potencial';
  elsif new.triagem_indice_aderencia >= 0.75 then
    new.triagem_classificacao := 'potencialmente_elegivel';
  else
    new.triagem_classificacao := 'potencial_parcial';
  end if;

  -- B29 — Síntese automática.
  if new.triagem_classificacao = 'pendente' then
    new.triagem_sintese := 'Preencha todas as respostas para gerar a síntese.';
  elsif new.triagem_classificacao = 'informacoes_insuficientes' then
    new.triagem_sintese :=
      'Há respostas marcadas como Não sei. Esclareça esses itens antes de concluir a triagem.';
  elsif not exists (
    select 1 from unnest(respostas) r where r = 'nao'
  ) then
    new.triagem_sintese :=
      'As respostas não indicam bloqueios críticos. A elegibilidade final ainda depende de validação técnica, fiscal, contábil e documental.';
  else
    for i in 1..12 loop
      if respostas[i] = 'nao' then
        sintese := sintese || frases_nao[i] || ' ';
      end if;
    end loop;
    new.triagem_sintese := btrim(sintese);
  end if;

  -- B30 — Próxima ação.
  new.triagem_proxima_acao := case new.triagem_classificacao
    when 'pendente'
      then 'Responder os itens restantes.'
    when 'informacoes_insuficientes'
      then 'Esclarecer os itens marcados como Não sei.'
    when 'potencialmente_elegivel'
      then 'Encaminhar para análise técnica detalhada e validação fiscal/documental.'
    when 'potencial_parcial'
      then 'Revisar o escopo, separar atividades rotineiras e complementar evidências.'
    when 'baixo_potencial'
      then 'Reavaliar ou reformular o projeto, salvo se houver novas informações técnicas.'
  end;

  -- Marca o momento da triagem quando alguma resposta muda (ou no insert).
  if tg_op = 'INSERT' or (
    (new.triagem_01, new.triagem_02, new.triagem_03, new.triagem_04,
     new.triagem_05, new.triagem_06, new.triagem_07, new.triagem_08,
     new.triagem_09, new.triagem_10, new.triagem_11, new.triagem_12)
    is distinct from
    (old.triagem_01, old.triagem_02, old.triagem_03, old.triagem_04,
     old.triagem_05, old.triagem_06, old.triagem_07, old.triagem_08,
     old.triagem_09, old.triagem_10, old.triagem_11, old.triagem_12)
  ) then
    new.triagem_atualizada_em := now();
  end if;

  return new;
end $$;

drop trigger if exists ldb_avaliacoes_classificar on public.lei_do_bem_avaliacoes;
create trigger ldb_avaliacoes_classificar
  before insert or update on public.lei_do_bem_avaliacoes
  for each row execute function public.lei_do_bem_classificar();


-- =============================================================================
-- 4. GUARDA DE COLUNAS DE AUDITORIA
-- =============================================================================
-- RLS restringe LINHA, não COLUNA (mesma lacuna já tratada em profiles.role
-- pelo prevent_self_role_escalation). Quem cadastra a iniciativa pode editar
-- os blocos de cadastro/triagem; os campos do processo de auditoria (status,
-- responsável, parecer, prioridade, ClickUp) são exclusivos de gerencial+ —
-- o nível mapeado ao Líder de Programa/PMO, o mesmo que escreve em decisions.

create or replace function public.lei_do_bem_guard_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Escritas sem sessão (service role: import, futura automação do ClickUp)
  -- não passam pela guarda — RLS já não as restringe hoje.
  if auth.uid() is null then
    return new;
  end if;
  if not public.has_role_at_least('gerencial') then
    if tg_op = 'INSERT' then
      if new.status is distinct from 'backlog'
        or new.responsavel_auditoria_id is not null
        or new.parecer is not null
        or new.prioridade is not null
        or new.enviar_clickup
        or new.clickup_sincronizado_em is not null then
        raise exception 'Apenas papéis gerenciais editam os campos de auditoria da Lei do Bem.';
      end if;
    else
      if new.status is distinct from old.status
        or new.responsavel_auditoria_id is distinct from old.responsavel_auditoria_id
        or new.parecer is distinct from old.parecer
        or new.prioridade is distinct from old.prioridade
        or new.enviar_clickup is distinct from old.enviar_clickup
        or new.clickup_sincronizado_em is distinct from old.clickup_sincronizado_em then
        raise exception 'Apenas papéis gerenciais editam os campos de auditoria da Lei do Bem.';
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists ldb_avaliacoes_guard on public.lei_do_bem_avaliacoes;
create trigger ldb_avaliacoes_guard
  before insert or update on public.lei_do_bem_avaliacoes
  for each row execute function public.lei_do_bem_guard_auditoria();


-- =============================================================================
-- 5. HISTÓRICO DE MUDANÇA DE STATUS
-- =============================================================================
-- Mesmo espírito de decisions (created_by/created_at): cada transição de
-- status da auditoria fica logada para o painel de detalhe.

create table if not exists public.lei_do_bem_status_historico (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null
    references public.lei_do_bem_avaliacoes(id) on delete cascade,
  status_anterior public.lei_do_bem_status,
  status_novo public.lei_do_bem_status not null,
  alterado_por uuid references public.profiles(id) default auth.uid(),
  criado_em timestamptz not null default now()
);

create index if not exists ldb_historico_avaliacao_idx
  on public.lei_do_bem_status_historico (avaliacao_id, criado_em desc);

create or replace function public.lei_do_bem_log_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.lei_do_bem_status_historico (avaliacao_id, status_anterior, status_novo)
    values (new.id, null, new.status);
  elsif new.status is distinct from old.status then
    insert into public.lei_do_bem_status_historico (avaliacao_id, status_anterior, status_novo)
    values (new.id, old.status, new.status);
  end if;
  return new;
end $$;

drop trigger if exists ldb_avaliacoes_log_status on public.lei_do_bem_avaliacoes;
create trigger ldb_avaliacoes_log_status
  after insert or update on public.lei_do_bem_avaliacoes
  for each row execute function public.lei_do_bem_log_status();


-- =============================================================================
-- 6. REMOÇÃO DO GATE DA MATRIZ DE PRIORIZAÇÃO
-- =============================================================================
-- A Matriz de 4 Eixos saiu do cadastro de iniciativa (não é mais parte do
-- fluxo). Com o formulário sem os eixos, o gate de §9.1 (score >= 3,0 para
-- Em Desenvolvimento) bloquearia TODA iniciativa nova de entrar em
-- desenvolvimento. As colunas score_* permanecem como dado histórico e o
-- dashboard continua exibindo o score de quem já foi pontuado.

drop trigger if exists projects_stage_gate on public.projects;
drop function if exists public.enforce_stage_gate();


-- =============================================================================
-- 7. VIEW DA ABA "LEI DO BEM"
-- =============================================================================
-- Uma linha por avaliação, com o contexto da iniciativa original que a lista,
-- o kanban e os big numbers precisam — sem N+1 no cliente.

create or replace view public.v_lei_do_bem as
select
  av.id,
  av.project_id,
  p.title,
  p.stage,
  a.name  as area_name,
  p.directorate,
  p.owner_id,
  own.full_name as owner_name,
  p.created_at  as project_created_at,

  av.objetivo_estrategico_okr, av.contexto_problema,
  av.o_que_sera_desenvolvido, av.resultados_esperados,
  av.como_sera_desenvolvido, av.fora_do_escopo, av.desafios_riscos,

  av.descricao_projeto, av.elemento_tecnologico_novo,
  av.barreira_desafio_tecnologico, av.metodologia_metodos,
  av.descritivo_complementar,

  av.triagem_01, av.triagem_02, av.triagem_03, av.triagem_04,
  av.triagem_05, av.triagem_06, av.triagem_07, av.triagem_08,
  av.triagem_09, av.triagem_10, av.triagem_11, av.triagem_12,
  av.triagem_classificacao, av.triagem_indice_aderencia,
  av.triagem_sintese, av.triagem_proxima_acao, av.triagem_atualizada_em,

  av.status,
  av.responsavel_auditoria_id,
  resp.full_name as responsavel_auditoria_nome,
  av.parecer,
  av.prioridade,
  av.enviar_clickup,
  av.clickup_sincronizado_em,
  av.created_at,
  av.updated_at
from public.lei_do_bem_avaliacoes av
join public.projects p        on p.id = av.project_id
left join public.areas a      on a.id = p.area_id
left join public.profiles own on own.id = p.owner_id
left join public.profiles resp on resp.id = av.responsavel_auditoria_id
where p.archived_at is null;

comment on view public.v_lei_do_bem is
  'Aba Lei do Bem: avaliações com contexto da iniciativa. Duas dimensões '
  'distintas: status (estágio da auditoria, manual) e triagem_classificacao '
  '(resultado automático do questionário).';


-- =============================================================================
-- 8. RLS
-- =============================================================================
-- Leitura para todos os autenticados (transparência do processo — crença 6
-- do Manifesto). Escrita de linha: dono da iniciativa ou gerencial+; as
-- colunas de auditoria têm a guarda adicional da seção 4.

alter table public.lei_do_bem_avaliacoes    enable row level security;
alter table public.lei_do_bem_status_historico enable row level security;

drop policy if exists ldb_avaliacoes_read on public.lei_do_bem_avaliacoes;
create policy ldb_avaliacoes_read on public.lei_do_bem_avaliacoes
  for select to authenticated using (true);

-- Mesmo limiar do projects_insert (0009): participante+ cadastra.
drop policy if exists ldb_avaliacoes_insert on public.lei_do_bem_avaliacoes;
create policy ldb_avaliacoes_insert on public.lei_do_bem_avaliacoes
  for insert to authenticated
  with check (
    public.has_role_at_least('participante')
    and exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.has_role_at_least('gerencial'))
    )
  );

-- Dono edita os blocos de cadastro/triagem da própria iniciativa;
-- gerencial+ edita qualquer avaliação (inclusive os campos de auditoria,
-- liberados pela guarda da seção 4).
drop policy if exists ldb_avaliacoes_update on public.lei_do_bem_avaliacoes;
create policy ldb_avaliacoes_update on public.lei_do_bem_avaliacoes
  for update to authenticated
  using (
    public.has_role_at_least('gerencial')
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    public.has_role_at_least('gerencial')
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists ldb_historico_read on public.lei_do_bem_status_historico;
create policy ldb_historico_read on public.lei_do_bem_status_historico
  for select to authenticated using (true);

-- Escrita no histórico só pelo trigger (security definer). Nenhuma policy
-- de INSERT direto: o log não é editável pela aplicação.
