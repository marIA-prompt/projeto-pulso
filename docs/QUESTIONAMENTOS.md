# Questionamentos técnicos — Sistema Pulso (Senff)

Respostas fundamentadas no código, nas migrations e na documentação do repositório (`projeto-pulso`). Cada afirmação aponta a evidência.

---

## 1. Qual problema tecnológico a plataforma precisava resolver e por que ferramentas prontas eram insuficientes

### O problema

O Pulso já existia como movimento operacional da Senff — **+80 colaboradores**, **161 iniciativas**, **~1.995 h/mês** devolvidas, **31 setores reais** com iniciativa — mas o acompanhamento era **disperso e estático**. Os artefatos de origem não eram um sistema:

| Fonte herdada | O que era | Limite tecnológico |
|---|---|---|
| CSV `Portfólio__IAAutomacoes_Organizado__Base_Tratada.csv` | 161 linhas, 39 grafias de setor, score 5–65, 1 data em formato americano | Planilha: sem dono autenticado, sem RLS, sem cadência de atualização |
| `pulsoimproved.html` | Dashboard com dataset **embutido** (~160 KB), idades **congeladas** em `2026-08-11`, 21 `innerHTML` | HTML de uma página: dado envelhece no arquivo; XSS ao sair do CSV estático; sem login |
| PDFs da metodologia | Na prática, **ZIP com JPEGs** + OCR em `.txt` | Não pesquisáveis, não versionáveis, não alimentam regra de negócio |
| Planilha `Triagem_Preliminar_Lei_do_Bem_Simples` | Fórmulas B27–B30 da Lei 11.196/2005 | Classificação fiscal/P&D isolada do portfólio |
| Bitrix / Teams / ClickUp | Canais e kanban genéricos já usados pelo grupo | Comunicação e tarefa, não governança do programa |

O PRD resume o gap: centralizar Manifesto, Metodologias, dashboard interativo, frequências e cadastro de iniciativas, com acesso restrito a colaboradores Senff e Área Admin. Sem isso, a reunião semanal projetava um painel que **mentia no dia seguinte** (idade congelada) e a diretoria não tinha origem única para horas, alerta de 14 dias e decisões pendentes.

### Por que ferramentas prontas não bastavam

O grupo já usa n8n, ClickUp, Bitrix e Power Automate (Metodologia do Grupo §6). Nenhuma cobre o conjunto que o Pulso exige **ao mesmo tempo**:

1. **Regras da metodologia Senff, não de um kanban genérico.** Pipeline de 7 estágios + `cancelado`, semáforo de *atualização* (não de idade do card), alerta >14 dias, RACI executivo, Matriz de 4 Eixos com pesos 35/25/25/15 e — depois — triagem Lei do Bem com 12 itens e bloqueios duros. ClickUp/Jira não expressam isso sem virar um emaranhado de campos customizados sem RLS nem auditoria de papel.

2. **Autorização que não pode viver no cliente.** Convite com papel, 5 níveis mapeados ao RACI (leitor → administrador), e a regra explícita: *nenhuma decisão de autorização depende só de código da aplicação*. O `inviteUserByEmail` do Supabase foi avaliado e **descartado** porque o papel em `user_metadata` é gravável pelo usuário (D1). SSO corporativo ficou fora do MVP, então o produto precisava do próprio ciclo de convite + hash SHA-256 + cadastro `@senff.com.br`.

3. **Dado institucional reconciliado, não um BI em cima da planilha.** “32 setores” não reproduzia a partir da base (39 grafias; 31 reais após de-para). “1.995 h/mês” só bate se a soma for **apenas concluídas**. Um Looker/Power BI sobre o CSV publicaria o número errado no dia 1 e não impediria membro de editar iniciativa alheia.

4. **Integração opcional, operação não bloqueada.** E-mail de convite, lembrete de presença e report quinzenal saem pelo n8n **se** o webhook existir. Ferramenta pronta que *depende* do conector cairia junto com o n8n; o Pulso cria o convite mesmo assim e mostra o link copiável.

5. **Identidade e conteúdo da Senff.** Paleta navy/azul/amarelo (`#0F2467`, `#1D58EE`, `#F0C21D`), Manifesto e metodologias oficiais, domínio `@senff.com.br`. Um template de intranet não carrega isso como regra, só como skin.

---

## 2. Arquitetura da solução, integrações, base de dados, automações e regras de negócio

### Stack

```
Navegador  →  Next.js 14 (App Router, Server Actions) na Vercel
                 │
                 ├── middleware (sessão + redirect)
                 ├── checagem por página (requireUser / requireGerencial / requireAdmin)
                 └── cliente Supabase (anon) + service-role só no servidor
                        │
                        ▼
              Supabase: Auth · Postgres · RLS · Storage (avatars)
                        │
                        └── n8n (opcional): W1–W4 puxam ou recebem webhook
```

Defesa em camadas (D4): middleware para a pessoa, guarda de página para a UX, RLS para o atacante. A `SUPABASE_SERVICE_ROLE_KEY` não leva prefixo `NEXT_PUBLIC_` e entra em aceite de convite, criação de encontro em massa e cadastro `@senff.com.br`.

### Módulos da aplicação

| Rota | Função |
|---|---|
| `/login`, `/cadastro`, `/convite/[token]` | Entrada: senha, auto-cadastro `@senff.com.br`, aceite de convite |
| `/dashboard` | Acompanhamento: KPIs, semáforo, filtros, donut/barras/ECG, CSV |
| `/projetos` | Lista + Kanban, CRUD, proprietário, saúde |
| `/lei-do-bem` | Auditoria gerencial da triagem (Lei 11.196/2005) |
| `/comunidade` | Hub de perfis, skills, avatares |
| `/frequencias` | Encontros, RSVP, consolidado, export CSV |
| `/manifesto`, `/metodologia/[slug]` | Conteúdo oficial em `content_pages` |
| `/admin` | Convites, papéis, encontros |

### Base de dados (Postgres)

**Núcleo (`0001`):** `areas` + `area_aliases` (de-para das 39 grafias), `profiles`, `invitations` (token em SHA-256, nunca em claro), `meetings`, `attendance` (UNIQUE meeting+user), `projects`, `content_pages`.

**Governança (`0003`):** papéis em 5 níveis; `projects.health` independente do estágio; `decisions` para o report W4; views `v_health_alerts`, `v_decisions_pendentes`, `v_cycle_time`.

**Comunidade (`0008`):** skills/interesses em arrays GIN, bucket `avatars`.

**Lei do Bem (`0010`):** `lei_do_bem_avaliacoes` 1:1 com `projects`, `lei_do_bem_status_log`, view `v_lei_do_bem`, trigger que replica B27–B30.

**Views de operação:** `v_portfolio_kpis` (horas só de `concluido`), `v_projects_dashboard` (semáforo + alerta 14 dias), `v_attendance_kpis` (confirmação **e** presença, lado a lado).

### Integrações

| Canal | Papel | Estado |
|---|---|---|
| **n8n W1** | Convite criado/reenviado → `{ email, role, link }` | Implementado; ausência não bloqueia |
| **n8n W2** | Encontro criado → lembrete 24 h | Implementado |
| **n8n W3** | Cron de quinta consulta `alerta_14_dias` | Puxado pelo n8n, não empurrado pelo app |
| **n8n W4** | Cron quinzenal: KPIs + decisões | Depende de `decisions`; tabela existe |
| **n8n W5 / Bitrix** | Sincronização futura com o CRM/canais | Fora do MVP |
| **ClickUp** | Flag `enviar_clickup` na Lei do Bem | Intenção gravada; sync real é 2ª parte |
| **Vercel + Supabase Auth** | Hosting, redirect URLs, recuperação de senha | Produção |

Falha de webhook **nunca** derruba a operação (`src/lib/n8n.ts`, timeout 5 s, retorno `false`).

### Regras de negócio implementadas

- **Acesso:** conta com convite válido **ou** auto-cadastro com e-mail `@senff.com.br` (evolução posterior ao PRD original, que era só-convite). Papel não sobe sozinho: trigger `prevent_self_role_escalation`.
- **Papéis:** leitor (só lê) · participante (suas iniciativas e presença) · editor (conteúdo) · gerencial (portfólio, encontros, decisões, Lei do Bem) · administrador (convites e papéis). Gerencial não minta gerencial/admin via convite.
- **Propriedade:** dono ou gerencial+ edita; sem DELETE físico (revogação / `archived_at`).
- **Semáforo:** mede `last_activity_at` (atualização substantiva), defaults ≤30 / 31–90 / >90; sliders na UI; estado na querystring.
- **Alerta 14 dias:** iniciativas ativas sem atualização — mesma regra da reunião e do W4.
- **Horas devolvidas:** Σ `hours_saved_month` **somente** `stage = concluido` (1.994,7 h na base; o total 2.309,7 h é indicador separado).
- **Áreas:** KPI exclui `is_real_area = false` (“Não informado”).
- **Score legado ≠ matriz:** eixos 1–5 nulos na herança; `legacy_score` 5–65 guardado à parte; `scoring_source`.
- **Saúde ≠ estágio:** `em_risco` / `impedido` / `estacionado` alimenta o Fórum de Desbloqueio sem tirar o card do pipeline.
- **Lei do Bem:** 12 respostas; índice `(2×Sim + Parcialmente) / 24`; “Não sei” → informações insuficientes; “Não” nos itens 3, 4, 5, 6, 9, 10, 11 → baixo potencial (bloqueio da fórmula, **não** do cadastro). Classificação preliminar, revisão humana obrigatória.
- **Frequência MVP:** RSVP (`pending` / `present` / `absent`); `confirmed_at` separado para check-in futuro.

---

## 3. Hipóteses técnicas avaliadas e alternativas descartadas

Documentadas em `docs/DECISOES.md` (Tree of Thought) e nas migrations.

### D1 — Fluxo de convite

| Ramo | Hipótese | Por que caiu / ficou |
|---|---|---|
| A | `inviteUserByEmail` do Supabase | Papel em `user_metadata` (dado de cliente); sem auditoria de quem convidou |
| B | Tabela `invitations` pura | Admin travado se o e-mail (n8n) não sair |
| **C (escolhido)** | Tabela própria + conta via service-role após revalidar token + e-mail n8n **com** link copiável | Papel no Postgres; MVP não depende do n8n |

Token em claro só na URL; banco guarda SHA-256.

### D2 — Dashboard

| Ramo | Hipótese | Descarte |
|---|---|---|
| A | Server Components + view a cada slider | Semáforo com dois sliders contínuos = ida ao servidor a cada gesto |
| B | Cliente + RLS agregando em JS | KPIs divergentes; primeira pintura vazia |
| **C** | Servidor entrega views + lista autorizada; cliente filtra/recorta o semáforo em memória | 161 (e milhares) cabem; se passar de ~5.000, paginação server-side sem mudar a UI |

### D3 — Frequências

| Ramo | Hipótese | Descarte |
|---|---|---|
| A (MVP) | RSVP prévio | Alimenta W2 e o planejamento; taxa é de **confirmação**, exibida como tal |
| B | Check-in no dia | Não planeja sala; depende de abrir o app no meio da reunião |
| C | Ambos | Adiado: `confirmed_at` ≠ `status` já permite entrar sem migração destrutiva |

### D4 — Autorização

Middleware-only foi podado (Server Action esquecida abre o banco). RLS-only foi podada (lista vazia sem mensagem). Camadas juntas.

### Outras hipóteses podadas no schema

- **Papel no JWT** (`auth.jwt() ->> 'user_role'`): script anexado de relatoria; D4 já tinha rejeitado — o Postgres não audita claim de cliente (`0003`).
- **`area` / `responsavel` como VARCHAR livre:** reintroduziria as 39 grafias e quebraria “edita só o que é seu”.
- **Saúde misturada no mesmo enum de estágio:** iniciativa impedida “sairia” do pipeline; `health` virou coluna à parte.
- **Score default 0:** classificaria tudo como Backlog sem distinguir “não avaliada”.
- **Importar Score 5–65 na matriz 1–5:** 100% do portfólio viraria Prioridade Alta.
- **Semáforo pela data de cadastro:** 56/56 ativas críticas no go-live (idade mínima 92 dias).
- **SSO corporativo, app nativo, gamificação, RAG/pgvector, edição em tempo real:** fora do MVP (PRD §9).

### Hipótese revertida depois de implementada

O gate `Backlog → Em Desenvolvimento` (score ≥ 3,0) foi **codificado em três lugares** (coluna gerada, trigger `enforce_stage_gate`, `src/lib/scoring.ts`). Quando a Matriz saiu do cadastro, o trigger continuou recusando insert — a hipótese “gate no banco é sempre desejável” perdeu para o uso real. Migrations `0013`/`0014` desligam o trigger; o corte 3,0 permanece só como rótulo histórico.

---

## 4. Falhas, retrabalhos, limitações e ciclos de melhoria

### Falhas encontradas antes de codar (auditoria 12/08/2026)

A auditoria não foi cosmética: três pontos **bloqueavam implementação**.

1. O PRD descrevia `pulsoimproved`; o arquivo no projeto era `dashboard_light.html` (Inter + Tailwind, sem semáforo, sem CSV, sem tema). Implementar contra o arquivo errado alucinaria funcionalidade.
2. Pipeline de 7 estágios × 3 status reais (`Concluído` 105, `Em andamento` 53, `Em acompanhamento` 3). Cinco estágios nasceriam vazios.
3. Semáforo e alerta de 14 dias, se aplicados à data de registro, disparariam para **100%** do acervo.

Outros achados: “32 setores” irreproduzível; ROI ≥ 3× incalculável (custo em 12/161 = 7%); PDFs que não eram PDF; Metodologia Executiva só no JPEG.

### Retrabalhos no produto (histórico de PRs)

Ciclos visíveis no `git log`, do mais estrutural ao mais recente:

| Ciclo | O que quebrou ou pesou | Correção |
|---|---|---|
| Conteúdo executivo | Callout “Extraído do PDF…” publicado para a diretoria; `0005` não limpava em produção | `0007` + `force-dynamic` na página |
| Auth | PRD só-convite × necessidade de onboarding em massa | Cadastro `@senff.com.br` (PR #8), convite deixa de expirar por data |
| UX de listas | Telas longas na reunião | Paginação 10/20, Kanban por raia (PRs #5–#6, #14) |
| Tema | Referência HTML era escuro-primeiro | Claro padrão, escuro opt-in; tokens Senff no sol/lua |
| Proprietário | View do dashboard não expunha dono | `0009` + filtro (PR #9) |
| Lei do Bem | Planilha fora do sistema; SELECT aberto demais; wizard em loop no opt-in; rótulo “bloqueio duro” assustava quem cadastra; vocabulário da pré-triagem gerava falso P&D | `0010`–`0011`, PRs #19–#23, commits de vocabulário |
| Matriz × cadastro | Gate no banco + Matriz retirada da UI = “Não foi possível salvar” | `0013`/`0014`, `projeto-erro.ts` traduz o erro enquanto a migration não roda, PR #24–#25 |
| Comunidade | Badge de nível ilegível no dark | Tokens `chip-fg` (PRs #17–#18) |

### Limitações ainda abertas (README + docs)

- Importação das **161 iniciativas não está automatizada** (de-para pronto: `map_legacy_status`, `area_aliases`, `parse_legacy_date`; falta o script de carga do CSV).
- ROI fora do dashboard de propósito (amostra de 7% engana).
- Check-in no dia não implementado (D3).
- Sync ClickUp e Bitrix (W5) não implementados.
- W3/W4 exigem n8n configurado para o report sair **mesmo ninguém abrindo o sistema**.
- Papel `leitor` e gates de passagem Ideia→Backlog etc. não estão todos no CRUD — vários gates da Executiva continuam processo de reunião, não trigger.

### Padrão dos ciclos

Cada retrabalho segue o mesmo movimento da auditoria original: **descobrir que a regra no papel não cabe no dado real**, isolar o de-para, e recusar “corrigir silenciosamente” (alias sem match falha a carga; score legado não vira matriz; semáforo não usa `created_at`).

---

## 5. Critérios de validação em ambiente real

### Aceite do PRD (checklist verificável)

Não convidado bloqueado · ciclo completo do convite · RLS (participante não edita projeto alheio) · presença refletida na taxa do dashboard · conteúdos reais publicados · build + deploy Vercel · `DECISOES.md` com ToT.

### Reconciliação com a base real (não com o discurso)

Números institucionais só entram no sistema se batem com o CSV/HTML:

| Indicador | Critério de verdade | Como o sistema valida |
|---|---|---|
| 161 iniciativas | 161 linhas úteis no CSV = 161 no `RAW_DATA` | Carga + `v_portfolio_kpis.total_iniciativas` |
| 1.995 h/mês | 1.994,7 h = soma de `Horas/mês` **só Concluído** | View com `filter (where stage = 'concluido')`; somar tudo daria 2.309,7 h — rejeitado |
| 31 setores | 32 grafias consolidadas menos “Não informado” | `areas.is_real_area`; aliases cobrem FROTA/Frota, 6 grafias de Compras/Zeladoria, etc. |
| +80 colaboradores | Participantes do grupo, **não** os 48 responsáveis do CSV | Não se inventa o KPI a partir de `profiles` no dia 1 |

### Go-live do semáforo

Depois de importar o acervo:

```sql
update public.projects
   set last_activity_at = now()
 where is_legacy_import = true;
```

Sem esse passo, 56/56 ativas abrem em vermelho e o alerta de 14 dias perde credibilidade **na primeira reunião**. Critério de aceite operacional: painel do go-live **não** é uma parede vermelha.

### Regras fiscais e de cadastro (testes automatizados)

- `src/lib/lei-do-bem.test.ts` — 12/12 Sim → potencialmente elegível (índice 1,00); Parcialmente → 0,50; “Não” no item 5 ou 11 → baixo potencial com a frase da planilha; “Não sei” prevalece sobre bloqueio; wizard não bloqueia o save.
- `src/lib/cadastro-iniciativa.test.ts` — opt-in Sim avança à triagem; Não pula para revisão; estado vazio **não** reentra na própria etapa (regressão do loop).
- `src/lib/projeto-erro.test.ts` — recusa residual do gate é reconhecida até `0014` rodar em produção.
- `src/lib/nav.test.ts` — aba Lei do Bem só com gerencial+.

### Uso na reunião (ambiente real da Senff)

- Dashboard projetado no bloco **Pulso do Portfólio**: filtros na URL (o link compartilhado abre a mesma visão).
- Semáforo e alerta 14 dias sobre **atualização**, com dono visível.
- Frequência: confirmação e presença lado a lado, para ninguém tratar RSVP como presença física.
- Lei do Bem: triagem **sinaliza**, nunca impede cadastrar; parecer/status só gerencial+.
- Cadastro: somente `@senff.com.br`; senha ≥ 10; área canônica obrigatória.

### O que deliberadamente **não** valida o MVP

ROI ≥ 3× sobre o acervo legado. Score legado como prioridade. Idade do registro como saúde. Contar “Não informado” como setor.

---

## 6. Evidências de customização exclusiva para a Senff

Não é um “portal de inovação” genérico com a logo trocada. O código carrega regras, marca e organograma da Senff.

### Marca e acesso

- Tokens extraídos do Design System Senff e de `pulsoimproved.html`: `--navy #0F2467`, `--blue #1D58EE`, `--yellow #F0C21D`, `--navy-deep #0B1C54`, `--blue-2 #173288` (`src/styles/tokens.css`). Regra: nenhum hex solto na UI.
- Tipografia Poppins (59 declarações no DS) + IBM Plex Mono só para dado tabular.
- Título da aplicação: “Pulso — IA & Automação Senff”; nav e login rotulam **Senff**.
- Auto-cadastro recusa qualquer domínio que não seja `@senff.com.br` (`DOMINIO_SENFF` em `src/app/cadastro/actions.ts`). Bootstrap do 1º admin usa `voce@senff.com.br`.

### Organograma e portfólio reais

- Tabela `areas` com nomes **da Senff**: Banco PJ, Consignado, Private Label, Credenciamento, os cinco departamentos de Controladoria, Financeiro - Tesouraria, Portfólio Projetos Estratégicos, Pós Vendas - Private Label, etc.
- `area_aliases` só faz sentido neste CSV (ex.: `COMPRAS, MANUENÇÃO E ZELADORIA` — grafia com erro — → `Compras, Manutenção e Zeladoria`).
- De-para de status do **vocabulário interno** (“Em acompanhamento” → `em_teste`), não de um framework de mercado.
- Horas 1.994,7 e 31 áreas cravadas em comentários SQL para não “corrigir” o número publicado.

### Metodologia e Lei do Bem

- Manifesto e metodologias oficiais seedados em `content_pages` (crenças, reunião de 60 min, Arena Criativa, Showcase).
- Matriz de 4 Eixos com **pilares Senff** no eixo Alinhamento (eficiência, experiência do cliente, compliance, inovação).
- Papéis 5 níveis mapeados ao RACI da Metodologia Executiva (Sponsor, Líder de Programa, PMO, Dono, Escriba).
- Lei do Bem: instrumento interno `Triagem_Preliminar_Lei_do_Bem_Simples`, fórmulas B27–B30 **duplicadas** em TypeScript e em trigger PL/pgSQL, frases de síntese copiadas da célula B29, itens de bloqueio 3/4/5/6/9/10/11. Não existe isso em produto de prateleira.
- Flag ClickUp na auditoria fiscal — o fluxo P&D da Senff, não um campo genérico de “export”.

### Comportamento que só existe neste contexto

- Sem exclusão física: apagar perfil destruiria a métrica de participação ≥ 80% da base cadastrada.
- Semáforo **não** zera se o admin só corrige a área — senão o acervo legado “ficaria em dia” sem o dono ter mexido.
- Cores de gráfico por **ordem estável**, não por ranking, para a mesma diretoria não trocar de cor no meio da reunião.
- Comunidade com skills de automação (n8n etc.) para achar quem ajuda no Fórum de Desbloqueio, não um LinkedIn interno genérico.

---

## 7. O que exatamente foi migrado para sistemas internos e com quais desafios técnicos

“Sistemas internos” aqui é o próprio Pulso (Next.js + Supabase), destino da operação que vivia em arquivo. Integrações de saída (Bitrix, ClickUp) **ainda não receberam** o acervo.

### O que entrou

| Origem | Destino | O que passou |
|---|---|---|
| CSV do portfólio (161) | `projects` + `areas` | Título, setor (via alias), diretoria, tema, potencial, horas/mês, economia R$, uso de IA/n8n, data, status legado, score legado |
| `pulsoimproved.html` | `/dashboard` | KPIs, semáforo com sliders 30/90, filtros combinados, donut, barras, ECG, export CSV, paleta e tipografia |
| Manifesto + PDFs (reexportados para MD) | `content_pages` | Manifesto, Metodologia do Grupo, Metodologia Executiva |
| Planilha Lei do Bem | `lei_do_bem_avaliacoes` + `lei-do-bem.ts` | 12 perguntas, 4 respostas, índice, síntese, classificações |
| Design System Senff | `tokens.css` + Tailwind | Paleta completa, não as 3 cores do prompt original |
| Lista de presença da reunião | `meetings` + `attendance` | Modelo novo (não havia no HTML) |
| Relatoria executiva (PDF pp. 1–12) | `decisions` + views W4 | Decisões pendentes / anteriores — o HTML não tinha |

### O que **não** foi migrado (de propósito ou por falta de cobertura)

- Score 5–65 **não** vira `score_final` da matriz.
- ROI do acervo legado.
- Dataset embutido no HTML (fonte passa a ser a view sob RLS).
- 21 `innerHTML` (React escapa).
- Data de referência `2026-08-11` e campo `age` pré-calculado.
- `dashboard_light.html` (MVP anterior, identidade errada).
- INSERTs de exemplo de um script de relatoria (misturariam fictício com as 161 reais).

### Desafios técnicos da migração

**1. Três relógios no lugar de um.** O CSV tinha um campo `Data` = cadastro. O produto precisa de `created_at` (auditoria), `updated_at` (qualquer write) e `last_activity_at` (só conteúdo substantivo). Sem a semeadura no go-live, o indicador explode.

**2. Pipeline maior que a base.** Função `map_legacy_status`: Concluído → `concluido`; Em andamento → `em_desenvolvimento`; Em acompanhamento → `em_teste` (as 3 linhas estão em validação com usuário, que é o gate Em Teste → Concluído). Cinco estágios nascem vazios — aceito, não forçado.

**3. Escalas de score incompatíveis.** Mediana 15 na escala 5–65 vs. corte 4,0 na matriz. Decisão: eixos nulos, `scoring_source = 'legado'`, `legacy_priority` (base/média/alta) preservado. Re-scorar 161 na mão foi rejeitado como pré-requisito de go-live.

**4. Setor como dado sujo.** 39 strings, duplicatas reais (RH/Rh, Credito PJ/Crédito PJ, seis variantes de Compras/Frota/Zeladoria, inclusive typo MANUENÇÃO). Alias é **fechado**: string sem de-para deve falhar a carga, não criar área nova.

**5. Datas heterogêneas.** 160 ISO + 1 `12/23/2025`. `parse_legacy_date` tenta `YYYY-MM-DD`, depois `MM/DD/YYYY`, depois `DD/MM/YYYY`.

**6. Schema HTML ≠ CSV.** O HTML leve não tinha tema, potencial, score, n8n. A migration parte do CSV. O HTML “certo” só chegou depois da auditoria — o risco era implementar o dashboard errado.

**7. XSS e peso.** 21 `innerHTML` com dado de CSV; no banco isso vira vetor. Renderização React + RLS: o dado não viaja no JS inicial como blob de 160 KB.

**8. Conteúdo que não era texto.** Metodologias em JPEG dentro de ZIP. Viraram `.md` para seed e para um RAG futuro (pgvector, fase 6). Indexar o PDF original era inviável.

**9. Autorização vs. script “pronto” de relatoria.** O SQL anexado para o W4 trazia área livre, responsável texto, papel no JWT e 5 INSERTs fictícios. A `0003` aproveita `decisions` e saúde, e **corrige** o resto para não desfazer a auditoria.

**10. Gate da matriz vs. carga e vs. UX posterior.** Isenção `is_legacy_import` era obrigatória senão as 161 em `em_desenvolvimento` sem eixos quebravam o INSERT. Depois a Matriz saiu do formulário e o mesmo gate quebrou o cadastro **novo** — segundo ciclo de migração de regra, não de dado.

**11. Script de carga ainda manual.** O README declara a pendência: de-para no banco, CSV ainda não entra sozinho. Até isso existir, o “portfólio interno” e o arquivo oficial podem divergir.

**12. Saída para ClickUp/Bitrix.** A migração foi **para dentro** do Pulso. A volta (W5, `enviar_clickup`) está modelada e não executada — desafio em aberto: não duplicar card nem parecer fiscal em ferramenta que não conhece os 12 itens.

---

## Referências no repositório

- Produto: `README.md`, `docs/PRD.md`, `docs/DECISOES.md`, `docs/AUDITORIA.md`, `docs/PATCH_documentacao.md`
- Regras de reunião e diretoria: `docs/manifesto.md`, `docs/metodologia-grupo.md`, `docs/metodologia-executiva.md`, `docs/fluxograma.md`
- Schema: `supabase/migrations/0001_pulso_schema.sql` … `0014_remover_gate_matriz.sql`
- Integrações: `src/lib/n8n.ts`
- Lei do Bem: `src/lib/lei-do-bem.ts`, `src/lib/lei-do-bem.test.ts`
- Acesso Senff: `src/app/cadastro/actions.ts`, `src/styles/tokens.css`
