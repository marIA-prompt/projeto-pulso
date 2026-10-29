-- =============================================================================
-- Proprietário e métricas das 41 iniciativas em Atenção que constam no
-- comitê de IA (planilha de tasks).
--
-- Cada iniciativa é localizada pelo título (acentos e pontuação ignorados).
-- "Automatizar as operações de crédito consignado" existe em duas áreas;
-- essa carga pega a da área de Riscos.
--
-- O usuário da planilha vira owner_id quando existe um único perfil com
-- esse nome. Horas economizadas por mês, redução de custo, tempo de
-- desenvolvimento, uso de IA, n8n e demais ferramentas entram quando a
-- planilha traz o valor. Célula vazia não apaga o que já está gravado.
--
-- A redução de custo da planilha vai para cost_saved_month. Há dois
-- valores numéricos: R$ 5.000,00 (personagens digitais) e R$ 1.800
-- (credenciamento). O acompanhamento anual multiplica por 12.
--
-- A carga não reabre o semáforo nem reescreve updated_at. Idempotente
-- para os campos gravados. Se algum título não existir, ou existir mais
-- de uma vez, nada é gravado.
-- =============================================================================

do $$
declare
  faltando text;
  atualizadas int;
  avisos text := '';
begin
  execute $fn$
    create or replace function public.pulso_norm_txt(t text)
    returns text
    language sql
    immutable
    as $body$
      select btrim(regexp_replace(
        translate(
          lower(coalesce(t, '')),
          'áàâãäéèêëíìîïóòôõöúùûüçñ',
          'aaaaaeeeeiiiiooooouuuucn'
        ),
        '[^a-z0-9]+', ' ', 'g'
      ));
    $body$
  $fn$;

  begin
    alter table public.projects disable trigger projects_touch;
  exception when undefined_object then null;
  end;
  begin
    alter table public.projects disable trigger projects_bump_activity;
  exception when undefined_object then null;
  end;

  create temporary table carga_comite (
    titulo text primary key,
    area_trecho text,
    donos text[] not null,
    hours_saved_month numeric,
    cost_saved_month numeric,
    dev_hours numeric,
    informa_horas boolean not null,
    informa_custo boolean not null,
    informa_dev boolean not null,
    uses_ai_tradicional boolean not null,
    uses_ai_generativa boolean not null,
    informa_ferramentas boolean not null,
    uses_n8n boolean not null,
    uses_outros boolean not null,
    tool_tags text[] not null,
    tools text
  ) on commit drop;

  insert into carga_comite (
    titulo, area_trecho, donos, hours_saved_month, cost_saved_month, dev_hours,
    informa_horas, informa_custo, informa_dev,
    uses_ai_tradicional, uses_ai_generativa,
    informa_ferramentas, uses_n8n, uses_outros, tool_tags, tools
  ) values
('Automatizar geração e envio automatizado de relatórios de posição de clientes', null, array['Welton Fernandes'], 3.00, null, 15.00, true, false, true, false, false, true, false, true, array['Python'], 'Python'),
('Automatizar o envio de processo fechamento', null, array['Jessica'], 8.00, null, null, true, false, false, false, false, true, false, true, array['Python', 'Totvs'], 'Python, Totvs'),
('Automatizar o envio do controle de banco de horas', null, array['Jessica'], 8.00, 0.00, null, true, true, false, false, false, true, false, true, array['Python', 'Totvs'], 'Python, Totvs'),
('Centralizar o canal de dúvidas dos colaboradores via robô no Bitrix (RH)', null, array['Jessica'], null, null, null, false, false, false, false, true, true, false, true, array['ChatGPT', 'Bitrix', 'Python'], 'ChatGPT, Bitrix, Python'),
('Automatizar a provisão de risco de crédito', null, array['Gabriel Caetano'], null, null, null, false, false, false, false, false, true, false, true, array['Python'], 'Python'),
('Automatizar a validação da análise documental de clientes PJ', null, array['Guilherme Vinicius'], null, null, null, false, false, false, false, false, true, false, true, array['Python'], 'Python'),
('Automatizar as validações de compliance', null, array['Patrícia Reis'], null, null, null, false, false, false, false, false, true, false, true, array['Sales Force'], 'Sales Force'),
('Automatizar a aprovação por alçada', null, array['Patrícia Reis'], null, null, null, false, false, false, false, false, true, false, true, array['Sales Force'], 'Sales Force'),
('Automatizar a geração e assinatura de contratos', null, array['Patrícia Reis'], null, null, null, false, false, false, false, false, true, false, true, array['Sales Force'], 'Sales Force'),
('Automatizar o envio da geração e assinatura de contratos', null, array['Patrícia Reis'], null, null, null, false, false, false, false, false, true, false, true, array['Sales Force', 'Clicksign'], 'Sales Force, Clicksign'),
('Automatizar atualização de BI internos da área', null, array['Gabriel Caetano'], null, null, null, false, false, false, false, false, true, false, true, array['Python', 'SQL', 'Power BI'], 'Python, SQL, Power BI'),
('Monitorar automaticamente os indicadores de risco', null, array['Gabriel Caetano'], null, null, null, false, false, false, false, false, true, false, true, array['Python', 'SQL'], 'Python, SQL'),
('Automatizar a análise consultiva de risco de crédito', null, array['Gabriel Caetano'], null, null, null, false, false, false, false, true, false, false, false, array[]::text[], null),
('Automatizar as operações de crédito consignado', 'riscos', array['Gabriel Caetano'], null, null, null, false, false, false, false, true, false, false, false, array[]::text[], null),
('Centralizar em painel gerencial os acessos encurtados via Bitly', null, array['Anderson Chagas'], 3.00, null, 8.00, true, false, true, false, true, true, false, true, array['ChatGPT', 'VS Code', 'Power BI'], 'ChatGPT, VS Code, Power BI'),
('Automatizar a identidade visual da marca', null, array['Thaiany Arruda'], null, null, 12.00, false, false, true, false, true, true, false, true, array['ChatGPT', 'Manus', 'Stitch'], 'ChatGPT, Manus, Stitch'),
('Automatizar a geração dos mockups de produtos', null, array['Guilherme Angeolete Paschoaloto'], 7.50, null, 2.00, true, false, true, false, true, true, false, true, array['ChatGPT', 'VS Code', 'Python'], 'ChatGPT, VS Code, Python'),
('Automatizar a produção de personagens digitais', null, array['Adilson Carlos Veiga'], 6.00, 5000.00, 8.00, true, true, true, false, true, true, false, false, array['ChatGPT', 'Dzine', 'KlingAI'], 'ChatGPT, Dzine, KlingAI'),
('Automatizar as campanhas para lojistas', null, array['Michelle Santana'], 9.00, null, 10.00, true, false, true, false, true, true, false, true, array['ChatGPT', 'VS Code', 'ClickUp', 'Python'], 'ChatGPT, VS Code, ClickUp, Python'),
('Automatizar a conciliação de comissões diversas', null, array['Tania Tamanini', 'Vanessa Santos', 'Icaro Souza'], null, null, null, false, false, false, false, true, true, true, true, array['SQL', 'Python'], 'SQL, Python'),
('Automatizar a conferência de extratos bancários', null, array['Marcos Marchioro'], null, null, null, false, false, false, false, true, true, true, true, array['SQL', 'Python'], 'SQL, Python'),
('Melhorar a qualidade dos dados contábeis enviados ao BACEN', null, array['Marcos Marchioro'], null, null, null, false, false, false, false, true, true, true, true, array['SQL', 'Python'], 'SQL, Python'),
('Automatizar o envio do disparo de mensagens via WhatsApp', null, array['Fábio Henrique Teodoro da Silva'], null, null, null, false, false, false, false, true, true, false, true, array['Gemini', 'Perplexity', 'Antigravity (Python)'], 'Gemini, Perplexity, Antigravity (Python)'),
('Automatizar o envio de boletos aos clientes', null, array['Guilherme Vinicius'], 1.50, null, null, true, false, false, false, false, true, false, true, array['VS Code', 'Python'], 'VS Code, Python'),
('Automatizar os prazos judiciais', null, array['Lilian Roel Murat'], null, null, null, false, false, false, false, false, true, true, false, array[]::text[], 'n8n'),
('Automatizar o envio da gestão da frota de veículos', null, array['Lissandra'], 3.00, null, null, true, false, false, false, true, true, true, true, array['ChatGPT', 'Gemini', 'VS Code', 'Python'], 'ChatGPT, Gemini, VS Code, Python'),
('Monitorar automaticamente as operações do Senff Shopping', null, array['Carolline Fernandes'], null, null, null, false, false, false, false, true, true, false, true, array['Copilot', 'VS Code', 'Python', 'GitHub'], 'Copilot, VS Code, Python, GitHub'),
('Automatizar a consulta do processo de CTE', null, array['Carolline Fernandes'], null, null, null, false, false, false, false, true, true, false, true, array['Copilot', 'VS Code', 'Python', 'GitHub'], 'Copilot, VS Code, Python, GitHub'),
('Monitorar automaticamente o tratamento de reclamações', null, array['Carolline Fernandes'], null, null, null, false, false, false, true, false, true, false, true, array['GitHub', 'Java'], 'GitHub, Java'),
('Monitorar automaticamente as ligações registradas na URA', null, array['Christian Lourenço'], null, null, 20.00, false, false, true, false, true, true, false, true, array['Copilot', 'VS Code', 'Python', 'GitHub'], 'Copilot, VS Code, Python, GitHub'),
('Centralizar em painel gerencial o spread das operações', null, array['Jeane Correia'], 0.00, null, 12.00, true, false, true, false, false, true, false, true, array['Power BI'], 'Power BI'),
('Centralizar em painel gerencial a captação de recursos', null, array['Jeane Correia'], 0.00, null, 12.00, true, false, true, false, false, true, false, true, array['Power BI'], 'Power BI'),
('Centralizar em painel gerencial a parceria com o Paraná Banco', null, array['Jeane Correia'], 0.00, null, 12.00, true, false, true, false, false, true, false, true, array['Power BI'], 'Power BI'),
('Centralizar em painel gerencial a carteira em runoff', null, array['Jeane Correia'], 0.00, null, 12.00, true, false, true, false, false, true, false, true, array['Power BI'], 'Power BI'),
('Centralizar em painel gerencial as comissões', null, array['Jeane Correia'], 0.00, null, 12.00, true, false, true, false, false, true, false, true, array['Power BI'], 'Power BI'),
('Análise Transacional', null, array['Alan Gabriel Moreira'], null, null, 80.00, false, false, true, true, true, true, false, true, array['Gpt Codex', 'Python', 'SQL', 'ML flow'], 'Gpt Codex, Python, SQL, ML flow'),
('Agilizar o desbloqueio de lojas', null, array['Clayton Humamoto'], 40.00, null, 20.00, true, false, true, false, true, true, true, false, array['Gemini 2.5 flash'], 'Gemini 2.5 flash'),
('Automatizar o cadastro do credenciamento de lojistas', null, array['Eder Melo'], 20.00, 1800.00, 12.00, true, true, true, false, true, true, false, true, array['Chat Gpt', 'Deepseek', 'Bitrix24', 'BrasilAPI', 'Google Maps API', 'ViaCEP'], 'Chat Gpt, Deepseek, Bitrix24, BrasilAPI, Google Maps API, ViaCEP'),
('Automatizar a integração e engajamento de novos colaboradores', null, array['Gabriel Benato'], 3.00, null, 20.00, true, false, true, false, true, true, true, false, array['Gemini'], 'Gemini'),
('Monitorar automaticamente a atualização cadastral', null, array['Solange Dutra', 'João Marcelo Souza'], null, null, null, false, false, false, false, false, true, false, true, array['SQL', 'Python'], 'SQL, Python'),
('Automatizar a consulta dos processos jurídicos', null, array['João Victor Sezanosky Dalla Valle'], 160.00, null, null, true, false, false, false, true, true, false, true, array['OpenAI(GPT)', 'Python', 'Bitrix'], 'OpenAI(GPT), Python, Bitrix');

  create temporary table alvo_comite on commit drop as
  select c.titulo, m.id as project_id
  from carga_comite c
  join lateral (
    select p.id
    from public.projects p
    left join public.areas a on a.id = p.area_id
    where p.archived_at is null
      and public.pulso_norm_txt(p.title) = public.pulso_norm_txt(c.titulo)
      and (
        c.area_trecho is null
        or public.pulso_norm_txt(coalesce(a.name, '')) like '%' || public.pulso_norm_txt(c.area_trecho) || '%'
      )
  ) m on true;

  select string_agg(msg, '; ' order by msg)
  into faltando
  from (
    select case
      when count(a.project_id) = 0 and c.area_trecho is null then
        format('sem iniciativa com o título "%s"', c.titulo)
      when count(a.project_id) = 0 then
        format('sem iniciativa com o título "%s" na área "%s"', c.titulo, c.area_trecho)
      else
        format('título "%s" encontrou %s iniciativas', c.titulo, count(a.project_id))
    end as msg
    from carga_comite c
    left join alvo_comite a on a.titulo = c.titulo
    group by c.titulo, c.area_trecho
    having count(a.project_id) <> 1
  ) s;

  if faltando is not null then
    raise exception 'Nada foi gravado. %', faltando;
  end if;

  create temporary table dono_comite on commit drop as
  with pares as (
    select
      a.project_id,
      d.ord,
      d.nome,
      (
        select array_agg(pr.id order by pr.full_name)
        from public.profiles pr
        where nullif(btrim(pr.full_name), '') is not null
          and (
            public.pulso_norm_txt(pr.full_name) = public.pulso_norm_txt(d.nome)
            or public.pulso_norm_txt(pr.full_name) like public.pulso_norm_txt(d.nome) || ' %'
            or (
              public.pulso_norm_txt(d.nome) like '% %'
              and public.pulso_norm_txt(d.nome) like public.pulso_norm_txt(pr.full_name) || ' %'
            )
          )
      ) as ids
    from carga_comite c
    join alvo_comite a on a.titulo = c.titulo
    cross join lateral unnest(c.donos) with ordinality as d(nome, ord)
  ),
  unicos as (
    select project_id, ord, nome, ids[1] as profile_id
    from pares
    where ids is not null and cardinality(ids) = 1
  )
  select distinct on (project_id) project_id, profile_id, nome
  from unicos
  order by project_id, ord;

  select coalesce(string_agg(msg, '; ' order by msg), '')
  into avisos
  from (
    select format(
      '%s: nenhum perfil único para %s',
      c.titulo,
      array_to_string(c.donos, ' / ')
    ) as msg
    from carga_comite c
    join alvo_comite a on a.titulo = c.titulo
    left join dono_comite d on d.project_id = a.project_id
    where d.project_id is null
  ) s;

  update public.projects p
  set
    owner_id = coalesce(d.profile_id, p.owner_id),
    hours_saved_month = case when c.informa_horas then c.hours_saved_month else p.hours_saved_month end,
    cost_saved_month = case when c.informa_custo then c.cost_saved_month else p.cost_saved_month end,
    dev_hours = case when c.informa_dev then c.dev_hours else p.dev_hours end,
    uses_ai_tradicional = c.uses_ai_tradicional,
    uses_ai_generativa = c.uses_ai_generativa,
    uses_ai = c.uses_ai_tradicional or c.uses_ai_generativa,
    uses_n8n = case when c.informa_ferramentas then c.uses_n8n else p.uses_n8n end,
    uses_outros = case when c.informa_ferramentas then c.uses_outros else p.uses_outros end,
    tool_tags = case when c.informa_ferramentas then c.tool_tags else p.tool_tags end,
    tools = case when c.informa_ferramentas then c.tools else p.tools end
  from carga_comite c
  join alvo_comite a on a.titulo = c.titulo
  left join dono_comite d on d.project_id = a.project_id
  where p.id = a.project_id;

  get diagnostics atualizadas = row_count;
  if atualizadas <> 41 then
    raise exception 'A carga alterou % iniciativas; o esperado é 41.', atualizadas;
  end if;

  if avisos <> '' then
    raise warning 'Métricas gravadas. Proprietário mantido onde o nome da planilha não achou um perfil único: %', avisos;
  end if;

  execute 'drop function if exists public.pulso_norm_txt(text)';

  begin
    alter table public.projects enable trigger projects_touch;
  exception when undefined_object then null;
  end;
  begin
    alter table public.projects enable trigger projects_bump_activity;
  exception when undefined_object then null;
  end;
exception
  when others then
    begin
      alter table public.projects enable trigger projects_touch;
    exception when undefined_object then null;
    end;
    begin
      alter table public.projects enable trigger projects_bump_activity;
    exception when undefined_object then null;
    end;
    raise;
end $$;
