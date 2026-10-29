-- Equivalência das áreas legadas com a diretoria e o e-mail de cada diretor.
-- Roda depois da 0018: troca vínculos que a diretoria corrigiu
-- (Comercial PF e Private Label saem das coleções anteriores).

update public.areas a
set diretoria_id = d.id
from (
  values
    ('Comercial PF', 'adquirencia-marketplace'),
    ('Fraudes', 'tecnologia-informacao'),
    ('Crédito PF', 'credito-cobranca'),
    ('Credenciamento', 'adquirencia-marketplace'),
    ('Jurídico', 'recursos-humanos'),
    ('Compras, Manutenção e Zeladoria', 'recursos-humanos'),
    ('Private Label', 'vendas-varejo-expansao'),
    ('DHO', 'recursos-humanos'),
    ('RH', 'recursos-humanos'),
    ('Cobrança', 'credito-cobranca'),
    ('Seguros', 'seguros'),
    ('Pós Vendas - Private Label', 'pos-vendas-private-label'),
    ('Departamento Controladoria - Riscos', 'controladoria'),
    ('Produtos Financeiros', 'tesouraria-captacao'),
    ('Comercial PJ', 'comercial-pj'),
    ('Financeiro / Contas a Receber', 'controladoria'),
    ('Atendimento', 'operacoes-atendimento'),
    ('Departamento Controladoria - Controladoria', 'controladoria'),
    ('Operações', 'operacoes-atendimento'),
    ('Consignado', 'consignado'),
    ('Crédito PJ', 'credito-cobranca'),
    ('Portfólio Projetos Estratégicos', 'tecnologia-informacao'),
    ('Financeiro - Tesouraria', 'tesouraria-captacao'),
    ('Departamento Controladoria - Carteiras e Regulatórios', 'controladoria'),
    ('Banco PJ', 'comercial-pj'),
    ('Frota', 'recursos-humanos'),
    ('TI', 'tecnologia-informacao'),
    ('Departamento Controladoria - Fiscal', 'controladoria'),
    ('Marketplace', 'adquirencia-marketplace'),
    ('Marketing', 'adquirencia-marketplace'),
    ('Departamento Controladoria - Contabilidade', 'controladoria'),
    ('Compliance', 'recursos-humanos')
) as mapa(area_nome, slug)
join public.diretorias d on d.slug = mapa.slug
where a.name = mapa.area_nome;

-- Texto livre da iniciativa (projects.directorate) cai na mesma coleção.
update public.diretorias set
  diretor_email = 'a.moura@senff.com.br',
  aliases = array['Vendas Varejo Expansão', 'Private Label']
where slug = 'vendas-varejo-expansao';

update public.diretorias set
  diretor_email = 'a.lima@senff.com.br',
  aliases = array['Dados e Infraestrutura']
where slug = 'dados-infraestrutura';

update public.diretorias set
  diretor_email = 'bruno.capobianco@senff.com.br',
  aliases = array['Operações e Atendimento', 'Operações', 'Atendimento']
where slug = 'operacoes-atendimento';

update public.diretorias set
  diretor_email = 'cristiano.souza@senff.com.br',
  aliases = array['Consignado']
where slug = 'consignado';

update public.diretorias set
  diretor_email = 'e.dzikovicz@senff.com.br',
  aliases = array['Tecnologia da Informação', 'TI', 'Fraudes', 'Portfólio Projetos Estratégicos']
where slug = 'tecnologia-informacao';

update public.diretorias set
  diretor_email = 'f.silva@senff.com.br',
  aliases = array['Pós Vendas Private Label', 'Pós Vendas - Private Label']
where slug = 'pos-vendas-private-label';

update public.diretorias set
  diretor_email = 'j.pereira@senff.com.br',
  aliases = array[
    'Controladoria',
    'Departamento Controladoria - Riscos',
    'Departamento Controladoria - Controladoria',
    'Departamento Controladoria - Carteiras e Regulatórios',
    'Departamento Controladoria - Fiscal',
    'Departamento Controladoria - Contabilidade',
    'Financeiro / Contas a Receber'
  ]
where slug = 'controladoria';

update public.diretorias set
  diretor_email = 'j.genaro@senff.com.br',
  aliases = array['Crédito / Cobrança', 'Crédito Cobrança', 'Crédito PF', 'Crédito PJ', 'Cobrança']
where slug = 'credito-cobranca';

update public.diretorias set
  diretor_email = 'm.axt@senff.com.br',
  aliases = array['Comercial PJ', 'Banco PJ']
where slug = 'comercial-pj';

update public.diretorias set
  diretor_email = 'marco@senff.com.br',
  aliases = array['Adquirência e Marketplace', 'Credenciamento', 'Marketplace', 'Marketing', 'Comercial PF']
where slug = 'adquirencia-marketplace';

update public.diretorias set
  diretor_email = 'm.rodrigues@senff.com.br',
  aliases = array[
    'Tesouraria e Captação',
    'Área Tesouraria e Captação',
    'Tesouraria',
    'Financeiro - Tesouraria',
    'Produtos Financeiros'
  ]
where slug = 'tesouraria-captacao';

update public.diretorias set
  diretor_email = 'p.pereira@senff.com.br',
  aliases = array['Processos', 'Área Processos']
where slug = 'processos';

update public.diretorias set
  diretor_email = 'b.camargo@senff.com.br',
  aliases = array['Seguros']
where slug = 'seguros';

update public.diretorias set
  diretor_email = 'dpo@senff.com.br',
  aliases = array[
    'RH',
    'Recursos Humanos',
    'Área Recursos Humanos',
    'Jurídico',
    'Compliance',
    'DHO',
    'Compras, Manutenção e Zeladoria',
    'Frota'
  ]
where slug = 'recursos-humanos';
