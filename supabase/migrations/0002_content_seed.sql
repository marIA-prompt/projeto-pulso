-- =============================================================================
-- Seed de conteúdo — Manifesto e Metodologias
-- Fonte: docs/manifesto.md, docs/metodologia-grupo.md, docs/metodologia-executiva.md
--
-- Correções aplicadas em relação aos originais:
--   A3 — "32 setores" → 31 (um dos 32 valores é o placeholder "Não informado")
--   E3 — "Metodologia Geral" → "Metodologia do Grupo" (nome do documento oficial)
-- =============================================================================

insert into public.content_pages (slug, title, body_md) values
  ('manifesto', 'Manifesto', '# Manifesto PULSO
*Projeto de Inteligência Artificial & Automação — Senff*

Existe um pulso que atravessa a Senff. Ele não aparece no organograma. Não tem sala própria. Não nasceu de um decreto. Ele nasceu de pessoas que se recusaram a aceitar que "sempre foi assim" é uma resposta válida.

Pessoas que olharam para uma planilha que leva 6 horas e perguntaram: *"E se levasse 6 minutos?"*. Que viram um processo que exige 12 e-mails e pensaram: *"E se exigisse zero?"*. Que imaginaram um atendimento ao cliente que não faz o cliente esperar — e decidiram construir isso.

**Esse pulso tem nome agora. E ele é coletivo.**

## O que é o PULSO
O PULSO é o projeto de Inteligência Artificial e Automação da Senff. Um grupo aberto de colaboradores de todas as áreas — do comercial ao backoffice, do risco ao marketing, da controladoria ao atendimento — que se reúne semanalmente para **usar tecnologia para resolver problemas reais, eliminar trabalho repetitivo e liberar as pessoas para o que realmente importa**.

- ✗ Não somos um comitê.
- ✗ Não somos um departamento de TI.
- → Somos um movimento de transformação que tem governança e segurança como alicerces.

## O que já fizemos
| Indicador | Valor |
|---|---|
| Iniciativas mapeadas no portfólio | **161** |
| Colaboradores engajados ativamente | **+80** |
| Horas devolvidas ao time por mês | **1.995h** |
| Setores com iniciativa | **31** |

## No que acreditamos
1. **Governança e segurança são inegociáveis**
2. **Criatividade precisa de espaço e de direção** — ideias nascem livres; projetos nascem com dono, prazo e acompanhamento.
3. **O melhor resultado é o resultado compartilhado** — solução documentada, demonstrada e replicável transforma.
4. **IA cuida do operacional, você cuida do estratégico** — cada automação entregue é uma pessoa que saiu do operacional e foi para o estratégico.
5. **Qualquer pessoa pode inovar** — inovação não é privilégio de quem programa; é de quem conhece o problema.
6. **Transparência gera confiança** — todos os projetos, status, métricas e decisões são visíveis para todos.

*(Complementar: o erro é parte do caminho — o único erro real é deixar de tentar.)*

## Como funcionamos
Encontros semanais de 1 hora que funcionam como fórum de decisão e execução:
1. **Acompanhamos** todas as iniciativas em um painel visual e transparente.
2. **Desbloqueamos** impedimentos de forma coletiva — quem precisa de ajuda pede, quem pode ajudar oferece.
3. **Criamos** na Arena Criativa — qualquer pessoa pode trazer um problema, uma ideia, uma descoberta.
4. **Decidimos** juntos o que merece esforço, o que pode esperar e o que deve ser abandonado.
5. **Celebramos** cada conquista.

## Para onde vamos
Hoje somos mais de 80. A meta imediata é **120 pessoas pulsando juntas** — mas o número não é o objetivo, o impacto é.

> *"Sozinhos, somos uma batida. Juntos, somos o ritmo que move a empresa para a inovação."*

**Este manifesto não é um comunicado. É um convite.**
'),
  ('metodologia-grupo', 'Metodologia do Grupo', '# Metodologia do Grupo — Projeto Pulso
*Documento de referência para todos os participantes | v1.0 — Agosto/2026*

## 1. Propósito
Define como o grupo operacional funciona: como nos reunimos, colaboramos, decidimos, aprendemos e transformamos ideias em resultados. O Pulso é um espaço de cocriação, um fórum de decisão e uma comunidade de prática — **não** é apresentação passiva, "status meeting" ou espaço restrito a especialistas.

## 2. Modelo de Engajamento
**Filosofia — Criatividade com Direção:** ciclo contínuo `CRIAR → DECIDIR → EXECUTAR → APRENDER`.

**Escala de participação (3 camadas):**
| Camada | Perfil | Expectativa | Estimativa |
|---|---|---|---|
| Núcleo Ativo | Lidera iniciativas, facilita reuniões | Presença semanal, Kanban atualizado, mentoria | ~20–25 |
| Colaboradores | Participa de iniciativas, testa soluções | Presença regular, contribuição em discussões | ~40–50 |
| Comunidade | Acompanha, aprende, sugere problemas | Presença quando possível | ~40–50 |

## 3. Reunião Semanal (60 min, presencial, aberta a todos — meta 120 pessoas)
Papéis rotativos: **Facilitador(a)**, **Guardião do Tempo**, **Escriba** (resumo até 2h após), **Curador(a) de Ideias**.

Blocos: **Abertura & Check-in** → **Pulso do Portfólio** (dashboard projetado + Kanban; alerta automático para projetos sem atualização há >14 dias) → **Fórum de Desbloqueio** (máx. 4 impedimentos: 2 min problema, 2 min soluções, 30 s decisão) → **Arena Criativa** (espaço aberto + votação: 👍 Backlog / 🔗 Mesclar / 📌 Guardar) → **Showcase & Aculturamento** (1–2 apresentações de até 5 min).

## 4. Pipeline de Inovação
`Ideia → Backlog → Priorização → Em Desenvolvimento → Em Teste → Concluído → Showcase`
- Priorização pela **Matriz de 4 Eixos**: Impacto no Negócio (35%), Viabilidade Técnica (25%), Alinhamento Estratégico (25%), Urgência/Custo da Inação (15%). Score ≥ 4.0 = Alta; 3.0–3.9 = Média; < 3.0 = Backlog.
- Metas: ≤ 30 dias para low-code; teste validado pelo usuário final com métricas de impacto.

## 5. Onboarding "Bem-vindo ao Pulso"
Jornada da Semana 0 (kit digital + convite) à Semana 5+ (engajamento ativo), com "Buddy" do Núcleo Ativo e kit de boas-vindas (o que é o Pulso, como funciona a reunião, glossário, mapa de iniciativas, como propor uma ideia).

## 6. Capacitação
Trilhas: Fundamentos de IA (todos), Automação Low-Code (n8n, ClickUp, Bitrix, Power Automate), IA Generativa Aplicada (prompt engineering), Dados e Analytics (Núcleo).

## 7. Gamificação e Reconhecimento
🚀 Iniciativa do Mês · 💡 Ideia Disruptiva · 🤝 Colaborador Destaque · 🎓 Multiplicador · 📈 Marcos de Portfólio — sempre baseados em dados do sistema.

## 8. Comunicação Assíncrona
Canais: `pulso-geral`, `pulso-ideias`, `pulso-desbloqueio`, `pulso-showcase`, `pulso-núcleo` (Teams/Bitrix). Cadência: pauta na segunda; resumo do Escriba até 2h após a reunião; lembrete automático de atualização do Kanban às quintas.

## 9. Regras de Ouro
1. O microfone é da ação (status está no Kanban). 2. Respeite o timebox. 3. Toda ideia é bem-vinda, nenhuma é obrigatória. 4. Quem não é técnico também é protagonista. 5. Falta de atualização é alerta — oferta de ajuda, não cobrança.

## 10. Métricas de Saúde do Grupo
Participação ≥ 80% da base cadastrada (lista de presença semanal) · Retenção ≤ 10% queda mensal · ≥ 2 ideias/reunião na Arena · ≥ 90% dos cards atualizados na semana · Desbloqueio ≤ 5 dias úteis · ≥ 70% das áreas representadas · NPS ≥ 8/10.

## 11. Camada Executiva (resumo)
Report Executivo Quinzenal automatizado via **n8n + Supabase** (saúde do portfólio, destaques, decisões pendentes, link para o dashboard) + Reunião Executiva sob demanda (30–45 min) com gatilhos objetivos. KPIs: horas economizadas, ROI ≥ 3x, cobertura de áreas, tempo de ciclo ≤ 30/90 dias, SLA de decisão.
'),
  ('metodologia-executiva', 'Metodologia Executiva', '# Metodologia Executiva — Projeto Pulso
*Documento de referência para Diretoria, Conselho e Sponsors | v1.0 — Agosto/2026*

> Extraído do PDF oficial (páginas 1–12). Até esta versão, este documento não
> existia em markdown e não estava previsto como página do sistema — apesar de o
> workflow **W4 (Report Executivo Quinzenal)** depender inteiramente dele.

## 1. Propósito
Estabelece a governança, a tomada de decisão e o acompanhamento estratégico das iniciativas de IA & Automação da Senff. O objetivo é tirar a alta liderança do modelo informativo ("o que está acontecendo") e levá-la ao modelo decisório ("o que precisa de mim agora").

Não substitui a reunião do Grupo — complementa, garantindo que decisões de alto impacto (orçamento, priorização estratégica, mudança de escopo, alocação de recursos) sejam tratadas no fórum adequado.

## 2. Princípios de Governança
| Princípio | Descrição |
|---|---|
| **Decisão informada** | Toda decisão é sustentada por dados do portfólio (horas salvas, ROI projetado, riscos). Nenhuma iniciativa avança ou é interrompida sem evidência. |
| **Cadência previsível** | A diretoria recebe informação em ritmo regular e padronizado, eliminando surpresas e reuniões ad hoc. |
| **Escalação objetiva** | Só sobem ao fórum impedimentos que exigem poder decisório executivo: orçamento, política, compliance, recursos compartilhados. |
| **Transparência bidirecional** | O grupo operacional enxerga as decisões executivas e seus racionais; a diretoria enxerga o impacto real no campo. |
| **Responsabilidade clara** | Cada iniciativa tem um dono, cada decisão tem um responsável, cada prazo tem um compromisso. Sem zonas cinzas. |

## 3. Papéis e Responsabilidades (RACI Executivo)
| Papel | Quem | Responsabilidades |
|---|---|---|
| **Sponsor Executivo** | Diretor(a) responsável | Valida prioridades estratégicas, aprova orçamento, remove impedimentos institucionais, patrocina a cultura de inovação perante o Conselho. |
| **Líder de Programa** | Coordenador(a) do Projeto Pulso | Consolida o portfólio, prepara a relatoria, facilita a reunião, garante que decisões sejam registradas e comunicadas ao grupo. |
| **Dono de Iniciativa** | Responsável técnico/funcional | Reporta status, escala impedimentos, responde por prazos e resultados. Participa da reunião executiva só quando convocado. |
| **PMO / Governança** | Analista designado | Mantém o sistema atualizado, gera dashboards, monitora SLAs de decisão, garante rastreabilidade. |

## 4. Cadência e Formato
Duas camadas complementares: um **report quinzenal por e-mail** (mecanismo principal e previsível) e uma **reunião sob demanda** (só quando há decisão que exige discussão presencial).

### 4.1. Report Executivo Quinzenal → workflow W4
| Aspecto | Detalhe |
|---|---|
| Frequência | Quinzenal — toda segunda-feira de semana par |
| Formato | E-mail automatizado (n8n + Supabase) |
| Destinatários | Sponsor Executivo, Diretoria, Coordenação |
| Prazo de resposta | 48h para dúvidas, aprovações ou pedido de reunião |

**Conteúdo obrigatório do report:**
1. **📊 Saúde do portfólio** — indicadores consolidados, variação vs. quinzena anterior, alertas (projetos em risco, prazos estourados, iniciativas sem atualização há > 2 semanas).
2. **🏆 Destaques da quinzena** — iniciativas concluídas e seu impacto; marcos alcançados.
3. **🚨 Decisões pendentes** — impedimentos que precisam de aprovação executiva, solicitações de orçamento/licenciamento/recursos. Para cada item: contexto + impacto + prazo ideal.
4. **📋 Status das decisões anteriores** — Decisão | Responsável | Prazo | Status (✅/⏳).
5. **📎 Link para o dashboard.**

> Se o portfólio está saudável e não há decisões pendentes, o report basta — nenhuma reunião é necessária.

### 4.2. Reunião Executiva sob demanda
Convocada pelo Líder de Programa ou solicitada pela Diretoria. Duração de **30 a 45 minutos**. Fixos: Diretor Executivo da área, Líder de Programa, PMO. Donos de iniciativa entram só por tópico.

**Gatilhos:** decisão orçamentária · impedimento crítico (compliance, segurança da informação ou TI paralisando múltiplas iniciativas) · mudança de direção estratégica · solicitação da Diretoria · marco importante (resultados de ciclo, relatoria para o Conselho).

**Estrutura:** Contexto rápido (5 min) → Mesa de decisão (20 min, máx. 3 impedimentos, cada um 2 min de contexto + 3 de discussão + 1 de registro) → Priorização, se aplicável (10 min) → Registro e próximos passos (5 min, com comunicação ao Grupo em até 48h).

## 5. Framework de Priorização — Matriz de 4 Eixos
| Eixo | Peso | Critérios (nota de 1 a 5) |
|---|---|---|
| Impacto no Negócio | 35% | Horas/mês economizadas, receita influenciada, risco mitigado, nº de áreas beneficiadas |
| Viabilidade Técnica | 25% | Complexidade, dependências externas, maturidade da ferramenta, disponibilidade de dados |
| Alinhamento Estratégico | 25% | Aderência aos pilares da Senff (eficiência operacional, experiência do cliente, compliance, inovação) |
| Urgência / Custo da Inação | 15% | Janela de oportunidade, impacto de não fazer, pressão regulatória ou competitiva |

`Score Final = Σ (Nota do Eixo × Peso)` · **≥ 4,0** Alta (recurso imediato, acompanhamento quinzenal) · **3,0–3,9** Média (fila de desenvolvimento, revisão mensal) · **< 3,0** Backlog (reavaliação trimestral).

## 6. KPIs Estratégicos
**Resultado (outcome):** horas totais economizadas (Σ horas/mês das iniciativas **concluídas**) · ROI do portfólio ≥ 3x · economia em R$ projetada · cobertura de áreas.

**Processo (health):** velocidade de entrega · taxa de conclusão — Concluídas / (Concluídas + Canceladas + Em andamento) · tempo médio de ciclo ≤ 30 dias para low-code e ≤ 90 dias para projetos complexos.

**Maturidade:** 1 Temporário → 2 Repetível → 3 Definido → 4 Gerenciado → 5 Otimizado. Posição estimada: transição de 1 para 2. Meta: Nível 3 em 3 meses, Nível 4 em 6 meses.

## 7. Ciclo de Vida — gates de passagem
| Transição | Gate | Responsável pelo gate |
|---|---|---|
| Ideia → Backlog | Aprovação mínima na reunião do Grupo | Líder de Programa |
| Backlog → Em Desenvolvimento | **Score ≥ 3,0** + recurso disponível | Líder de Programa |
| Em Desenvolvimento → Em Teste | Entrega funcional comprovada | Dono da Iniciativa |
| Em Teste → Concluído | Validação pelo usuário final + métricas coletadas | Dono da Iniciativa + PMO |
| Qualquer estágio → Cancelado | Justificativa documentada + aprovação | Líder de Programa ou Sponsor |

## 8. Regras de Ouro para a Diretoria
1. **Não pular o processo** — toda demanda nova segue o pipeline, mesmo vinda de um diretor.
2. **Decidir ou delegar** — impedimento escalado tem decisão em até 1 ciclo (2 semanas); sem informação suficiente, designar responsável e prazo.
3. **Respeitar a autonomia operacional** — a reunião executiva remove barreiras e define direção, não microgerencia entregas.
4. **Dar visibilidade ao Conselho** — trimestralmente o Sponsor consolida resultados com dados do sistema.

## 9. Cronograma de Implantação
| Semana | Marco | Entregável |
|---|---|---|
| S1 | Kick-off da Metodologia | Documento aprovado, papéis designados |
| S2 | Primeira relatoria (manual) | Relatório executivo piloto |
| S3–S4 | Sistema de Acompanhamento MVP | Dashboard + Kanban operando |
| S5 | Primeira reunião no novo formato | Ata estruturada, decisões registradas |
| S6 | Automação da relatoria (n8n) | Relatório automático testado |
| S7–S8 | Estabilização e ajustes | Feedback da diretoria incorporado |

---

## Implicações para o sistema (não constam do PDF)
1. **Gates são regra de negócio, não texto.** O gate `Backlog → Em Desenvolvimento` exige score ≥ 3,0 — precisa virar validação no CRUD, e hoje não está no PRD §7.
2. **`Cancelado` precisa existir.** A taxa de conclusão depende dele e o pipeline de 7 estágios do PRD não o inclui.
3. **W4 precisa de duas tabelas que ainda não existem:** `decisions` (decisão, responsável, prazo, status) e o histórico quinzenal — sem elas, os blocos 3 e 4 do report não têm de onde sair.
4. **"Iniciativas sem atualização há > 2 semanas"** é o mesmo alerta de 14 dias da Metodologia do Grupo. Confirma que o relógio é de *atualização*, não de idade do registro (ver C3 na auditoria).
')
on conflict (slug) do update
  set title = excluded.title,
      body_md = excluded.body_md,
      updated_at = now();
