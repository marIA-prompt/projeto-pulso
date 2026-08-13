# Sistema Pulso

Plataforma privada do projeto de IA & Automação da Senff. Reúne Manifesto, Metodologias, o painel de acompanhamento do portfólio, as frequências dos encontros semanais e o cadastro de iniciativas. **O acesso é exclusivamente por convite** — não existe cadastro público.

Next.js (App Router) · TypeScript · Tailwind · Supabase (Auth, Postgres, RLS) · Vercel.

---

## Estrutura

```
src/app/(app)/          Área autenticada: dashboard, projetos, frequências, admin
src/app/login           Entrada e recuperação de senha
src/app/convite/[token] Aceite de convite (única porta de entrada)
src/components/         Nav, formulários, componentes do dashboard
src/lib/                Clientes Supabase, autorização, matriz de score, markdown
supabase/migrations/    Schema, RLS, views e seed de conteúdo
docs/                   PRD, DECISOES (ToT), metodologias, fluxograma
```

## Como rodar

```bash
cp .env.example .env.local     # preencha as chaves do Supabase
npm install
npm run dev
```

Antes de subir a aplicação, aplique as migrations no seu projeto Supabase — pelo SQL Editor ou pela CLI:

```bash
supabase db push
```

A ordem importa: `0001_pulso_schema.sql` cria schema, RLS e views; `0002_content_seed.sql` publica Manifesto e Metodologias.

## Bootstrap do primeiro admin

Como não há cadastro público, o primeiro administrador nasce direto no banco. Faça uma vez, pelo SQL Editor do Supabase:

1. Crie o usuário em **Authentication → Users → Add user**, com e-mail e senha, marcando *Auto Confirm*.
2. Rode, trocando o e-mail:

```sql
insert into public.profiles (id, full_name, role)
select id, coalesce(raw_user_meta_data->>'full_name', email), 'admin'
from auth.users
where email = 'voce@senff.com.br'
on conflict (id) do update set role = 'admin';
```

A partir daí todo acesso novo sai da Área Admin. Não repita este passo — ele existe só para resolver o ovo-e-galinha.

## Carga do portfólio existente

Depois de importar as 161 iniciativas, **rode uma vez**:

```sql
update public.projects
   set last_activity_at = now()
 where is_legacy_import = true;
```

Sem isso o painel abre com todas as iniciativas ativas em vermelho: a data original do portfólio é a de *cadastro*, e o acervo tem idade mediana de 259 dias. O semáforo mede tempo desde a última atualização, então o acervo precisa começar o relógio no go-live e decair a partir dali.

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Configure as variáveis de ambiente (**Settings → Environment Variables**):

| Variável | Escopo | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | todos | pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | todos | pública, protegida por RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | todos | **server-only**, nunca prefixar com `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | todos | usada para montar o link do convite |
| `N8N_WEBHOOK_*` | opcional | ausência não bloqueia nada |

3. Em **Supabase → Authentication → URL Configuration**, adicione o domínio da Vercel às *Redirect URLs*.

## Modelo de permissões

| | Participante | Administrador |
|---|---|---|
| Ler Manifesto, Metodologias e dashboard | ✅ | ✅ |
| Confirmar a própria presença | ✅ | ✅ |
| Cadastrar iniciativa | ✅ | ✅ |
| Editar iniciativa | só as próprias | todas |
| Ver consolidado de frequência | só o próprio histórico | todos |
| Convidar, revogar, alterar papéis | ❌ | ✅ |
| Criar encontros | ❌ | ✅ |

Três camadas independentes: middleware (redireciona), checagem por página (`requireUser` / `requireAdmin`), e RLS no Postgres (garante). O detalhe do porquê está em `docs/DECISOES.md`.

## Webhooks n8n

Opcionais por definição — falha de webhook nunca derruba a operação principal. Se `N8N_WEBHOOK_W1_CONVITE` não estiver configurado, o convite é criado do mesmo jeito e o link aparece copiável na tela do admin.

| | Gatilho | Carga |
|---|---|---|
| **W1** | convite criado ou reenviado | `{ email, role, link }` |
| **W2** | encontro criado (agendar lembrete de 24h) | `{ meetingId, title, scheduledAt }` |
| **W3** | cron de quinta no n8n | consulta `v_projects_dashboard` onde `alerta_14_dias` |
| **W4** | cron quinzenal no n8n | consulta `v_portfolio_kpis` + `v_attendance_kpis` |

W3 e W4 são puxados pelo n8n, não empurrados pela aplicação: o relatório precisa sair mesmo que ninguém abra o sistema naquela semana.

## Pendências reais

- **`npm install` e `npm run build` não foram executados** — o ambiente de geração está sem rede. Rode os dois antes do primeiro deploy.
- **Importação das 161 iniciativas** não está automatizada. O de-para de status e de área está pronto no banco (`map_legacy_status`, `area_aliases`), falta o script de carga do CSV.
- **Tabela `decisions`** não existe. O W4 precisa dela para os blocos "Decisões pendentes" e "Status das decisões anteriores" — ver `docs/metodologia-executiva.md`.
- **ROI (meta ≥ 3x)** ficou fora do dashboard: só 12 das 161 iniciativas têm custo informado, e um ROI sobre 7% da amostra engana mais do que informa.
- **Check-in no dia** não implementado (decisão D3). O modelo já suporta.
