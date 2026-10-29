# Linha do tempo de desenvolvimento — Sistema Pulso

Registro de iterações com commit, PR e o que a iteração ensinou. Fonte: `git log` do `main` e PRs #1–#27 em `marIA-prompt/projeto-pulso`.

---

## Marcos

| Data | Marco | Ref |
|---|---|---|
| 12/08/2026 | Auditoria de consistência: três bloqueios de implementação (arquivo de referência errado, pipeline × status, semáforo 100% vermelho) | `docs/AUDITORIA.md` |
| 12/08/2026 | Chegada do `pulsoimproved.html`; patches de documentação | `docs/PATCH_documentacao.md` |
| 13/08/2026 | MVP no `main`: schema, RLS, dashboard, convite, conteúdo | `0b89720` |
| 14/08/2026 | Primeira leva de features e correção do callout em produção | PRs #1, #2, #3 |
| 19–24/08/2026 | Auth, paginação, pauta, cadastro `@senff.com.br` | PRs #4–#8 |
| 26/08/2026 | Proprietário, tema, ordenação, Lei do Bem (triagem + aba) | PRs #9–#14, commits `04a347f`–`c318f99` |
| 27/08/2026 | Acesso gerencial, wizard, vocabulário da pré-triagem, gate da Matriz | PRs #15–#25 |
| 16/09/2026 | Questionamentos técnicos (documento; PR #26 em draft) | `docs/QUESTIONAMENTOS.md` |
| 22/09/2026 | Escopo obrigatório + pré-análise MCTI/Frascati | PR #27 |

Volume: **75 commits** no histórico inspecionado; **66** Cursor Agent, **28** Maria Clara (inclui o MVP). Agosto concentra a construção; setembro fecha o recorte MCTI.

---

## Migrations (evolução do modelo)

| Arq. | Intenção experimental ou de governança |
|---|---|
| `0001_pulso_schema.sql` | Resolve A2, A3, C1, C2, C3, F1, F2: áreas, três relógios, score legado, views, RLS |
| `0002_content_seed.sql` | Manifesto e metodologias oficiais |
| `0003_papeis_decisoes_saude.sql` | 5 papéis RACI; `decisions`; `health` ≠ `stage`; rejeita papel no JWT |
| `0005` / `0007` | Callout da Executiva: regex da 0005 falhou em produção; 0007 linha a linha |
| `0006` | RLS da Metodologia Executiva (gerencial+) |
| `0008` | Hub da Comunidade + bucket `avatars` |
| `0009` | Proprietário na view do dashboard |
| `0010` | Lei do Bem: tabela 1:1, trigger B27–B30, log de status, guarda de auditoria |
| `0011` | SELECT da aba só gerencial+; dono lê a própria linha |
| `0012` | Campos novos do cadastro (`objetivo_contexto`, usos de IA discriminados) |
| `0013` | Gate da Matriz vira no-op |
| `0014` | Trigger do gate dropado — a 0013 sozinha não bastava em produção |

---

## PRs no `main` (customização e retrabalho)

| PR | Título | Tipo de evidência |
|---|---|---|
| #1 | Ajustes Admin, Metodologia, Frequência, Kanban, Acompanhamento | Iteração de produto; QA com vídeo |
| #2 | Callout da Executiva + `.gitignore` de credenciais | Falha da 0005 em produção; segurança do repo |
| #3 | Hub da Comunidade | Feature; RLS de avatar |
| #4 | Senha vazando no campo e-mail | Bug de reuso de nó React; antes/depois |
| #5–#6, #14 | Paginação convites / iniciativas / participantes | Fora do recorte P&D (UX) |
| #7 | Pauta textarea | Fora do recorte P&D |
| #8 | Cadastro `@senff.com.br` | Hipótese do PRD (só-convite) revertida pelo onboarding em massa |
| #9 | Filtro e campo de proprietário | Dado de dono na view |
| #10–#11 | Período e ordenação no Acompanhamento | Estado na querystring (D2) |
| #12 | Tema claro/escuro | Identidade (claro padrão — decisão do patch) |
| #13 | Menu da conta no avatar | UX |
| #15–#18 | Admin: área, convites, encontros, badge dark | Operação |
| #19 | Triagem Lei do Bem | Entrada do motor P&D no produto |
| #20 | Aba só gerencial+ | Camada 1+2+3 no recorte fiscal |
| #21 | Ordenação da lista Lei do Bem | Mesmo ciclo do Acompanhamento |
| #22 | Wizard: loop do opt-in | Incerteza de estado React; máquina de etapas pura |
| #23 | Rótulo “bloqueio duro” sai da UI | Fórmula permanece; copy não assusta quem cadastra |
| #24–#25 | Gate da Matriz vs. “Em Desenvolvimento” | Hipótese revertida; erro passa a citar o campo |
| #27 | Cinco campos de escopo + FormP&D §6 + Frascati | Fecha o recorte MCTI na auditoria |

PR #26 (questionamentos) permanece draft em outra branch; o conteúdo foi incorporado a este dossiê como `docs/QUESTIONAMENTOS.md`.

---

## Ciclos de aprendizado (o que a iteração mudou na regra)

1. **Arquivo de referência errado** — implementar contra `dashboard_light.html` alucinaria feature. A auditoria bloqueou o código até o `pulsoimproved` chegar.
2. **0005 não limpa produção** — regex multilinha não-guloso; a correção é newline-sensitive e preserva citação legítima (`0007`).
3. **Só-convite vs. onboarding** — PRD original sem cadastro público; a base precisa crescer até 120. Auto-cadastro restrito a `@senff.com.br` (PR #8); convite deixa de expirar por data.
4. **Vocabulário da pré-triagem** — léxico inicial gerava falso P&D no acervo real (`d5c3281`, `76341d0`).
5. **Wizard em loop** — o clique “Sim, seguir para a triagem” lia o estado antigo. A máquina de etapas passou a ser função pura (`cadastro-iniciativa.ts`).
6. **Gate no banco vs. Matriz fora da UI** — a regra da Executiva §7 foi implementada em três lugares e depois desligada porque o cadastro deixou de pontuar. Enquanto a migration não roda, a aplicação **traduz** o erro em vez de engolir “Não foi possível salvar”.
7. **Triagem sinaliza, não bloqueia** — o rótulo “bloqueio duro” foi removido da UI precisamente para não confundir a fórmula com trava de cadastro (PR #23).

---

## Commits de Lei do Bem (núcleo experimental)

```
04a347f / 6bf56de  feat: add Lei do Bem triage workflow
67efcf0            fix: restrict Lei do Bem assessment creation
f3434b4            feat: wizard de cadastro, triagem e aba de auditoria
c318f99            feat: pré-análise de enquadramento (Lei 11.196/2005)
9f7bf50            fix: restringe a aba a gerencial e administrador
0f34cae            feat: pré-triagem do portfólio já cadastrado
d5c3281            fix: amplia o vocabulário da pré-triagem
76341d0            fix: corrige falso P&D na pré-triagem do portfólio real
7fef517            feat: ordenação crescente/decrescente na lista
9bed7e0            fix: avança a Lei do Bem e enxuga o wizard
b38fdf2            fix: remove o rótulo de bloqueio duro
2c57aad            feat: escopo obrigatório, pré-análise MCTI e ações
58726be            fix: grava os blocos MCTI junto com a auditoria
af83fe0            fix: não deixa pular os cinco campos
b85d6c1            fix: Abrir cadastro só visualiza; botão confirma o save
```
