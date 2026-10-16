# Escopo elegível e critérios de Frascati — Sistema Pulso

Delimita o que entra como desenvolvimento experimental (Lei do Bem / Frascati) e o que permanece rotina, implantação ou parametrização. A triagem de 12 itens do próprio produto é respondida aqui **para o Pulso**, com a mesma regra da aplicação: sinaliza, não decide.

---

## Recorte elegível

Atividades em que a solução e o caminho **não eram conhecidos no início**, exigiram hipóteses, prototipação, validação contra a base real e retrabalho de regra:

| Recorte | Por que é P&D | Evidência |
|---|---|---|
| Modelo temporal do semáforo (três relógios) | Incerteza: a única data do CSV era cadastro; aplicar a regra de 14/30/90 dias nela destrói o indicador | `0001` (`last_activity_at`, `bump_last_activity`), `AUDITORIA.md` C3, `PATCH` §3 |
| Reconciliação institucional (horas, setores, status, score) | Incerteza: os números publicados não saem da base sem de-para; “corrigir silenciosamente” foi rejeitado | `areas`/`area_aliases`, `map_legacy_status`, `parse_legacy_date`, `v_portfolio_kpis` |
| Autorização em camadas + convite próprio | Hipóteses D1/D4 podadas (`inviteUserByEmail`, JWT, middleware-only) | `DECISOES.md`, `invite-token.ts`, `0003` (`has_role_at_least`, anti-JWT) |
| Motor Lei do Bem (triagem + Frascati/MCTI) | Fórmula fiscal/P&D no mesmo sistema do portfólio, duplicada TS/SQL, sem bloquear cadastro | `0010`, `lei-do-bem.ts`, `lei-do-bem.test.ts`, PR #19–#27 |
| Saúde × estágio e decisões executivas | Script anexado misturava enums; hipótese “status único” foi podada | `0003` (comentário APROVEITADO/CORRIGIDO) |
| Reversão do gate da Matriz | Hipótese “gate no banco é sempre desejável” falhou no uso real | `0013`, `0014`, `projeto-erro.ts`, PRs #24–#25 |

## Recorte não elegível (fora do escopo P&D)

Separação exigida pelo item 9 da triagem e pelo Guia Prático MCTI:

| Atividade | Natureza | Evidência |
|---|---|---|
| Deploy Vercel, env vars, Redirect URLs | Implantação | `README.md` |
| Webhook n8n W1–W4 como POST HTTP | Integração de canal; ausência não bloqueia | `src/lib/n8n.ts` |
| Paginação 10/20, Kanban que cabe na tela | UX rotineira | PRs #5, #6, #14 |
| Pauta `input` → `textarea` | Parametrização de formulário | PR #7 |
| Sol/lua, tokens de badge no dark | Identidade visual | PRs #12, #17–#18 |
| Copiar link do convite, menu no avatar | Customização de UI | PRs #1, #13 |
| Remoção do callout amarelo | Correção editorial de conteúdo | PR #2, `0007` |
| Flag `enviar_clickup` sem sync | Intenção operacional; sync é 2ª parte | `0010` comment |
| Bootstrap SQL do 1º admin | Operação de go-live | `README.md` |

Itens de fronteira (desenvolvimento de produto, incerteza baixa): Hub da Comunidade (PR #3), cadastro `@senff.com.br` (PR #8), filtro de proprietário (PR #9). Entram no sistema; **não** sustentam sozinhos o enquadramento.

---

## Cinco critérios de Frascati

Mapeamento usado em `FRASCATI_CRITERIOS` (`src/lib/lei-do-bem.ts`). Avaliação preliminar do Pulso:

| Critério | Seção | Avaliação | Por quê |
|---|---|---|---|
| Inovador | §6.2 | Atende | Elemento não óbvio: semáforo de atualização substantiva, score legado isolado, motor Lei do Bem duplicado, papel no Postgres. Não é “subir um CRUD”. |
| Criativo | §6.4 | Atende | Hipóteses ToT, auditoria pré-código, prototipação contra HTML errado vs. certo, testes de fronteira, retrabalho do gate. |
| Incerto | §6.3 | Atende | Solução e caminho desconhecidos no início (C1–C3 bloqueavam implementação). Várias hipóteses só se confirmaram depois de colidir com o dado ou com o uso. |
| Sistemático | §6.4 | Atende | PRD, auditoria, ToT, 14 migrations comentadas, 27 PRs, testes, dossiê. Trabalho planejado e documentado por etapas. |
| Transferível / reproduzível | §6.1 | Atende | Schema + de-paras + fórmulas versionados; a própria aba Lei do Bem reproduz o método para as demais iniciativas Senff. |

Síntese no recorte do produto: **5/5 Frascati atendidos no Pulso como iniciativa**, desde que o parecer humano confirme o recorte elegível acima e exclua a rotina. Os cinco blocos FormP&D deste dossiê preenchem §6.1–6.5.

---

## Triagem preliminar (12 itens) — respostas propostas para o Pulso

Escala da planilha: Sim / Parcialmente / Não / Não sei. “Não” nos itens 3, 4, 5, 6, 9, 10, 11 é bloqueio **da fórmula**, não do cadastro.

| # | Pergunta (resumo) | Resposta | Justificativa curta |
|---|---|---|---|
| 1 | Vínculo estratégico | Sim | Programa Senff de IA & Automação; Metodologia Executiva e Manifesto. |
| 2 | Problema e afetados definidos | Sim | Acompanhamento disperso; 80+ colaboradores, diretoria, PMO. Auditoria quantificou o dano. |
| 3 | Desenvolvimento/alteração relevante | Sim | Plataforma nova; não é parametrização de kanban. |
| 4 | Novidade ou ganho técnico | Sim | Ver §6.2. |
| 5 | Incerteza técnica no início | Sim | C1–C3 bloqueavam implementação; D1–D4 eram ramos abertos. |
| 6 | Hipóteses, testes, protótipos | Sim | Auditoria, ToT, HTML de referência, testes de fórmula, PRs de retrabalho. |
| 7 | Planejado e documentado por etapas | Sim | PRD → auditoria → schema → PRs #1–#27 → este dossiê. |
| 8 | Conhecimento reproduzível/reaproveitável | Sim | Motor Lei do Bem reutilizado no portfólio; migrations idempotentes. |
| 9 | Separar experimental de rotina | Sim | Tabela de recorte neste arquivo. |
| 10 | Desafios técnicos, não só prazo/custo | Sim | Relógio, escala, RLS, fórmula fiscal, gate vs. UX. |
| 11 | Além de compra/configuração de pronta | Sim | ClickUp/Bitrix/n8n/Power BI avaliados e insuficientes (`QUESTIONAMENTOS.md` §1). |
| 12 | Registros de atividades, testes, decisões | Sim | Git, PRs, testes, `DECISOES.md`, este dossiê. |

Índice bruto: 12 Sim → `(12×2)/24 = 1,00` → classificação automática **potencialmente elegível**. Próxima ação do produto: encaminhar para análise técnica detalhada e validação fiscal/documental.

---

## O que deliberadamente não entra no índice institucional

Para não misturar P&D com operação:

- ROI ≥ 3× sobre 12/161 registros (7%) — fora do dashboard de propósito.
- Score legado 5–65 como prioridade da matriz.
- Idade do registro como saúde.
- “Não informado” como setor.
- Dataset do HTML (fonte = view sob RLS).
- INSERTs fictícios do script de relatoria.
