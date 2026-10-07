# Plano de desenvolvimento no Cursor

Uma fase por vez, cada uma em seu commit. Cole o prompt da fase no chat do Cursor (modo agente). Revise o que ele propõe antes de aceitar.

## Fase 0 — Reconhecimento (sem escrever código)
**Prompt**
> Leia `docs/painel-de-valor/PRD.md`, `ARQUITETURA.md`, `REGRAS-DE-CALCULO.md` e as regras em `.cursor/rules/painel-de-valor.mdc`. Depois examine este repositório e me responda, sem alterar nenhum arquivo: (1) qual roteador e versão do Next.js; (2) como as abas Acompanhamento e Lei do Bem leem o Supabase e onde ficam os cálculos delas; (3) como o menu superior é montado; (4) como a aba Admin restringe acesso; (5) que componentes de cartão, pílula, tabela e tema já existem; (6) que biblioteca de testes e de validação de schema está em uso; (7) como o Acompanhamento chega a 241 iniciativas, e se filtra arquivadas. Termine com a lista de arquivos que você pretende criar e os que pretende tocar, e as dúvidas que tiver.

**Pronto quando** a lista de arquivos não incluir migration nem mudança em tela existente além do menu.

## Fase 1 — Conteúdo e schemas
**Prompt**
> Crie os schemas dos arquivos em `content/painel-de-valor/` e um carregador que valida cada JSON ao ler, no servidor. Use a biblioteca de validação que o repositório já tem. Inclua um teste que carrega todos os JSON. Não crie telas ainda.

**Pronto quando** o teste passa e um JSON propositalmente quebrado faz o teste falhar.

## Fase 2 — Leitura das iniciativas e cálculos
**Prompt**
> Implemente a consulta só de leitura à tabela `projects`, no servidor, trazendo apenas as colunas listadas em `ARQUITETURA.md` e aplicando `normalizacao.json`. Implemente as funções puras de `REGRAS-DE-CALCULO.md`. Escreva testes unitários usando `tests/fixtures/painel-de-valor/iniciativas-2026-10-06.json` como entrada e `esperado-2026-10-06.json` como resultado. Não crie nem altere nada no banco.

**Pronto quando** todos os valores do arquivo esperado batem.

## Fase 3 — Estrutura da área e visão "O que a IA já faz"
**Prompt**
> Crie a rota `/valor` com o alternador das três visões e acrescente o item `Valor` no menu. Implemente a visão "O que a IA já faz" seguindo a seção 4.1 do PRD e a estrutura de `docs/painel-de-valor/referencia/prototipo.html`, com os componentes visuais do Pulso. Inclua o simulador de custo da hora. Textos vêm dos JSON e do protótipo, sem reescrever.

**Pronto quando** os números do topo batem com a aba Acompanhamento e a tela funciona em celular e no tema escuro.

## Fase 4 — Visão "Portfólio do Pulso"
**Prompt**
> Implemente `/valor/portfolio` conforme a seção 4.2 do PRD: três leituras calculadas, indicadores em %, barras por tema e por diretoria, as 10 maiores e a lista completa com busca, filtros e total do recorte. Não exiba descrição, links nem notas das iniciativas.

**Pronto quando** filtrar por "Só cadastradas desde o lançamento" mostra 25 iniciativas com os dados de 06/10.

## Fase 5 — Visão "Direcionamento"
**Prompt**
> Implemente `/valor/direcionamento` conforme a seção 4.3 do PRD, com o componente de régua de 5 etapas. Restrinja a rota ao perfil de administração, com verificação no servidor, usando o mesmo mecanismo da aba Admin. Para Lei do Bem, semáforo e presença, reutilize as funções das abas existentes; se não for possível sem alterá-las, deixe o bloco de fora e me avise.

**Pronto quando** um usuário sem perfil de administração não acessa a rota nem pelo endereço direto.

## Fase 6 — Acabamento e pull request
**Prompt**
> Revise a área `/valor`: acessibilidade (foco, rótulos, contraste), estados vazios e de erro, celular, tema escuro. Rode lint, tipos e testes. Confirme que não há migration nem dependência nova. Escreva a descrição do pull request com o que foi feito, como testar e o que ficou fora do escopo.

**Pronto quando** os critérios de aceite do PRD passam e a revisão humana aprova.

## Rotina mensal depois de publicado
1. Editar os JSON em `content/painel-de-valor/` com o que mudou no ciclo.
2. Atualizar `data_base` em `meta.json`.
3. Abrir pull request, revisar a prévia e publicar.
