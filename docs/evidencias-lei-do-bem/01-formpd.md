# FormP&D — Sistema Pulso (Guia Prático MCTI, seção 6)

Texto pronto para os blocos §6.1–6.5 e para os cinco campos de escopo do cadastro Lei do Bem (`GRUPO1_CAMPOS` / `GRUPO2_CAMPOS` em `src/lib/lei-do-bem.ts`). Cada parágrafo aponta a evidência no repositório.

---

## Cadastro do projeto (Grupo 1)

### Objetivo estratégico / OKR

Centralizar o acompanhamento do programa de IA & Automação da Senff — Manifesto, Metodologias, dashboard do portfólio, frequências e cadastro de iniciativas — com acesso restrito a colaboradores e governança alinhada ao RACI da Metodologia Executiva. Meta de programa: 120 participantes; o Pulso é o sistema que torna essa cadência mensurável.

Evidência: `docs/PRD.md` §1–2, `docs/manifesto.md`, `docs/metodologia-executiva.md` §1.

### Contexto e problema

O acompanhamento era disperso. As fontes herdadas não formavam um sistema: CSV de 161 linhas com 39 grafias de setor e score 5–65; HTML com dataset embutido (~160 KB) e idades congeladas em `2026-08-11`; PDFs que na prática eram ZIP de JPEG; planilha isolada de triagem Lei do Bem; Bitrix/Teams/ClickUp como canal, não como governança. Sem dono autenticado, sem RLS, sem cadência de atualização. O painel projetado na reunião semanal mentia no dia seguinte.

Evidência: `docs/AUDITORIA.md` blocos A–C, `docs/QUESTIONAMENTOS.md` §1, `docs/PRD.md` §2.

### O que será desenvolvido ou alterado?

Uma plataforma web (Next.js 14 + TypeScript + Supabase Auth/Postgres/RLS) que:

- autentica por convite (token SHA-256) ou auto-cadastro `@senff.com.br`, com cinco papéis mapeados ao RACI;
- reconcilia o portfólio real (áreas canônicas, de-para de status, três marcos temporais, score legado separado da matriz);
- calcula KPIs institucionais em views SQL (`horas_mes_devolvidas` só de concluídas; semáforo de *atualização*; alerta >14 dias);
- captura RSVP de encontros e consolida frequência;
- executa triagem preliminar Lei do Bem (12 itens, fórmulas B27–B30) e pré-análise MCTI/Frascati, com auditoria gerencial e histórico de status.

Evidência: `README.md`, `src/app/(app)/`, `supabase/migrations/0001`–`0014`, `src/lib/lei-do-bem.ts`.

### Quais são os resultados esperados?

1. Origem única e auditável para os números publicados (161 iniciativas, 1.994,7 h/mês, 31 setores reais).
2. Semáforo e alerta de 14 dias críveis na primeira reunião (não uma parede vermelha no go-live).
3. Autorização que sobrevive a Server Action esquecida: o banco é a fronteira.
4. Triagem Lei do Bem no mesmo sistema do portfólio, preliminar, sem bloquear cadastro, com parecer humano.
5. Operação não depende do n8n: webhook ausente não derruba convite, encontro nem cadastro.

Evidência: `docs/PRD.md` §8, `docs/DECISOES.md` D1–D4, `src/lib/n8n.ts`.

### Como será desenvolvido?

Ciclo experimental com hipóteses, prototipação e validação contra a base real:

1. Auditoria dos artefatos herdados **antes** de codar (`docs/AUDITORIA.md`, 12/08/2026).
2. Tree of Thought das quatro decisões-chave (`docs/DECISOES.md`).
3. Schema idempotente com de-paras explícitos (`0001_pulso_schema.sql`).
4. POC de dashboard híbrido: Server Component entrega views; cliente filtra/recorta o semáforo em memória (D2).
5. Motor de triagem especificado duas vezes (TypeScript + PL/pgSQL) e confrontado por testes de fronteira.
6. Iterações em produção (PRs #1–#27): papéis, comunidade, Lei do Bem, reversão do gate da Matriz.

Evidência: `docs/evidencias-lei-do-bem/04-linha-do-tempo.md`.

### O que está fora do escopo?

- Implantação, hospedagem e parametrização de ambiente (Vercel, variáveis, Redirect URLs).
- Compra, configuração ou integração de solução pronta (ClickUp, Bitrix, n8n como canal).
- Manutenção, suporte, correção cosmética de copy/CSS, paginação de listas, troca de widget (`input` → `textarea`).
- SSO corporativo, app nativo, gamificação, RAG/pgvector, edição colaborativa em tempo real (PRD §9).
- Sincronização real com ClickUp (`enviar_clickup` é flag de intenção) e Bitrix (W5).
- Relatoria executiva automatizada W4 enquanto o n8n de produção não estiver configurado.
- Recálculo de ROI ≥ 3× sobre o acervo legado (cobertura de custo = 7%).

Evidência: `docs/PRD.md` §9, `README.md` (pendências), `docs/PATCH_documentacao.md` §11.

### Quais são os principais desafios ou riscos?

Desafios **técnicos/tecnológicos**, não só de prazo:

- Como medir “saúde” sem explodir o indicador no dia 1 (idade mediana 259 dias; 56/56 ativas críticas se o relógio for a data de cadastro).
- Como não publicar “32 setores” e “1.995 h” se a base não reproduz esses números sem de-para e filtro.
- Como autorizar cinco papéis sem colocar o papel em claim de cliente.
- Como replicar a planilha Lei do Bem sem transformar “Não” em bloqueio de cadastro, e sem gerar falso P&D por vocabulário.
- Como o gate `score ≥ 3,0` da metodologia convive com um cadastro que deixou de pontuar os quatro eixos.

Evidência: `docs/AUDITORIA.md` C1–C3, `docs/DECISOES.md`, migrations `0010`–`0014`, commits `76341d0` / `d5c3281`.

---

## Avaliação técnica MCTI (Grupo 2)

### §6.1 — Descrição do projeto

O problema tecnológico é **governar um portfólio institucional de inovação com dados sujos, regras de metodologia que o dado não comporta, e autorização que não pode viver no cliente**. O progresso já alcançado:

- Schema canônico com `areas`/`area_aliases`, pipeline de 8 estágios (7 + `cancelado`), `health` ortogonal ao estágio, `scoring_source` distinguindo matriz/legado/não pontuado.
- Views `v_portfolio_kpis`, `v_projects_dashboard`, `v_attendance_kpis`, `v_lei_do_bem` como origem única dos números.
- Defesa em camadas (middleware + guarda de página + RLS). `SUPABASE_SERVICE_ROLE_KEY` só no servidor.
- Motor de triagem Lei do Bem 1:1 com a planilha interna, mais pré-análise Frascati/MCTI no lugar do modelo genérico de agente.

A abordagem **não** se restringiu ao repertório já dominado (planilha + HTML + kanban genérico). Exigiu modelar de-paras, relógios, papéis e fórmulas fiscais que nenhuma ferramenta de prateleira expressa com RLS e auditoria.

### §6.2 — Elemento tecnologicamente novo ou inovador

Antes: CSV + HTML estático + canais. Como era feito: dataset embutido, `innerHTML`, idade pré-calculada, score direcional 5–65, setor como string livre.

Limitações: o número institucional mudava conforme a soma; o semáforo era 100% vermelho; o papel em metadado de cliente era gravável; a planilha Lei do Bem não conversava com o portfólio.

O que se desenvolveu e não é óbvio para quem só “sobe um Next.js + Supabase”:

1. **Semáforo de atualização substantiva** — `bump_last_activity()` só renova o relógio em campos de conteúdo; arquivar ou corrigir área não zera o alerta.
2. **Score legado isolado** — importar 5–65 na matriz 1–5 foi explicitamente rejeitado; `legacy_score` e `scoring_source = 'legado'` preservam o rastro sem contaminar o corte 4,0/3,0.
3. **Triagem duplicada e testada** — `(2×Sim + Parcialmente)/24`; “Não sei” prevalece sobre bloqueio duro; “Não” nos itens 3, 4, 5, 6, 9, 10, 11 classifica baixo potencial **sem** impedir o save. A mesma fórmula vive em TS e em trigger.
4. **Pré-análise MCTI/Frascati** — substitui o laudo genérico de agente; amarra itens da triagem aos blocos §6.1–6.5.
5. **Papel no Postgres, não no JWT** — a `0003` corrige um script anexado que usava `auth.jwt() ->> 'user_role'`, o antipadrão já podado em D4.

### §6.3 — Barreira ou desafio tecnológico

| Barreira | Hipótese inicial | Como foi atacada | Estado |
|---|---|---|---|
| Semáforo explode no go-live | Usar a data do CSV | Separar três timestamps; semear `last_activity_at` no go-live | Superada no modelo; script de carga ainda manual |
| 32 setores irreproduzíveis | Contar strings distintas | `areas` + aliases fechados; KPI exclui “Não informado” → 31 | Superada |
| Score 5–65 vs 1–5 | Normalizar ou re-scorar 161 | Eixos nulos + `scoring_source`; re-score manual rejeitado como pré-requisito | Superada |
| Papel em metadado de cliente | `inviteUserByEmail` | Tabela `invitations` + SHA-256 + service-role após revalidar token | Superada |
| Planilha Lei do Bem isolada | Integrar como campos livres | 12 enums + trigger + testes de fronteira 0,75 / bloqueio / “Não sei” | Superada |
| Falso P&D na pré-triagem do acervo | Vocabulário inicial | Ampliação do léxico (`d5c3281`, `76341d0`) | Superada em código; acervo ainda sem carga automatizada |
| Gate da Matriz vs cadastro sem Matriz | “Gate no banco é sempre desejável” | `0013` no-op, `0014` dropa o trigger; `projeto-erro.ts` traduz o residual | Superada após retrabalho |
| Wizard da triagem em loop | Estado React atrasado no opt-in | Máquina de etapas pura (`cadastro-iniciativa.ts`) + testes | Superada |

Hipóteses ainda em aberto: importação automatizada das 161 linhas; sync ClickUp/Bitrix sem duplicar o parecer fiscal; check-in no dia (D3); W3/W4 puxados pelo n8n em produção.

### §6.4 — Metodologia e métodos

Não é Scrum genérico. Os métodos experimentais usados:

- **Auditoria de consistência contra a base** (CSV × HTML × Design System × PDFs) antes de implementar — `docs/AUDITORIA.md`.
- **Tree of Thought** com ramos podados e risco explícito — `docs/DECISOES.md`.
- **Prototipação** a partir do HTML de referência (`pulsoimproved`) e rejeição do MVP anterior (`dashboard_light.html`).
- **Reconciliação numérica** como critério de verdade: 161 linhas = 161 no RAW_DATA; 1.994,7 h = soma só de concluídas; 31 = 32 grafias menos placeholder.
- **Duplicação deliberada da fórmula** (aplicação + banco) para a triagem não divergir; testes de fronteira em `lei-do-bem.test.ts` (30 casos).
- **Defesa em camadas** e RLS de mínimo privilégio; service-role em pontos enumerados.
- **Retrabalho como método**: quando a regra no papel não cabe no dado (ou no uso), isola-se o de-para e recusa-se “corrigir silenciosamente”.

### §6.5 — Descritivo complementar

- Equipe: desenvolvimento no repositório `projeto-pulso` (75 commits no `main` até 22/09/2026; 27 PRs; autoria Cursor Agent + Maria Clara).
- 14 migrations idempotentes (`0001`–`0014`).
- Testes automatizados: `test:lei-do-bem`, `test:cadastro`, `test:nav`, `test:projeto`.
- POCs/protótipos: HTML de referência do dashboard; planilha `Triagem_Preliminar_Lei_do_Bem_Simples`; ramo `cursor/painel-de-valor-conteudo-e426` (cálculo puro + fixtures 06/10/2026, ainda não mergeado).
- Referências: Manual de Frascati 2015, Manual de Oslo 2018, Lei 11.196/2005, Decreto 5.798/2006 — as mesmas URLs em `REFERENCIAS_METODOLOGICAS`.
- Customização Senff (não é skin): domínio `@senff.com.br`, paleta extraída do Design System, organograma real em `areas`, RACI da Metodologia Executiva, instrumento interno da triagem.
