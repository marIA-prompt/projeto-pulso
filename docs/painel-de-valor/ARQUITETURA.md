# Arquitetura — Painel de Valor dentro do Pulso

## Restrição que define tudo
O limite de projetos do Supabase foi atingido. O banco do Pulso tem espaço, mas esta área **não cria nada nele**: só lê a tabela `projects`. O restante do conteúdo fica em arquivos no repositório.

```
Navegador ──> /valor (Next.js, servidor)
                 ├─ lê `projects` no Supabase do Pulso (só leitura, regras de acesso atuais)
                 ├─ lê content/painel-de-valor/*.json (validados por schema)
                 └─ calcula indicadores (funções puras) e renderiza
```

## Fontes de dados

| Dado | Fonte | Atualização |
|---|---|---|
| Iniciativas, estágios, horas, temas, diretorias | Tabela `projects` | Ao vivo |
| Lei do Bem, semáforo, presença | Funções já existentes no Pulso | Ao vivo |
| Soluções, prioridades, resultados esperados, entregas, ganhos, movimentos, decisões, riscos | `content/painel-de-valor/*.json` | Mensal, por pull request |
| Uso de ChatGPT e Codex | `content/painel-de-valor/uso-ia.json` | Trimestral, por pull request |
| Premissas (custo da hora, horas por pessoa) | `content/painel-de-valor/meta.json` | Quando mudar |

## Colunas de `projects` usadas
`id`, `title`, `stage`, `theme`, `directorate`, `area_id`, `uses_ai`, `uses_n8n`, `hours_saved_month`, `is_legacy_import`, `archived_at`, `created_at`.

- Ignorar linhas com `archived_at` preenchido, se o resto do Pulso fizer o mesmo. Conferir como a aba Acompanhamento conta as 241.
- **Não** trazer `description`, `links`, `notes` nem `objetivo_contexto`: têm caminhos de rede e detalhes internos que não cabem em uma visão para diretores.
- `cost_saved_month` e `implementation_cost` estão vazios em todas as linhas hoje. Não usar.

## Normalização
`content/painel-de-valor/normalizacao.json` traz os apelidos de diretoria e de tema. A normalização acontece na leitura, em memória. Ela **não** corrige o banco: a correção definitiva é no cadastro.

## Organização sugerida
Adapte aos padrões do repositório. Os nomes abaixo são um ponto de partida.

```
app/valor/                    rota e layout da área (ou o equivalente no roteador em uso)
  page.tsx                    visão "O que a IA já faz"
  portfolio/page.tsx          visão "Portfólio do Pulso"
  direcionamento/page.tsx     visão "Direcionamento" (restrita)
features/valor/
  dados/iniciativas.ts        consulta a `projects`, só no servidor
  dados/conteudo.ts           carrega e valida os JSON
  dados/schemas.ts            schemas dos JSON
  calculo/portfolio.ts        funções puras de indicadores
  calculo/direcionamento.ts   contagens de prioridades, resultados e régua
  componentes/                régua, cartão de solução, indicador em %, barras, tabela do portfólio, simulador
```

## Componentes
- **Régua**: 5 segmentos; o quinto tem aparência diferente enquanto vazio, para a ausência de resultado medido ficar visível.
- **Indicador em %**: valor, rótulo, legenda e barra.
- **Simulador**: único componente com estado no navegador além dos filtros do portfólio.
- **Tabela do portfólio**: filtragem no navegador é suficiente para o volume atual (241 linhas). Se passar de alguns milhares, mover para o servidor.

Use o sistema visual do Pulso (cores, tipografia, cartões, pílulas, alternador de tema). O protótipo em `referencia/prototipo.html` vale pela estrutura, pelos textos e pelos estados, não pelas cores.

## Acesso
- Mesma autenticação do Pulso.
- Visões 1 e 2: qualquer usuário logado.
- Visão 3: perfil de administração, verificado no servidor. Usar o mesmo mecanismo da aba Admin.

## Testes
- Unitários das funções de cálculo contra `tests/fixtures/painel-de-valor/iniciativas-2026-10-06.json` e `esperado-2026-10-06.json`.
- Validação dos JSON de conteúdo no pipeline.
- Um teste de fumaça por visão, se o repositório já tiver testes de tela.

## Se um dia precisar editar pelo sistema
Quando a edição por pull request ficar pesada, o caminho é criar um esquema `valor` **no mesmo banco do Pulso** (não um projeto novo), com tabelas pequenas para prioridades, entregas e soluções, e uma tela na aba Admin. Os JSON deste pacote já têm o formato dessas tabelas. Isso é outra fase e precisa de aprovação.
