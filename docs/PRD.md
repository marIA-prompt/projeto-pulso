# PRD v3 — Sistema Pulso (Senff)

## 1. Contexto real
O **Pulso** é o projeto de IA & Automação da Senff: movimento aberto com **+80 colaboradores ativos**, **161 iniciativas mapeadas**, **1.995h/mês devolvidas ao time** e **32 setores com iniciativa**; meta de **120 participantes**. Funciona com encontros semanais de 1h (Check-in → Pulso do Portfólio → Fórum de Desbloqueio → Arena Criativa → Showcase) e pipeline: Ideia → Backlog → Priorização → Em Desenvolvimento → Em Teste → Concluído → Showcase.

## 2. Problema e objetivo
Hoje o acompanhamento é disperso. O sistema centraliza: Manifesto, Metodologia Geral, Dashboard Interativo, Frequências (confirmação de presença) e Cadastro de Projetos/Iniciativas — com acesso restrito a convidados e Área Admin para gestão de acessos. Deploy na Vercel.

## 3. Perfis e permissões
| Perfil | Permissões |
|---|---|
| Member (convidado) | Ler Manifesto/Metodologia/Dashboard; confirmar a própria presença; criar/editar os próprios projetos |
| Admin | Tudo acima + convidar/revogar, alterar papéis, gerir encontros, presenças e todos os projetos |

## 4. Funcionalidades
1. **Autenticação por convite** — sem cadastro público; convite com papel, expiração de 7 dias, reenvio e cancelamento; login e-mail/senha com recuperação.
2. **Manifesto** — conteúdo real do documento oficial (propósito, 6 crenças, números, convite).
3. **Metodologia Geral** — modelo de engajamento (3 camadas), estrutura da reunião semanal, pipeline, onboarding, regras de ouro e métricas de saúde.
4. **Dashboard Interativo** (`/dashboard`) — derivado da aba **"Acompanhamento"** do HTML de referência (`pulsoimproved`), que já implementa: KPIs do portfólio, **semáforo de acompanhamento** com limites configuráveis (em dia ≤ 30 d · atenção · crítico > 90 d, ajustáveis por slider), busca e filtros combinados (tema, setor, diretoria, status, potencial, uso de IA), gráfico donut por status, barras por tema/setor, linha do tempo estilo ECG, alertas e **exportação CSV** da visão filtrada. Ajustes obrigatórios validados na auditoria: (a) idade das iniciativas calculada dinamicamente pela data atual — não mais congelada em "11/08/2026"; (b) dados deixam de ser embutidos no HTML (~160 KB) e passam a vir do Supabase via views agregadas sob RLS; (c) semáforo navegável por teclado e regiões dinâmicas com `aria-live`; (d) fallback `noscript`; (e) complementar com KPIs de Frequência (taxa de confirmação e presença, meta ≥ 80%) e próximos encontros, que não existem no HTML atual. Identidade visual preservada: paleta navy/azul Senff, Poppins + IBM Plex Mono.
5. **Frequências** — admin cria encontros semanais; usuários confirmam presença (pending/present/absent); consolidado por encontro/pessoa; alimenta a métrica "Participação ≥ 80%".
6. **Projetos/Iniciativas** — CRUD aberto a todos os autenticados; campos incluem estágio do pipeline (7 estágios), área, horas/mês economizadas e **Matriz de Priorização de 4 Eixos** (Impacto 35%, Viabilidade 25%, Alinhamento 25%, Urgência 15%) com score calculado e classificação Alta/Média/Backlog.
7. **Área Admin** — usuários, convites, papéis e encontros; sem exclusão física (revogação).

## 5. Stack e integrações
- **Next.js + TypeScript + Tailwind na Vercel**; **Supabase** (Auth, Postgres, RLS, views agregadas; pgvector como evolução para RAG runtime).
- **n8n (opcional, não bloqueia MVP):** W1 e-mail de convite/kit de boas-vindas · W2 lembrete de presença 24h antes · W3 lembrete de quinta para atualização de iniciativas · W4 Report Executivo Quinzenal automatizado (previsto na Metodologia Executiva) · W5 futura sincronização com Bitrix.
- **Bitrix:** canal de comunicação/CRM já usado pelo grupo; integração somente via n8n.

## 6. Modelo de dados
`profiles`, `invitations`, `meetings`, `attendance` (UNIQUE meeting+user), `projects` (com 4 scores + score_final gerado + hours_saved_month), `content_pages`. RLS mínima-privilégio em tudo; service-role key apenas server-side.

## 7. Regras de negócio críticas
- Conta só existe mediante convite válido; bootstrap seguro do 1º admin.
- Member altera apenas os próprios projetos e presenças; admin gere tudo.
- Score de priorização: Σ(nota × peso); ≥ 4.0 Alta · 3.0–3.9 Média · < 3.0 Backlog.
- Iniciativa sem atualização > 14 dias gera alerta no dashboard (regra da metodologia).
- Dashboard respeita RLS; transparência interna sem exposição externa.

## 8. Critérios de aceite (checklist verificável)
✅ Não convidado bloqueado · ✅ Ciclo completo do convite · ✅ RLS testada (member não edita projeto alheio) · ✅ Presença confirmada reflete taxa no dashboard · ✅ Conteúdos reais publicados · ✅ Build + deploy Vercel · ✅ docs/DECISOES.md com análise ToT.

## 9. Fora de escopo do MVP
SSO corporativo, app nativo, relatórios preditivos, gamificação automatizada (fase 2: Iniciativa do Mês, selos), edição colaborativa em tempo real.

## 10. Roadmap
F1 Fundação (auth+RLS) → F2 Conteúdo+Admin → F3 Projetos+Priorização → F4 Frequências+Dashboard → F5 Automações n8n (W1–W4) → F6 Gamificação e RAG com pgvector.


## 11. Auditoria do HTML de referência (aba Acompanhamento)
**Pontos fortes preservados:** dataset real de 161 iniciativas; semáforo com limites ajustáveis; filtros combinados + busca; export CSV; visualizações (donut, barras, ECG); abas com `role="tablist"` e `aria-selected`; responsividade básica (6 media queries).
**Problemas corrigidos na v2 do HTML:** data de referência estática (idades erradas a partir do dia seguinte à geração) → cálculo dinâmico; ausência de `aria-live` no eco de filtros; semáforo sem acesso por teclado; ausência de fallback sem JS.
**Dívidas a resolver na migração para Next.js:** dados embutidos no arquivo (peso e desatualização) → buscar do Supabase; 21 usos de `innerHTML` com dados do CSV (risco XSS quando os dados vierem do banco) → renderização React com escape automático; ausência de KPIs de frequência/encontros; estado de filtros não persistido na URL; gráficos SVG sem descrição textual alternativa.