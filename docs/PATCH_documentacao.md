# Patch de documentação — correções da auditoria
*Base: `pulsoimproved.html` recebido em 12/08/2026. Cada item traz o texto a substituir.*

---

## Status dos pontos após a chegada do arquivo de referência

| # | Ponto | Situação |
|---|---|---|
| B1 | Arquivo de referência ausente | ✅ **Resolvido** — e a auditoria do PRD §11 estava correta em todos os itens |
| B2 | Identidade visual contraditória | ✅ **Resolvido pelo arquivo** — ver §1 abaixo |
| B4 | Schema HTML ≠ CSV | ✅ **Resolvido** — o dataset real tem `t`(tema), `p`(potencial), `sc`(score), `n8n` |
| A3 | "32 setores" não reproduzível | ✅ **Resolvido com ressalva** — ver §2 |
| D3 | Paleta incompleta no prompt | ✅ **Resolvido** — `styles/design-tokens.css` |
| C3 | Semáforo explode | 🔴 **Confirmado e pior que o estimado** — ver §3 |
| C1, C2 | Pipeline e score | 🟡 Resolvidos na migration `0001_pulso_schema.sql` |
| A2 | Definição de horas | 🟡 Fixada na view; falta o texto — ver §4 |
| D2, E1–E5, F1, F2 | — | 🟡 Patches abaixo |

### Validação do PRD §11 contra o arquivo real
Todas as afirmações conferem, uma a uma: **21** usos de `innerHTML`, **6** media queries, `role="tab"` (5) e `aria-selected` (4), **0** `aria-live`, **0** `noscript`, sliders `type="range"` (4), export CSV presente, filtros `fTema`/`fSetor`/`fDir`/`fStatus`/`fPot`/`fIA`, view `#v-dash`, e `DATA.meta.ref = "2026-08-11"` congelada. **Nenhuma correção necessária no §11.**

---

## 1. B2 — Identidade visual: a contradição não existia

O `pulsoimproved.html` já implementa o design system Senff corretamente, com um bloco `:root` completo: `--navy:#0F2467`, `--navy-deep:#0B1C54`, `--blue:#1D58EE`, `--blue-2:#173288`, `--yellow:#F0C21D`, escala de neutros idêntica à do Design System (`#26292C` … `#F6F7F9`), semântica de sinal, paleta categórica de 8 cores para gráficos e tema escuro completo. Fontes: Poppins + IBM Plex Mono via `--ff`/`--fm`.

O que eu apontei como contradição era o `dashboard_light.html` (Inter + paleta Tailwind). **Ele não é o arquivo de referência** — é um MVP anterior. Recomendo removê-lo do projeto ou renomeá-lo para `_legacy_dashboard_mvp.html`, para não induzir o Claude Code ao erro.

**Uma decisão real permanece:** o arquivo trata **escuro como padrão** e claro como opt-in (`:root:not([data-theme="light"])`). Para um sistema corporativo o inverso é mais seguro.

> **Patch no prompt mestre**, seção Dashboard, acrescentar:
> `Use styles/design-tokens.css como fonte única de cores e tipografia — nenhum hexadecimal literal no código. Inverta a lógica de tema em relação ao HTML de referência: claro é o padrão, escuro é opt-in via data-theme="dark" ou prefers-color-scheme.`

---

## 2. A3 — "32 setores": de onde vem e por que precisa de ressalva

O número vem do arquivo de referência, que já consolida as 39 grafias do CSV em **32 valores distintos de `s`**. O de-para está reproduzido na tabela `area_aliases` da migration.

**A ressalva:** um dos 32 é o literal **"Não informado"**. O número honesto de setores com iniciativa é **31**.

> **Patch em `manifesto.md`** (tabela "O que já fizemos"):
> `| Setores com iniciativa | **31** |`
>
> **Patch em `PRD_v3.md` §1 e no Resumo Executivo:** trocar "32 setores com iniciativa" por "31 setores com iniciativa". A view `v_portfolio_kpis` já exclui o placeholder via `is_real_area`.

---

## 3. C3 — Confirmado, e mais grave do que eu estimei

O arquivo de referência **pré-calcula e embute** a idade de cada iniciativa (`"age": 260`) contra `meta.ref = "2026-08-11"`. Não é só que a data está congelada — é que o número está gravado no arquivo.

Rodando a própria função `sigOf()` do arquivo sobre os próprios dados, na própria data de referência dele:

| Sinal | Iniciativas ativas |
|---|---|
| 🟢 Em dia (≤30d) | **0** |
| 🟡 Atenção (31–90d) | **0** |
| 🔴 Crítico (>90d) | **56 de 56 — 100%** |

Idade mínima entre as ativas: **92 dias**. As 105 concluídas viram `done` e saem da conta, o que está correto — mas isso significa que **o semáforo do dashboard já não tem um único ponto verde hoje**, e nunca terá, porque `d` é a data de cadastro no portfólio, não a de última atualização.

> **Patch em `PRD_v3.md` §4**, substituir o item (a):
> `(a) o semáforo mede tempo desde a última atualização substantiva (projects.last_activity_at), calculado dinamicamente pela data corrente — nunca a idade do registro nem uma data de referência congelada. Na carga inicial, last_activity_at das 161 iniciativas herdadas é semeada com a data do go-live; sem isso, 56 de 56 iniciativas ativas abrem em vermelho e o alerta de 14 dias dispara para 100% do portfólio.`
>
> **Patch em `PRD_v3.md` §6**, modelo de dados: `projects` ganha `last_activity_at timestamptz` e `is_legacy_import boolean`, distintos de `created_at`/`updated_at`.

---

## 4. A2 — Definição de "horas devolvidas"

Confirmado nas duas fontes: 1.994,7h considerando **apenas iniciativas concluídas**; 2.309,7h considerando o portfólio inteiro.

> **Patch em `PRD_v3.md` §7** (regras de negócio críticas), acrescentar:
> `Horas devolvidas ao time = Σ de hours_saved_month apenas das iniciativas em estágio "concluído" (Metodologia Executiva §6.1). O total do portfólio (2.309,7h) é indicador separado e não substitui o número publicado.`

---

## 5. D2 — IBM Plex Mono não está no Design System

Zero ocorrências nos três arquivos do Design System (só Poppins, em 59 declarações). No `pulsoimproved.html` ela é usada como fonte monoespaçada para dados numéricos — uso legítimo, mas não homologado pela marca.

**Decisão necessária:** homologar como fonte técnica secundária ou substituir. Se substituir, `--fm: ui-monospace, 'SF Mono', Consolas, monospace` resolve sem carregar webfont extra e sem quebrar o alinhamento tabular.

---

## 6. E1 — Resumo Executivo desatualizado

> **Patch no Resumo Executivo, seção Entrega:** trocar "Prompt mestre v2" e "PRD v2" por **v3**, e acrescentar aos entregáveis: `metodologia-executiva.md`, `design-tokens.css` e a migration `0001_pulso_schema.sql`.

Também vale corrigir o KPI de setores (§2) e a arquitetura, que ainda não menciona a separação `last_activity_at`.

## 7. E2 — Fluxogramas divergentes

`fluxograma.md` está desatualizado em relação ao diagrama do Resumo Executivo: falta o Report Executivo Quinzenal e o recálculo de KPIs, e usa "presente/ausente" onde o PRD define três estados.

> **Patch em `fluxograma.md`:** trocar o nó `V[Confirma presença: presente/ausente]` por `V[Confirma presença: pending → present/absent]` e acrescentar ao final:
> ```
> X --> Y[Report Executivo Quinzenal — n8n + Supabase]
> Y --> Z[Diretoria: saúde do portfólio, destaques, decisões pendentes]
> ```

## 8. E3 — Nomenclatura

Padronizar em três lugares (vira `slug` de `content_pages` e rótulo de menu):

| Conceito | Nome oficial | Slug |
|---|---|---|
| Documento do grupo operacional | **Metodologia do Grupo** (nome do PDF) | `metodologia-grupo` |
| Documento da diretoria | **Metodologia Executiva** | `metodologia-executiva` |
| Manifesto | **Manifesto** | `manifesto` |

`metodologia.md` deve ser renomeado para `metodologia-grupo.md` e seu título trocado de "Metodologia Geral" para "Metodologia do Grupo".

## 9. E4 — Metodologia Executiva

Resolvido: `docs/metodologia-executiva.md`. Três implicações que precisam entrar no PRD:

- O gate `Backlog → Em Desenvolvimento` exige **score ≥ 3,0** — é validação de CRUD, não texto.
- O estágio **`Cancelado`** precisa existir (a taxa de conclusão depende dele). Já está na migration.
- O **W4** precisa de uma tabela `decisions` (decisão, responsável, prazo, status) que não está no modelo de dados. Sem ela, os blocos "Decisões pendentes" e "Status das decisões anteriores" do report não têm origem.

## 10. E5 — Os PDFs do projeto não são PDFs

`Metodologia_do_Projeto_Pulso.pdf` e `Cópia_de_IA__Abril.pdf` são arquivos **ZIP com páginas em JPEG** (31 e 8 páginas) e OCR em `.txt` ao lado. Não abrem em leitor de PDF e não são pesquisáveis. Se forem alimentar o RAG com pgvector na fase 6, precisam ser reexportados — ou basta indexar os `.md` derivados, que agora existem para os dois documentos.

## 11. F1 e F2 — Higiene de dados

- **F1** resolvido na migration (`parse_legacy_date` tolera ISO e MM/DD/YYYY; há 1 registro em formato americano).
- **F2** decisão pendente: `Economia R$` está preenchida em **12 de 161** registros (7%). O KPI **"ROI ≥ 3x"** da Metodologia Executiva é incalculável nessa cobertura.

> **Recomendação:** tirar ROI do dashboard do MVP e deixá-lo no report executivo como campo manual, ou tornar `cost_saved_month` obrigatório no CRUD a partir do go-live e exibir o ROI apenas sobre a safra nova, com a amostra declarada ("ROI calculado sobre 12 de 161 iniciativas").

Vale também propagar ao rodapé do dashboard a ressalva que já está na linha 2 do CSV e não aparece em documento nenhum: *o score do portfólio é direcional e não representa ROI validado*.

---

## Ordem de execução

1. Remover ou renomear `dashboard_light.html` (evita que o Claude Code use o arquivo errado)
2. Aplicar `0001_pulso_schema.sql` e o `update` de semeadura do §6 da migration
3. Adicionar `design-tokens.css` e o patch do prompt (§1)
4. Aplicar os patches de texto: A3 (§2), C3 (§3), A2 (§4), E1–E3 (§6–8)
5. Decidir D2 (§5) e F2 (§11)
6. Modelar `decisions` antes de encostar no W4
