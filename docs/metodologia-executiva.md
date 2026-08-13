# Metodologia Executiva — Projeto Pulso
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
