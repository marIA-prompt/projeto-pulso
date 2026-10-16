# Catálogo de evidências — Sistema Pulso

Inventário dos artefatos que sustentam o dossiê. Cada linha liga o tipo de evidência pedido (POC, arquitetura, desenvolvimento, decisão, teste/QA, validação, iteração, erro, incerteza) a um arquivo, commit ou PR.

---

## 1. POCs e protótipos

| Artefato | O que prova | Onde está |
|---|---|---|
| `pulsoimproved.html` (referência) | Dashboard-alvo: semáforo com sliders, CSV, filtros, donut/barras/ECG, paleta Senff | Descrito em `PRD.md` §4/§11 e validado em `PATCH_documentacao.md` §1. Não versionado neste repo. |
| `dashboard_light.html` (MVP anterior) | Hipótese descartada: Inter + Tailwind, sem semáforo, identidade errada | `AUDITORIA.md` B1–B2; patch recomenda não usá-lo |
| Planilha `Triagem_Preliminar_Lei_do_Bem_Simples` | Fórmulas B27–B30, frases B29, bloqueios 3/4/5/6/9/10/11 | Espelho em `src/lib/lei-do-bem.ts` + trigger `lei_do_bem_calcular_triagem` |
| HTML `pulsoimproved` como POC de idade congelada | `DATA.meta.ref = "2026-08-11"` e campo `age` pré-calculado; 56/56 ativas críticas | `PATCH` §3 |
| Painel de Valor (não mergeado) | Cálculo puro + fixtures `esperado-2026-10-06.json` | Branch `cursor/painel-de-valor-conteudo-e426` |

## 2. Documentação de arquitetura e requisitos

| Artefato | Papel |
|---|---|
| `docs/PRD.md` | Requisitos v3, critérios de aceite, fora de escopo, roadmap F1–F6 |
| `docs/DECISOES.md` | Arquitetura ToT D1–D4 + decisões menores |
| `docs/fluxograma.md` | Fluxo convite → RLS → gate (histórico) → dashboard → W4 |
| `README.md` | Stack, permissões, webhooks, bootstrap, pendências reais |
| `docs/QUESTIONAMENTOS.md` | Arquitetura, integrações, schema e regras em sete respostas |
| `docs/metodologia-grupo.md` / `metodologia-executiva.md` | Regras de negócio de origem (pipeline, RACI, gates, KPIs) |
| `supabase/migrations/0001_pulso_schema.sql` | Schema, RLS, views, de-paras — a arquitetura de dados |
| `src/lib/supabase/middleware.ts` + `src/lib/auth.ts` | Camadas 1 e 2 da autorização |
| `next.config.mjs`, `package.json`, `tsconfig.json` | Stack Next 14.2.15 / React 18 / Zod / Supabase SSR |

## 3. Registros de desenvolvimento e customização

| Artefato | Papel |
|---|---|
| Histórico git (`main`) | 75 commits; 70 em 2026-08, 5 em 2026-09 |
| PRs #1–#27 | Registro de customização, review e merge |
| `0001`–`0014` | Evolução do schema (papéis, comunidade, Lei do Bem, gate) |
| `src/styles/tokens.css` | Customização Senff (nenhum hex solto na UI, regra do patch) |
| `src/app/cadastro/actions.ts` | Domínio `@senff.com.br` |
| `area_aliases` | De-para exclusivo do CSV Senff (typo MANUENÇÃO incluso) |
| `src/lib/lei-do-bem.ts` | Instrumento interno, não produto de prateleira |

## 4. Decisões e alternativas avaliadas

Fonte principal: `docs/DECISOES.md`. Complemento: cabeçalho da `0003` e `QUESTIONAMENTOS.md` §3.

| ID | Escolhido | Descartado |
|---|---|---|
| D1 Convite | Tabela própria + service-role + link copiável | `inviteUserByEmail`; tabela pura sem fallback |
| D2 Dashboard | Híbrido server views + filtro cliente | Agregar a cada slider; agregar tudo no cliente |
| D3 Frequência | RSVP no MVP; `confirmed_at` separado | Só check-in; os dois estados na UI agora |
| D4 Autorização | Middleware + página + RLS | Só middleware; só RLS; papel no JWT |
| Semáforo | `last_activity_at` substantivo | Idade do registro / data congelada |
| Score | Eixos nulos + `scoring_source` | Importar 5–65; default 0; VARCHAR de área |
| Saúde | Coluna `health` ortogonal | Misturar `em_risco` no enum de estágio |
| Gate Matriz | Desligado (`0013`/`0014`) | Manter trigger depois que a UI deixou de pontuar |
| Tema | Claro padrão, escuro opt-in | Escuro-primeiro do HTML de referência |

## 5. Testes e evidências de QA

| Suite | Casos | O que valida |
|---|---|---|
| `src/lib/lei-do-bem.test.ts` | 30 | Fórmula B27–B30, fronteira 0,75, bloqueios, MCTI/Frascati, ordenação, wizard de auditoria |
| `src/lib/cadastro-iniciativa.test.ts` | 9 | Máquina de etapas; regressão do loop do opt-in; escopo obrigatório |
| `src/lib/nav.test.ts` | 4 | Lei do Bem só gerencial+; Admin só administrador |
| `src/lib/projeto-erro.test.ts` | 5 | Tradução do gate residual e da coluna ausente |
| `tsc --noEmit` | — | Tipos do App Router |

Execução deste dossiê (16/10/2026): **48 casos passaram; `tsc --noEmit` exit 0.** Log em artefato da coleta.

QA manual registrado nos PRs (vídeos/screenshots de convite, kanban, dashboard, comunidade, senha no e-mail, auditoria MCTI). Critérios de aceite do PRD §8: não-convidado bloqueado, ciclo do convite, RLS, conteúdos reais, `DECISOES.md` com ToT.

## 6. Validações contra a base real

| Indicador | Critério de verdade | Onde está cravado |
|---|---|---|
| 161 iniciativas | CSV = RAW_DATA | `AUDITORIA.md` A1 |
| 1.995 h/mês | 1.994,7 h = Σ horas só `concluido` (não 2.309,7 h) | `v_portfolio_kpis`, `PATCH` §4 |
| 31 setores | 32 grafias − “Não informado” | `areas.is_real_area`, `PATCH` §2 |
| +80 colaboradores | Participantes do grupo ≠ 48 responsáveis do CSV | `AUDITORIA.md` A4 |
| Go-live do semáforo | `update last_activity_at = now() where is_legacy_import` | `README.md`, `0001` §6 |

## 7. Iterações

Ver [`04-linha-do-tempo.md`](04-linha-do-tempo.md). Padrão: a regra no papel colide com o dado ou com o uso → de-para explícito → teste/regressão → migration idempotente.

## 8. Tratamento de erros

Ver [`05-testes-qa-erros.md`](05-testes-qa-erros.md). Pontos-chave: webhook n8n nunca derruba a operação; convite revalidado no servidor; token com hashes case-insensitive; RLS devolve zero linhas (não confirma existência); `projeto-erro.ts` traduz gate/schema cache; senha não vaza no campo e-mail (PR #4).

## 9. Desafios e incertezas tecnológicas

Ver [`05-testes-qa-erros.md`](05-testes-qa-erros.md) (seção abertas). Incluem carga automatizada das 161, W3/W4 em produção, ClickUp/Bitrix, check-in no dia, ROI, gates da Executiva ainda só em reunião.
