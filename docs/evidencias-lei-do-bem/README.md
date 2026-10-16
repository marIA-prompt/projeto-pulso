# Dossiê de evidências técnicas — Sistema Pulso

*Coleta estruturada para consolidar a narrativa técnica, delimitar o escopo elegível e demonstrar o atendimento aos requisitos da Lei nº 11.196/2005 (Lei do Bem), do Decreto nº 5.798/2006, do Guia Prático MCTI (FormP&D, seção 6) e dos cinco critérios de Frascati.*

Este dossiê **não substitui** validação fiscal, contábil ou documental. A triagem e a pré-análise MCTI já existentes no produto (`src/lib/lei-do-bem.ts`) **sinalizam**; o parecer humano continua obrigatório.

**Entrega HTML (imprimir / PDF):** abra [`index.html`](index.html) no navegador e use *Imprimir / PDF*. Paleta Senff, sumário interno, FormP&D, Frascati, catálogo, linha do tempo e QA num único arquivo.

Painel navegável da coleta: canvas [Evidências Lei do Bem — Sistema Pulso](https://cursor.com/canvas/store-296c0355-f615-40c4-9684-8315ffef16b0/83836a58-6672-4fee-9698-dad5b10181bf).

**Projeto:** Sistema Pulso (Senff — IA & Automação)
**Repositório:** `marIA-prompt/projeto-pulso`
**Recorte temporal das evidências:** 13/08/2026 (commit `0b89720`, MVP) a 22/09/2026 (PR #27, pré-análise MCTI), mais o documento de questionamentos técnicos de 16/09/2026.
**Fonte de verdade:** código, migrations, PRs e documentação versionados — não inferência.

---

## Como usar este dossiê

| Necessidade | Arquivo |
|---|---|
| Abrir, navegar e imprimir o dossiê completo em HTML | [`index.html`](index.html) |
| Preencher o FormP&D (blocos §6.1–6.5) e o cadastro Lei do Bem do Pulso | [`01-formpd.md`](01-formpd.md) |
| Delimitar o que é P&D e o que é rotina; cruzar Frascati e as 12 perguntas da triagem | [`02-escopo-e-frascati.md`](02-escopo-e-frascati.md) |
| Inventário de artefatos (POC, arquitetura, git, testes, QA) | [`03-catalogo.md`](03-catalogo.md) |
| Iterações, PRs, migrations e retrabalhos | [`04-linha-do-tempo.md`](04-linha-do-tempo.md) |
| Testes, validações, tratamento de erros e incertezas ainda abertas | [`05-testes-qa-erros.md`](05-testes-qa-erros.md) |

Documentos-fonte já existentes no repositório, citados ao longo do dossiê:

- `docs/PRD.md` — requisitos
- `docs/DECISOES.md` — Tree of Thought (D1–D4)
- `docs/AUDITORIA.md` + `docs/PATCH_documentacao.md` — diagnóstico pré-código
- `docs/QUESTIONAMENTOS.md` — sete questionamentos técnicos com evidência no código
- `docs/metodologia-executiva.md` / `docs/metodologia-grupo.md` / `docs/fluxograma.md`
- `supabase/migrations/0001` … `0014`
- `src/lib/lei-do-bem.ts` + `src/lib/lei-do-bem.test.ts`

---

## Síntese executiva

O Pulso nasceu da insuficiência de planilha + HTML estático para governar **161 iniciativas**, **~1.995 h/mês** devolvidas e **31 setores reais**. Ferramentas de prateleira (ClickUp, Bitrix, n8n, Power BI) cobrem canal, tarefa ou BI — não cobrem, ao mesmo tempo, a metodologia Senff, autorização que não vive no cliente, reconciliação institucional dos números e triagem Lei do Bem com as fórmulas B27–B30.

O desenvolvimento experimental concentrou-se em cinco barreiras tecnológicas:

1. **Três relógios no lugar de um** — o CSV tinha só data de cadastro; o semáforo de *atualização* exige `created_at` ≠ `updated_at` ≠ `last_activity_at`.
2. **Escalas de score incompatíveis** — legado 5–65 versus matriz 1–5; importar direto classificaria 100% como prioridade alta.
3. **Autorização em camadas** — papel no Postgres, nunca em `user_metadata`/JWT; convite com SHA-256; RLS como garantia.
4. **Motor de triagem Lei do Bem duplicado** — TypeScript e trigger PL/pgSQL com as mesmas fórmulas da planilha, sem bloquear o cadastro.
5. **Gate de metodologia versus dado real** — o trigger `score ≥ 3,0` foi implementado, colidiu com a retirada da Matriz e teve de ser desligado (`0013`/`0014`).

O que ficou **fora** do escopo elegível está em [`02-escopo-e-frascati.md`](02-escopo-e-frascati.md): paginação, troca de `input` por `textarea`, skin de tema, copy de convite, hospedagem Vercel e parametrização de webhook.

---

## Aviso

Trata-se de dossiê técnico interno. A classificação final (enquadrado / não enquadrado) é da auditoria humana, fiscal e documental — a mesma regra que a aba `/lei-do-bem` já declara na interface.
