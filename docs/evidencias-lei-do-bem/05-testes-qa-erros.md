# Testes, QA, erros e incertezas — Sistema Pulso

---

## 1. Testes automatizados (execução 16/10/2026)

Ambiente da coleta: Node v22.14.0, TypeScript 5.6.3, `tsx` 4.23.15. Os scripts `npm run test:*` usam `npx tsx`; neste ambiente o `npx` do exec-daemon falha (`minipass-flush`), então a execução usou o `npx` do nvm e `./node_modules/.bin/tsc`.

| Suite | Resultado |
|---|---|
| `src/lib/lei-do-bem.test.ts` | 30/30 ok |
| `src/lib/cadastro-iniciativa.test.ts` | 9/9 ok |
| `src/lib/nav.test.ts` | 4/4 ok |
| `src/lib/projeto-erro.test.ts` | 5/5 ok |
| `tsc --noEmit` | exit 0 |

Casos que documentam a **incerteza da fórmula** (não só “o happy path”):

- 12 Sim → índice 1,00, potencialmente elegível.
- 12 Parcialmente → 0,50, potencial parcial.
- “Não” no item 5 ou 11 → baixo potencial, frase da planilha.
- “Não sei” prevalece sobre bloqueio duro.
- <12 respostas → pendente, índice nulo.
- “Não” em item sem bloqueio **não** derruba elegibilidade se índice ≥ 0,75.
- Fronteira exata 18/24 = 0,75 → potencialmente elegível.
- Sete itens de bloqueio = 3, 4, 5, 6, 9, 10, 11.
- Pré-análise MCTI: 5 blocos §6 + 5 Frascati; lacuna “Incerto” quando triagem_05/10 = Não.
- Wizard: estado vazio não reentra na própria etapa (regressão do loop).
- Escopo incompleto não deixa pular para triagem/revisão.
- Nav: leitor/participante/editor não veem `/lei-do-bem`.
- `projeto-erro`: reconhece a recusa do gate e a coluna ausente no schema cache.

Log bruto da execução: artefato `qa-testes-evidencias.log` desta coleta.

## 2. QA e validação em ambiente real

Registrado nos corpos dos PRs (não reproduzido aqui por ser artefato externo ao git):

- PR #1 — Kanban com arrastar; dashboard com impacto financeiro e paginação; Admin (e-mail, copiar link, editar encontro).
- PR #2 — Metodologia Executiva sem callout após `0007`.
- PR #3 — Comunidade tabela/cards, busca, upload de avatar.
- PR #4 — Antes: senha em texto no e-mail; depois: campo vazio.
- PR #5 — Convites 10/página (17 convites → 10+7).
- PR #27 — Escopo obrigatório; painel MCTI; cadastro em somente leitura; selo “Salvo”.

Validação de **números institucionais** (não de UI): `AUDITORIA.md` calculou direto sobre o CSV, o HTML e o Design System. A view SQL recusa a soma “errada” de horas (2.309,7 h) como número publicado.

Critério operacional de go-live do semáforo: o painel **não** abre como parede vermelha. Sem o `update` de `last_activity_at` nas 161 herdadas, 56/56 ativas seriam críticas (idade mínima 92 dias na data da auditoria).

O que o MVP **deliberadamente não valida**: ROI ≥ 3× no acervo legado; score legado como prioridade; idade do registro como saúde.

## 3. Tratamento de erros

| Situação | Comportamento | Onde |
|---|---|---|
| n8n ausente ou fora do ar | Operação principal segue; retorna `false`; timeout 5 s | `src/lib/n8n.ts` |
| Convite expirado/revogado entre tela e submit | Revalida no servidor; não confia na tela | `src/app/convite/[token]/actions.ts` |
| Cliente de e-mail altera maiúsculas do token | `hashesDoToken` tenta original e minúsculo | `src/lib/invite-token.ts` |
| Token já em base64url vs. hex | Hex de 64 chars na geração nova; hashes possíveis na leitura | idem |
| Conta já existe no aceite | Atualiza senha em vez de falhar opaco | `aceitarConvite` |
| Member edita iniciativa alheia | `update` com 0 linhas; mensagem “só o dono” sem confirmar existência | `DECISOES.md` D4 |
| Gate da Matriz ainda no banco | Mensagem aponta Estágio / migration, não “Não foi possível salvar” | `src/lib/projeto-erro.ts` |
| Coluna nova ausente (schema cache) | Mensagem pede `0012` em diante | idem |
| Parser de data legada | ISO → MM/DD/YYYY → DD/MM/YYYY; 1 registro americano | `parse_legacy_date` |
| Alias de setor desconhecido | Carga deve falhar, não criar área nova | `area_aliases` comment |
| Webhook W1 falha | Link copiável na tela do admin | D1, `README.md` |
| Tema em modo privado / storage bloqueado | `try/catch` no `localStorage` | `src/lib/tema.ts` |
| Senha reusada no input de e-mail | `key` distinto nos dois `<form>` | PR #4 |
| Arrastar card Lei do Bem falha | Rollback otimista + `role="alert"` | `LeiDoBemQuadro.tsx` Kanban |
| Auditoria por não-gerencial | Server Action recusa; trigger `lei_do_bem_guard_auditoria` no banco | `lei-do-bem/actions.ts`, `0010` |
| Zod de formulário | Primeira issue devolvida na UI (`ErroBox`) | actions de projeto, convite, cadastro, auditoria |

Falha de webhook **nunca** derruba convite, encontro ou cadastro — invariante documentada no README e no código.

## 4. Desafios e incertezas identificadas ao longo do desenvolvimento

### Superadas (com evidência do caminho)

| Incerteza | Como se revelou | Resolução |
|---|---|---|
| Qual HTML é a referência? | PRD descrevia features inexistentes no arquivo do repo | Esperar `pulsoimproved`; reescrever patch; não implementar o light |
| Semáforo no dia 1 | 0 em dia / 1 atenção / 160 críticos se usar cadastro | Três relógios + semeadura |
| “32 setores” | Nenhum agrupamento no CSV chega a 32 | 31 reais; placeholder fora do KPI |
| Score 5–65 | 100% Prioridade Alta se importar | `scoring_source`; eixos nulos |
| Papel no cliente | `inviteUserByEmail` e script JWT | D1/D4; correção na `0003` |
| PDFs não são PDF | ZIP+JPEG | Markdown derivado para seed |
| Regex da 0005 | Callout persistiu em produção | `0007` linha a linha |
| Falso P&D na pré-triagem | Vocabulário largo demais no acervo | Commits `d5c3281`, `76341d0` |
| Wizard em loop | Estado React atrasado | Função pura + teste de regressão |
| Gate vs. Matriz ausente | Cadastro “Em Desenvolvimento” falhava opaco | `0013`/`0014` + `projeto-erro.ts` |

### Ainda abertas (não encerrar o dossiê como se estivessem resolvidas)

| Incerteza / pendência | Impacto | Onde está declarada |
|---|---|---|
| Script de carga das 161 não automatizado | Portfólio interno e CSV oficial podem divergir | `README.md` |
| W3/W4 exigem n8n puxando views | Report quinzenal não sai se ninguém abre o sistema **e** o n8n não está no ar | `README.md`, metodologia executiva |
| `enviar_clickup` sem sync | Risco de duplicar parecer fiscal em ferramenta que não conhece os 12 itens | `0010` comment |
| Bitrix W5 | Fora do MVP | PRD §5/§9 |
| Check-in no dia (D3) | Taxa do MVP é de confirmação, não de presença física — já exibida lado a lado | `DECISOES.md` D3 |
| ROI ≥ 3× | 7% de cobertura de custo | `PATCH` §11, README |
| Gates Ideia→Backlog etc. | Continuam processo de reunião, não trigger | `metodologia-executiva.md` implicações |
| Painel de Valor | Protótipo e fixtures em branch, não no `main` | `cursor/painel-de-valor-conteudo-e426` |
| Importação vs. go-live do semáforo | Sem o `update` pontual, o indicador perde credibilidade na primeira reunião | `0001` §6 |

Essas incertezas abertas são, elas mesmas, evidência de P&D: o caminho ainda não é totalmente conhecido (item 5 da triagem) e o trabalho continua documentado por etapas (item 7).
