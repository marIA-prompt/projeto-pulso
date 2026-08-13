# Auditoria de Consistência — Documentação do Sistema Pulso
*Data da auditoria: 12/08/2026 · Escopo: manifesto.md, metodologia.md, PRD_v3.md, fluxograma.md, prompt mestre, Resumo Executivo v2, Contexto do Projeto, Metodologia (PDF), dashboard_light.html, Design System, base tratada do portfólio*

---

## Veredito

A narrativa está sólida e os documentos conversam bem entre si. Os problemas não estão na história — estão em **três pontos de contato com a realidade**:

1. O arquivo de dashboard descrito no PRD e no prompt mestre **não é o arquivo que está no projeto**.
2. A base de dados real **não suporta** duas regras centrais do produto (pipeline de 7 estágios e Matriz de 4 Eixos) sem um de-para explícito.
3. O semáforo e o alerta de 14 dias, como especificados, **disparam para praticamente 100% do portfólio no dia do lançamento**.

Severidade: 🔴 bloqueia implementação · 🟡 corrigir antes de codar · 🟢 ajuste editorial

---

## Bloco A — Números institucionais

### A1 🟢 "161 iniciativas" — confere
Verificado nas duas fontes: 161 linhas úteis no CSV e 161 registros no `RAW_DATA` do `dashboard_light.html`. Números idênticos, sem divergência.

### A2 🟡 "1.995h/mês" — confere, mas a definição não está escrita em lugar nenhum
O número reconcilia como **1.994,7h = soma de `Horas/mês` apenas das iniciativas com status "Concluído"** (105 iniciativas, das quais só 55 têm o campo preenchido).

A fórmula está correta e bate com a Metodologia Executiva (p.8): *"Σ horas/mês de todas as iniciativas concluídas"*. O problema é que **nenhum documento voltado ao público diz isso** — manifesto, PRD e Resumo Executivo falam apenas em "horas devolvidas ao time por mês".

Consequência prática: se a view SQL do dashboard somar tudo, o número vira **2.309,7h** e o indicador público muda de um dia para o outro sem explicação. Se somar Concluído + Em andamento, vira 2.229,7h.

**Ação:** fixar a definição no PRD §7 e no comentário da view SQL.

### A3 🔴 "32 setores" — não é reproduzível a partir da base
Nenhum caminho de cálculo chega a 32:

| Critério | Resultado |
|---|---|
| Strings distintas em `Setor` | 39 |
| Após normalizar caixa e acento | 36 |
| Excluindo "Não informado" | 35 |
| Após consolidação semântica agressiva | ~24 |

A base tem duplicatas reais: `FROTA`/`Frota`, `RH`/`Rh`, `Credito PJ`/`Crédito PJ`, e **seis variantes** do cluster Compras/Manutenção/Zeladoria (`COMPRAS, FROTA E ZELADORIA`, `COMPRAS, MANUENÇÃO E ZELADORIA`, `MANUTENÇÃO/COMPRAS E ZELADORIA`, `ZELADORIA E COMPRAS`, `Compras, Manutenção e Zeladoria`, `Compras, Frota e Zeladoria`). Também há 5 subdepartamentos de Controladoria que podem contar como 1 ou 5.

O 32 provavelmente veio de uma consolidação manual que não ficou registrada. **Ação:** criar tabela `areas` canônica com de-para, e recalcular o número antes de publicá-lo de novo.

### A4 🟡 "+80 colaboradores" — universos diferentes, não declarados
A base tem **48 responsáveis distintos** e **11 diretores**. Os +80 são participantes do grupo (presença nos encontros), não donos de iniciativa. São métricas diferentes e nenhum documento explicita isso.

Impacto no sistema: o dashboard não tem fonte para "colaboradores engajados" — `profiles` só terá gente convidada, e no dia 1 esse KPI será próximo de zero. **Ação:** ou marcar o KPI como manual/seed, ou trocá-lo por "participantes ativos nos últimos N encontros".

### A5 🟢 Camadas de participação somam mais que a base atual
`metodologia.md` §2: ~20–25 + ~40–50 + ~40–50 = 100–125 pessoas, contra os +80 atuais. Está correto — a tabela descreve o estado-alvo (meta de 120), como o PDF deixa claro. Só falta uma nota de uma linha no .md dizendo isso.

### A6 🟢 Contexto do Projeto é deliberadamente vago
O `Contexto___Projeto_PULSO` diz "Dezenas de setores" e "Milhares de horas/mês" onde os outros documentos cravam 32 e 1.995h. Não é erro — é prudência editorial. Vale alinhar depois que A2 e A3 forem resolvidos.

---

## Bloco B — O dashboard de referência (mais grave)

### B1 🔴 O PRD descreve um arquivo que não está no projeto
`PRD_v3.md` §4 e §11 e o prompt mestre descrevem em detalhe um HTML com duas abas, semáforo com sliders e export CSV. O arquivo disponível (`dashboard_light.html`) **não tem nada disso**. Verificação direta no arquivo:

| O que o PRD/prompt afirmam | O que existe em `dashboard_light.html` |
|---|---|
| Duas abas ("Metodologia" e "Acompanhamento"), `role="tablist"`, `aria-selected` | **0** ocorrências de `role="tab"`. Não há abas. |
| View `#v-dash` | **0** ocorrências |
| Semáforo com limites ajustáveis por slider (30/90 dias) | **0** ocorrências de "semáforo"; **0** de `type="range"` |
| Exportação CSV da visão filtrada | **0** ocorrências |
| Filtros: tema, setor, diretoria, status, potencial, uso de IA | Apenas **5** selects: `f-setor`, `f-status`, `f-diretor`, `f-usoia`, `f-mes`. **Não há tema nem potencial.** |
| Idade "congelada em 11/08/2026" a corrigir | **0** ocorrências de `new Date` / `Date.now`. Não há aritmética de data nenhuma. |
| 21 usos de `innerHTML` | **5** |
| 6 media queries | **2** |
| Linha do tempo estilo ECG, donut, barras por tema | Não confirmados; não há campo `tema` no dataset |

**Ação:** ou o arquivo correto (`pulsoimproved`) é localizado e adicionado ao projeto, ou o PRD §4/§11 e o prompt mestre precisam ser reescritos contra `dashboard_light.html`. Do jeito que está, o Claude Code vai procurar funcionalidades inexistentes e alucinar o resto.

### B2 🔴 A identidade visual afirmada não é a do arquivo
O PRD diz *"Identidade visual preservada: paleta navy/azul Senff, Poppins + IBM Plex Mono"*. O `dashboard_light.html` usa:

- Fonte: **Inter** (`'Inter','Segoe UI', Roboto, Arial`) — não Poppins
- Paleta: tons Tailwind genéricos (`#2563eb`, `#059669`, `#64748b`, `#1e293b`, `#f4f6fb`)
- **Zero** ocorrências de `#0F2467`, `#1D58EE` ou `#F0C21D`

"Preservar a identidade visual do HTML de referência" e "usar o design system Senff" são, neste arquivo, instruções **contraditórias**. Precisa escolher uma.

### B3 🟡 A referência tem três nomes diferentes
`pulsoimproved` (PRD §4) · `reference/dashboard.html` (prompt mestre) · `dashboard_light.html` (arquivo real). O prompt mestre inclusive já prevê o caso do arquivo não existir — o que sugere que essa inconsistência já era conhecida.

### B4 🔴 O schema do HTML e o do CSV divergem
O `RAW_DATA` do HTML tem 17 campos e **não inclui** `tema`, `Score`, `Potencial` nem `n8n` — que existem no CSV e são exigidos pelos filtros do PRD e pela Matriz de 4 Eixos. O CSV é a fonte mais rica; o HTML é um subconjunto. A migração para Supabase deve partir do CSV, não do HTML.

---

## Bloco C — Modelo de dados vs. base real

### C1 🔴 Pipeline de 7 estágios × 3 status reais
Todos os documentos definem `Ideia → Backlog → Priorização → Em Desenvolvimento → Em Teste → Concluído → Showcase`. A base tem apenas:

- **Concluído** — 105
- **Em andamento** — 53
- **Em acompanhamento** — 3 ← *não existe no pipeline*

Não há uma única iniciativa em Ideia, Backlog, Priorização, Em Teste ou Showcase. **Ação:** definir o de-para na migration (provavelmente `Em andamento → Em Desenvolvimento` e `Em acompanhamento → Em Teste`) e aceitar que 5 dos 7 estágios nascem vazios.

### C2 🔴 A escala de score é incompatível
| | Matriz de 4 Eixos (docs) | Coluna `Score` (base) |
|---|---|---|
| Escala | 1 a 5 por eixo | inteiros de **5 a 65** |
| Score final | 1,0 a 5,0 | mediana **15** |
| Cortes | ≥4,0 Alta · 3,0–3,9 Média · <3,0 Backlog | — |
| Classificação existente | — | `Potencial`: base 115 · média 35 · alta 11 |

Importando direto, **100% das iniciativas cairia como "Prioridade Alta"** (todo score ≥ 5 é > 4,0). E o cabeçalho do próprio CSV avisa que o score existente *é direcional e não representa ROI validado* — ressalva que não aparece em nenhum documento, apesar de o score ser o motor da priorização.

**Ação:** decidir entre (a) re-scorar as 161 iniciativas na nova matriz, (b) importar `Potencial` como classificação e deixar os 4 eixos nulos até serem preenchidos, ou (c) normalizar `Score` para 1–5. A opção (b) é a única que não exige trabalho manual imediato.

### C3 🔴 O semáforo e o alerta explodem no dia 1
Este é o achado mais consequente. O campo `Data` é a **data de registro**, não a de última atualização. Com hoje = 12/08/2026 e a data mais recente da base = 01/07/2026:

- Idade mínima: **42 dias** · mediana: **260 dias** · máxima: **315 dias**
- Regra do semáforo (≤30 em dia · 31–90 atenção · >90 crítico): **0 em dia · 1 atenção · 160 críticos (99%)**
- Regra de alerta ">14 dias sem atualização": **161 de 161 (100%)**

O dashboard abriria com uma parede de vermelho e o alerta perderia toda a credibilidade na primeira semana de uso.

**Ação:** separar `created_at` / `start_date` de `updated_at` no modelo, semear `updated_at` na migração (ex.: data do go-live para o acervo histórico) e deixar explícito no PRD que o semáforo mede *atualização*, não *idade*.

---

## Bloco D — Design system

### D1 🟢 Poppins e as três cores estão confirmadas
`#0F2467`, `#1D58EE` e `#F0C21D` aparecem no arquivo de cores e Poppins é a única família tipográfica do design system (59 declarações). O prompt mestre acertou.

### D2 🟡 IBM Plex Mono não existe no design system
Zero ocorrências nos três arquivos do design system. É uma escolha do dashboard, não da marca. Precisa ser homologada ou substituída antes de virar token do sistema.

### D3 🟡 A paleta do prompt é incompleta
O design system tem navies que aparecem **mais** que o `#0F2467` (3×): `#173288` (7×) e `#0B1C54` (4×), além de uma escala de neutros bem definida (`#EDEFF3`, `#8A8A99`, `#4C4C56`, `#C7CCD2`) e cores semânticas (`#D72727`, `#E06D36`). O prompt entrega só 3 tokens — o Claude Code vai inventar o resto. **Ação:** extrair a paleta completa para um bloco de design tokens antes de rodar o prompt.

---

## Bloco E — Versionamento e nomenclatura

### E1 🟡 Resumo Executivo desatualizado
O `Resumo_Executivo_Sistema_Pulso_v2.pdf` cita "Prompt mestre **v2**" e "**PRD v2**" na seção Entrega. O PRD em mãos é **v3**. Se o resumo é o documento que circula com a diretoria, ele está descrevendo entregáveis de uma versão anterior.

### E2 🟡 Dois fluxogramas divergentes
O `fluxograma.md` (Mermaid) **não contém** o Report Executivo Quinzenal nem o recálculo de KPIs — que aparecem no fluxograma do Resumo Executivo. Além disso o Mermaid usa "presente/ausente" enquanto o PRD define três estados (`pending`/`present`/`absent`). São versões diferentes do mesmo diagrama.

### E3 🟡 O mesmo documento tem três nomes
| Fonte | Nome usado |
|---|---|
| PDF | "Metodologia do Grupo" / "Metodologia Executiva" |
| metodologia.md | "Metodologia Geral" / "Camada Executiva" (§11) |
| PRD, prompt, Resumo | "Metodologia Geral" / "Metodologia Executiva" |

Isso vira `slug` em `content_pages` e rótulo de menu. **Ação:** padronizar antes do seed.

### E4 🔴 A Metodologia Executiva não virou documento-fonte
O PDF contém **dois** documentos: Metodologia Executiva (pp. 1–12) e Metodologia do Grupo (pp. 13–31). Só a segunda virou `metodologia.md`. A Executiva completa — RACI, matriz de escalação, gates de passagem do ciclo de vida, níveis de maturidade 1–5, cronograma S1–S8, template do report — **não existe em nenhum .md**, e nem o PRD nem o prompt preveem página para ela.

Isso é um problema direto: o **W4 (Report Executivo Quinzenal)** depende do template e das regras que estão só nesse PDF, e os gates de passagem do pipeline (ex.: *"Backlog → Em Desenvolvimento exige score ≥ 3.0 + recurso disponível"*) são regra de negócio que deveria estar no PRD §7.

### E5 🟡 Os dois "PDFs" do projeto não são PDFs
`Metodologia_do_Projeto_Pulso.pdf` e `Cópia_de_IA__Abril.pdf` são, na verdade, **arquivos ZIP contendo páginas em JPEG** (31 e 8 páginas) com OCR em .txt ao lado. Não abrem como PDF e não são pesquisáveis. Se servem de fonte de verdade para o seed ou para o RAG futuro com pgvector, precisam ser reexportados como PDF real ou convertidos em markdown.

---

## Bloco F — Qualidade da base

### F1 🟡 Formato de data misto
160 registros em ISO (`2025-11-24`) e **1 em formato americano** (`12/23/2025`). Um parser ingênuo quebra ou interpreta errado. Tratar na migration.

### F2 🟡 Cobertura de campos críticos é baixa
| Campo | Preenchimento |
|---|---|
| `Horas/mês` | 75 / 161 (47%) |
| `Economia R$` | 12 / 161 (7%) |
| `Setor` = "Não informado" | 1 registro |
| `Diretor` = "Não informado" | 1 registro |

O KPI **"ROI ≥ 3x"** da Metodologia Executiva é incalculável com 7% de cobertura de custo. Ou o campo vira obrigatório no CRUD, ou o KPI sai do dashboard do MVP.

### F3 🟢 Ressalva do CSV não propagada
A segunda linha do CSV traz uma ressalva importante — que o score é direcional e não representa ROI validado. Ela não aparece em nenhum documento nem está prevista no dashboard. Vale exibi-la como nota de rodapé no painel.

---

## Ordem de correção sugerida

**Antes de rodar o prompt mestre:**
1. Resolver B1 — localizar o `pulsoimproved` ou reescrever PRD §4/§11 contra o arquivo real
2. Resolver B2 — decidir entre identidade do HTML e design system (e responder D2)
3. Resolver C3 — separar `updated_at` de `created_at` e definir a semeadura
4. Resolver C1 e C2 — escrever os de-para de status e de score na migration
5. Extrair D3 — bloco de design tokens completo para o prompt

**Antes de publicar os conteúdos:**
6. A2 e A3 — fixar a definição de horas e recalcular setores
7. E4 — transformar a Metodologia Executiva em `docs/metodologia-executiva.md`
8. E1, E2, E3 — realinhar versões, fluxograma e nomenclatura

**Higiene de dados (pode ser paralelo):**
9. F1, F2 — normalizar datas e definir obrigatoriedade de campos
10. E5 — reexportar os PDFs

---

*Todos os números deste relatório foram calculados diretamente sobre `Portfólio__IAAutomacoes_Organizado__Base_Tratada.csv`, `dashboard_light.html` e os arquivos do Design System, não inferidos dos documentos.*
