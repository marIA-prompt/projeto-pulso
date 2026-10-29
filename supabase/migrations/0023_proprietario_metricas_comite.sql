-- =============================================================================
-- Proprietário e métricas das 41 iniciativas em Atenção que constam no
-- comitê de IA (planilha de tasks).
--
-- Casa cada iniciativa pelo id e por um trecho do título. O usuário da
-- planilha vira owner_id quando existe um único perfil com esse nome.
-- Horas economizadas por mês, redução de custo, tempo de desenvolvimento,
-- uso de IA, n8n e demais ferramentas entram quando a planilha traz o valor.
-- Célula vazia não apaga o que já está gravado.
--
-- A redução de custo da planilha vai para cost_saved_month (economia
-- recorrente). Há dois valores numéricos: R$ 5.000,00 (personagens digitais)
-- e R$ 1.800 (credenciamento). O acompanhamento anual multiplica por 12.
--
-- A carga não reabre o semáforo nem reescreve updated_at. Idempotente para
-- os campos gravados.
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
    id uuid primary key,
    fragmento text not null,
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
    id, fragmento, donos, hours_saved_month, cost_saved_month, dev_hours,
    informa_horas, informa_custo, informa_dev,
    uses_ai_tradicional, uses_ai_generativa,
    informa_ferramentas, uses_n8n, uses_outros, tool_tags, tools
  ) values
('06178a3f-8476-492f-8bf1-82e7870878fa'::uuid, 'relatorios de posicao de clientes', array['Welton Fernandes'], 3.00, null, 15.00, true, false, true, false, false, true, false, true, array['Python'], 'Python'),
('c369a820-960b-409d-bb39-500317fb5674'::uuid, 'processo fechamento', array['Jessica'], 8.00, null, null, true, false, false, false, false, true, false, true, array['Python', 'Totvs'], 'Python, Totvs'),
('4c947ca7-3ffd-4eb8-8b69-dac690c6c4f8'::uuid, 'banco de horas', array['Jessica'], 8.00, 0.00, null, true, true, false, false, false, true, false, true, array['Python', 'Totvs'], 'Python, Totvs'),
('171b12bc-6c9d-4de9-ae68-21b07855739f'::uuid, 'bitrix', array['Jessica'], null, null, null, false, false, false, false, true, true, false, true, array['ChatGPT', 'Bitrix', 'Python'], 'ChatGPT, Bitrix, Python'),
('84b8cf0d-a57e-4338-84de-f7557837e1cd'::uuid, 'provisao de risco de credito', array['Gabriel Caetano'], null, null, null, false, false, false, false, false, true, false, true, array['Python'], 'Python'),
('d317167d-5459-4bcc-b7a0-55a7f39be8dd'::uuid, 'analise documental de clientes', array['Guilherme Vinicius'], null, null, null, false, false, false, false, false, true, false, true, array['Python'], 'Python'),
('24164d60-6ec5-4a50-8d82-366f152e1b16'::uuid, 'validacoes de compliance', array['Patrícia Reis'], null, null, null, false, false, false, false, false, true, false, true, array['Sales Force'], 'Sales Force'),
('fb4af37d-53e9-4aa5-a9eb-f1c3ec273fc6'::uuid, 'aprovacao por alcada', array['Patrícia Reis'], null, null, null, false, false, false, false, false, true, false, true, array['Sales Force'], 'Sales Force'),
('5ae150b3-d149-4c83-bf44-4299cec60a9a'::uuid, 'geracao e assinatura de contratos', array['Patrícia Reis'], null, null, null, false, false, false, false, false, true, false, true, array['Sales Force'], 'Sales Force'),
('3485be21-7dbe-4a21-bc75-f2e4cc4e1edb'::uuid, 'envio da geracao e assinatura', array['Patrícia Reis'], null, null, null, false, false, false, false, false, true, false, true, array['Sales Force', 'Clicksign'], 'Sales Force, Clicksign'),
('4667b6f0-b5cd-475d-86ed-cb7545cd9622'::uuid, 'bi internos', array['Gabriel Caetano'], null, null, null, false, false, false, false, false, true, false, true, array['Python', 'SQL', 'Power BI'], 'Python, SQL, Power BI'),
('a1b82dde-2264-4381-bb7e-c44064dab766'::uuid, 'monitorar automaticamente os indicadores de risco', array['Gabriel Caetano'], null, null, null, false, false, false, false, false, true, false, true, array['Python', 'SQL'], 'Python, SQL'),
('233b7fa3-d9ac-4607-9139-d49a8df7e2cd'::uuid, 'analise consultiva', array['Gabriel Caetano'], null, null, null, false, false, false, false, true, false, false, false, array[]::text[], null),
('db453166-00ff-4ac7-9d1d-295df7fe12cf'::uuid, 'operacoes de credito consignado', array['Gabriel Caetano'], null, null, null, false, false, false, false, true, false, false, false, array[]::text[], null),
('295c8000-7b33-440e-a248-c9c8b94b5489'::uuid, 'bitly', array['Anderson Chagas'], 3.00, null, 8.00, true, false, true, false, true, true, false, true, array['ChatGPT', 'VS Code', 'Power BI'], 'ChatGPT, VS Code, Power BI'),
('beaff018-2363-4143-8ac8-0d2ea6e04b6c'::uuid, 'identidade visual', array['Thaiany Arruda'], null, null, 12.00, false, false, true, false, true, true, false, true, array['ChatGPT', 'Manus', 'Stitch'], 'ChatGPT, Manus, Stitch'),
('0674c586-d9d1-4177-9a88-0ae2b6fd75c7'::uuid, 'mockups', array['Guilherme Angeolete Paschoaloto'], 7.50, null, 2.00, true, false, true, false, true, true, false, true, array['ChatGPT', 'VS Code', 'Python'], 'ChatGPT, VS Code, Python'),
('887079ee-7e96-4f03-bf06-04f441fcf8cb'::uuid, 'personagens digitais', array['Adilson Carlos Veiga'], 6.00, 5000.00, 8.00, true, true, true, false, true, true, false, false, array['ChatGPT', 'Dzine', 'KlingAI'], 'ChatGPT, Dzine, KlingAI'),
('406121e6-e9a2-4204-b9f0-ef4babd59b10'::uuid, 'campanhas para lojistas', array['Michelle Santana'], 9.00, null, 10.00, true, false, true, false, true, true, false, true, array['ChatGPT', 'VS Code', 'ClickUp', 'Python'], 'ChatGPT, VS Code, ClickUp, Python'),
('caf937d1-30f3-4dd2-9eef-851710b77f52'::uuid, 'comissoes diversas', array['Tania Tamanini', 'Vanessa Santos', 'Icaro Souza'], null, null, null, false, false, false, false, true, true, true, true, array['SQL', 'Python'], 'SQL, Python'),
('1f641939-1f11-4973-ad3f-36b8d072dc91'::uuid, 'extratos bancarios', array['Marcos Marchioro'], null, null, null, false, false, false, false, true, true, true, true, array['SQL', 'Python'], 'SQL, Python'),
('f4eea143-8d1e-472d-9eb6-1fe4aea6dfed'::uuid, 'enviados ao bacen', array['Marcos Marchioro'], null, null, null, false, false, false, false, true, true, true, true, array['SQL', 'Python'], 'SQL, Python'),
('57c77778-76b8-47b4-8457-4985ef901509'::uuid, 'whatsapp', array['Fábio Henrique Teodoro da Silva'], null, null, null, false, false, false, false, true, true, false, true, array['Gemini', 'Perplexity', 'Antigravity (Python)'], 'Gemini, Perplexity, Antigravity (Python)'),
('064114fc-def0-4ac5-8b73-f15b8e0ae59b'::uuid, 'boletos', array['Guilherme Vinicius'], 1.50, null, null, true, false, false, false, false, true, false, true, array['VS Code', 'Python'], 'VS Code, Python'),
('7a06d38a-1437-47cf-9771-c35fe5b01365'::uuid, 'prazos judiciais', array['Lilian Roel Murat'], null, null, null, false, false, false, false, false, true, true, false, array[]::text[], 'n8n'),
('65592ed8-9663-4ca2-8d44-d25345138a46'::uuid, 'frota de veiculos', array['Lissandra'], 3.00, null, null, true, false, false, false, true, true, true, true, array['ChatGPT', 'Gemini', 'VS Code', 'Python'], 'ChatGPT, Gemini, VS Code, Python'),
('61eac443-1a3f-4d3a-9701-6ec29b5a62f4'::uuid, 'senff shopping', array['Carolline Fernandes'], null, null, null, false, false, false, false, true, true, false, true, array['Copilot', 'VS Code', 'Python', 'GitHub'], 'Copilot, VS Code, Python, GitHub'),
('65ef9306-1649-41eb-b389-8e5c7ecf3007'::uuid, 'consulta do processo de cte', array['Carolline Fernandes'], null, null, null, false, false, false, false, true, true, false, true, array['Copilot', 'VS Code', 'Python', 'GitHub'], 'Copilot, VS Code, Python, GitHub'),
('3d79bb58-137c-4240-8313-55b35aced6ab'::uuid, 'tratamento de reclamacoes', array['Carolline Fernandes'], null, null, null, false, false, false, true, false, true, false, true, array['GitHub', 'Java'], 'GitHub, Java'),
('68c3dc77-2f01-4af7-bf1d-0ab1064d8739'::uuid, 'ligacoes registradas na ura', array['Christian Lourenço'], null, null, 20.00, false, false, true, false, true, true, false, true, array['Copilot', 'VS Code', 'Python', 'GitHub'], 'Copilot, VS Code, Python, GitHub'),
('f24fff31-566b-4305-8ad9-32bce15ad819'::uuid, 'spread das operacoes', array['Jeane Correia'], 0.00, null, 12.00, true, false, true, false, false, true, false, true, array['Power BI'], 'Power BI'),
('ea777748-6062-4273-94d0-844cc2d00483'::uuid, 'captacao de recursos', array['Jeane Correia'], 0.00, null, 12.00, true, false, true, false, false, true, false, true, array['Power BI'], 'Power BI'),
('4c1b1b30-9879-46dc-a788-50fe8d90703c'::uuid, 'parana banco', array['Jeane Correia'], 0.00, null, 12.00, true, false, true, false, false, true, false, true, array['Power BI'], 'Power BI'),
('5121a64a-1f50-4667-bba3-c1ded336d2c8'::uuid, 'runoff', array['Jeane Correia'], 0.00, null, 12.00, true, false, true, false, false, true, false, true, array['Power BI'], 'Power BI'),
('d9c32a56-ec88-4f12-87ae-89f06de59360'::uuid, 'painel gerencial as comissoes', array['Jeane Correia'], 0.00, null, 12.00, true, false, true, false, false, true, false, true, array['Power BI'], 'Power BI'),
('338993f6-75aa-4d6f-92d2-d003c41642f7'::uuid, 'analise transacional', array['Alan Gabriel Moreira'], null, null, 80.00, false, false, true, true, true, true, false, true, array['Gpt Codex', 'Python', 'SQL', 'ML flow'], 'Gpt Codex, Python, SQL, ML flow'),
('54947702-1d44-4cbc-8993-5a63416e994f'::uuid, 'desbloqueio de lojas', array['Clayton Humamoto'], 40.00, null, 20.00, true, false, true, false, true, true, true, false, array['Gemini 2.5 flash'], 'Gemini 2.5 flash'),
('08129631-4371-4176-9400-b81afd5ca56f'::uuid, 'credenciamento de lojistas', array['Eder Melo'], 20.00, 1800.00, 12.00, true, true, true, false, true, true, false, true, array['Chat Gpt', 'Deepseek', 'Bitrix24', 'BrasilAPI', 'Google Maps API', 'ViaCEP'], 'Chat Gpt, Deepseek, Bitrix24, BrasilAPI, Google Maps API, ViaCEP'),
('251cbc8d-93f1-473b-b90b-3afa15c37bbb'::uuid, 'integracao e engajamento', array['Gabriel Benato'], 3.00, null, 20.00, true, false, true, false, true, true, true, false, array['Gemini'], 'Gemini'),
('8d23d4b8-a6a7-4ff8-b524-168be2872adc'::uuid, 'monitorar automaticamente a atualizacao cadastral', array['Solange Dutra', 'João Marcelo Souza'], null, null, null, false, false, false, false, false, true, false, true, array['SQL', 'Python'], 'SQL, Python'),
('c6400c06-4710-4360-b0a0-5e0f9d920ce0'::uuid, 'processos juridicos', array['João Victor Sezanosky Dalla Valle'], 160.00, null, null, true, false, false, false, true, true, false, true, array['OpenAI(GPT)', 'Python', 'Bitrix'], 'OpenAI(GPT), Python, Bitrix');

  select string_agg(
    c.id::text || ' (trecho "' || c.fragmento || '"'
    || coalesce(', título atual: ' || p.title, ', id inexistente')
    || ')',
    '; ' order by c.fragmento
  )
  into faltando
  from carga_comite c
  left join public.projects p on p.id = c.id
  where p.id is null
     or public.pulso_norm_txt(p.title) not like '%' || c.fragmento || '%';

  if faltando is not null then
    raise exception 'Nem todas as 41 iniciativas foram encontradas: %', faltando;
  end if;

  create temporary table dono_comite on commit drop as
  with pares as (
    select
      c.id as project_id,
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
      c.fragmento,
      array_to_string(c.donos, ' / ')
    ) as msg
    from carga_comite c
    left join dono_comite d on d.project_id = c.id
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
  left join dono_comite d on d.project_id = c.id
  where p.id = c.id
    and public.pulso_norm_txt(p.title) like '%' || c.fragmento || '%';

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
