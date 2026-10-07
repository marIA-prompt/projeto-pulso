# PRD — Painel de Valor da IA

## 1. Problema
Em dois meses a Gerência de IA trabalhou em várias frentes, mas a percepção é de que as iniciativas do Direcionamento Executivo não andam e de que não se vê o ganho para a Senff. As informações existem, espalhadas em relatórios mensais, no Pulso e em painéis soltos.

## 2. Objetivo
Uma única área, dentro do Pulso, que responda a três perguntas:
1. O que a IA e a automação já fazem pela Senff, em linguagem de negócio?
2. Onde está o valor no portfólio de iniciativas?
3. Quão perto estamos do que o Direcionamento Executivo pede, e o que falta?

## 3. Usuários
| Quem | O que procura | Visão |
|---|---|---|
| Diretores e gestores de área | Saber o que existe e quando pedir | O que a IA já faz |
| Gestores e donos de iniciativa | Ver o portfólio e onde estão as horas | Portfólio do Pulso |
| Gerência de IA e Diretoria de TI | Acompanhar prioridades, lacunas e riscos | Direcionamento |

## 4. Escopo: três visões em uma rota

### 4.1 O que a IA já faz
- Cabeçalho com 4 números: horas devolvidas por ano, pessoas equivalentes, % de iniciativas concluídas, % de contas de IA em uso.
- **O impacto em uma conta**: horas por ano e por mês, pessoas equivalentes, horas ainda a capturar e simulador em reais com controle de custo da hora.
- **Outras contas que pesam**: concluídas sem horas informadas (ao vivo) e itens de `gestao.json`.
- **Papel da Gerência de IA**: texto fixo, que deixa claro que as horas são das áreas.
- **Soluções**: cartões de `solucoes.json`, em dois grupos (disponível hoje; em teste e em desenvolvimento). Cada cartão abre pela frase de pedido.
- **Em números**: indicadores em %.
- **Como pedir**.
- Regra: nada de lacuna, plano ou "como vai ser" nesta visão.

### 4.2 Portfólio do Pulso
- Três leituras calculadas: concentração, subestimação, o que entrou depois do lançamento.
- Indicadores em % do portfólio.
- Horas devolvidas por tema e por diretoria; 10 iniciativas concluídas com mais horas.
- Lista completa com busca, filtros (estágio, tema, diretoria), três caixas de seleção e total do recorte.

### 4.3 Direcionamento
- Leitura (diagnóstico), indicadores em %, 7 prioridades, 9 resultados esperados, régua de produção com filtro por frente, ganhos por grau de evidência, movimentos, decisões da Diretoria e riscos abertos.
- A régua de 5 etapas (Desenhado, Construído, Em teste, Em produção, Resultado medido) é o elemento que se repete em tudo.

## 5. Requisitos funcionais
- RF1. Aba `Valor` no menu do Pulso, rota `/valor`, com alternador entre as três visões. A visão escolhida fica na URL (`/valor`, `/valor/portfolio`, `/valor/direcionamento`).
- RF2. Tudo o que vem das iniciativas é calculado na hora da consulta, como a aba Acompanhamento já faz.
- RF3. Conteúdo editorial lido dos JSON e validado por schema.
- RF4. Simulador de custo da hora: de R$ 20 a R$ 200, passo de R$ 5, padrão em `meta.json`. Mostra por mês, por ano e a capturar por ano. A premissa fica sempre visível.
- RF5. Filtros do portfólio funcionam juntos e mostram contagem e soma de horas do recorte. Estado vazio com orientação.
- RF6. Indicadores de Lei do Bem, semáforo e presença reutilizam as funções que já existem nas abas Lei do Bem e Acompanhamento. Se não der para reutilizar, o bloco fica fora da primeira versão.
- RF7. Tema claro e escuro e largura de celular, como no resto do Pulso.
- RF8. Data-base do conteúdo editorial visível no topo de cada visão.

## 6. Requisitos não funcionais
- Sem banco novo, sem tabela nova, sem migration.
- Sem nova dependência pesada. Gráficos de barra feitos com HTML e CSS, como no protótipo.
- Acesso: mesmas regras de login do Pulso. A visão Direcionamento é restrita ao perfil de administração (confirmar com a Gerência).
- Acessibilidade: foco visível, rótulos nos controles, estado não depende só de cor.

## 7. Fora do escopo desta fase
- Tela para editar prioridades, entregas e soluções.
- Integração com ClickUp, OpenAI ou Power BI.
- Histórico mês a mês.
- Alterar o cadastro de iniciativas (por exemplo, tornar horas obrigatórias).

## 8. Critérios de aceite
- Com os dados de 06/10/2026, os números batem com `tests/fixtures/painel-de-valor/esperado-2026-10-06.json`.
- Alterar uma iniciativa no Pulso muda os números de `/valor` sem publicar nada.
- Alterar um JSON e publicar muda o texto correspondente; JSON inválido falha no build.
- Nenhuma migration nova no pull request.
- As três visões abrem em celular sem rolagem horizontal da página.

## 9. Como saber se deu certo
- Diretores conseguem dizer qual solução pedir para uma necessidade.
- % de concluídas com horas informadas sobe (hoje 37%).
- O relatório mensal da Gerência passa a ser este painel.
