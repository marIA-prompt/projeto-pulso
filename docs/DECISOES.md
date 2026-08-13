# Decisões de arquitetura — Sistema Pulso
*Análise Tree of Thought das quatro decisões-chave. Cada uma lista os ramos considerados, o que os derrubou e a escolha.*

---

## D1 — Fluxo de convite

**Ramo A — `inviteUserByEmail` do Supabase Auth.**
Pronto em minutos, e-mail transacional incluso, expiração gerenciada. Mas o papel (`member`/`admin`) fica em `user_metadata`, que é gravável pelo próprio usuário em algumas configurações; reenvio e cancelamento dependem da Admin API, sem estado próprio; e não há tabela para auditar quem convidou quem. *Risco: o papel vira dado de cliente.*

**Ramo B — tabela `invitations` própria com token e cadastro condicionado.**
Controle total: status, expiração, quem convidou, reenvio, cancelamento, auditoria. Custa o envio do e-mail, que passa a ser responsabilidade nossa. *Risco: se o e-mail não sai, o convite morre.*

**Ramo C — híbrido.** Tabela própria como fonte de verdade do convite; criação da conta via service-role só depois que o servidor revalida o token. E-mail pelo n8n (W1), com fallback de link copiável na tela do admin.

**Escolhido: C.** O ramo A foi podado porque o papel não pode viver em metadado de cliente — é a base da autorização. O ramo B puro foi podado porque deixaria o admin travado quando o n8n não estivesse configurado; o link copiável resolve isso sem bloquear o MVP.

O token em claro existe só na URL do convite; o banco guarda `sha256`. Vazamento da tabela `invitations` não dá acesso a ninguém.

---

## D2 — Dashboard: origem e forma dos dados

**Ramo A — Server Components com agregação em views SQL.**
Pouco JavaScript no cliente, dados nunca trafegam além do necessário. Mas cada mexida em slider ou filtro vira ida ao servidor — e o semáforo tem dois sliders contínuos. *Risco: interação lenta justamente no lugar mais interativo.*

**Ramo B — busca no cliente com RLS.**
Interação instantânea. Mas exige expor a chave anon e replicar toda a lógica de agregação em JavaScript, e a primeira pintura chega vazia. *Risco: KPIs divergirem entre servidor e cliente.*

**Ramo C — híbrido.** Server Component busca as views agregadas e a lista já autorizada pela RLS; o cliente recebe o conjunto e faz filtro, recorte e recálculo do semáforo em memória.

**Escolhido: C.** Com 161 iniciativas — e mesmo com alguns milhares — o conjunto cabe folgado em memória, e a interação fica imediata sem uma única ida ao servidor. Os KPIs de topo continuam vindo da view, então o número publicado tem uma origem só. Se o portfólio passar de ~5.000 linhas, a paginação server-side entra sem mudar a interface.

O estado dos filtros vive na querystring: o link que alguém compartilha na reunião abre exatamente a mesma visão.

---

## D3 — Frequências: quando a presença é capturada

**Ramo A — RSVP prévio.** Permite dimensionar sala e pauta, e alimenta o lembrete de 24h. Mas quem confirma nem sempre aparece: a taxa vira intenção, não presença.

**Ramo B — check-in no dia.** Mede presença de verdade. Mas não ajuda a planejar e depende de alguém lembrar de abrir o check-in no meio da reunião.

**Ramo C — ambos, como estados distintos.** Rico, porém dobra a superfície de interface e exige explicar a diferença entre "confirmou" e "esteve" para 120 pessoas.

**Escolhido: A no MVP, com o caminho para C preservado.** A metodologia mede *"participação ≥ 80% da base cadastrada"* por lista de presença semanal — e é o RSVP que alimenta o W2. O ramo C foi adiado, não descartado: `attendance` já tem `confirmed_at` separado de `status`, então o check-in entra depois sem migração destrutiva.

Consequência assumida e exibida na interface: a taxa do MVP é de confirmação. O dashboard mostra os dois números lado a lado para que ninguém confunda um com o outro.

---

## D4 — Autorização

**Ramo A — middleware + checagem por página.** Redireciona cedo e dá boa experiência. Mas não protege o banco: uma Server Action esquecida ou uma rota nova sem guarda abre tudo.

**Ramo B — RLS pura.** O banco é a fronteira, e nada passa por cima dela. Mas o usuário só descobre que não pode ao receber uma lista vazia — a interface fica sem como dar uma resposta decente.

**Ramo C — defesa em camadas.** Middleware para redirecionar, checagem por página para a experiência, RLS para a garantia.

**Escolhido: C.** As duas primeiras camadas existem para a pessoa; a terceira existe para o atacante. A regra que seguimos: **nenhuma decisão de autorização depende só de código nosso.** Cada tabela tem política de mínimo privilégio, e a `service-role key` aparece em exatamente dois lugares — aceite de convite e criação de encontro com convite em massa.

Detalhe que decorre disso: ao editar uma iniciativa alheia, o `update` volta com zero linhas afetadas em vez de erro de permissão. A interface responde "você só pode editar iniciativas das quais é dono" sem nunca confirmar se aquele registro existe.

---

## Decisões menores, registradas

**Semáforo mede atualização, não idade.** `last_activity_at` é separado de `created_at`, e só campos de conteúdo renovam o relógio — arquivar ou corrigir a área de um projeto não zera o alerta. Sem essa separação, as 56 iniciativas ativas herdadas abririam todas em vermelho.

**Score legado não vira score da matriz.** A escala herdada vai de 5 a 65; a matriz vai de 1 a 5. Importar direto classificaria 100% do portfólio como prioridade alta. As iniciativas entram com os quatro eixos nulos e `scoring_source = 'legado'`.

**Cor de gráfico por ordem estável, não por ranking.** Se a cor seguisse o rank, a mesma área trocaria de cor ao mudar um filtro.

**Sem exclusão física.** Pessoas são revogadas e iniciativas arquivadas. Excluir um perfil levaria junto o histórico de presença que sustenta a métrica de participação.
