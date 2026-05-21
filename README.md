# destaque.ai · Deck Builder

Plataforma interna para criar propostas personalizadas com auditoria GEO ao vivo.
Match visual exacto com [destaque.ai](https://destaque.ai).

## Stack

- Next.js 16 (App Router, Server Components, TypeScript strict)
- React 19
- Tailwind 4 (config em CSS via `@theme inline`)
- Supabase (Postgres + Auth magic link)
- Framer Motion 11
- React Hook Form + Zod
- Resend (email)
- pptxgenjs (download PowerPoint)
- nanoid (tokens de URL)

## Setup local

```bash
npm install
cp .env.local.example .env.local
# preencher variáveis
npm run dev
```

## Variáveis de ambiente

Ver `.env.local.example`. Necessárias:

| Var | Propósito |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server-only, NUNCA expor) |
| `ANTHROPIC_API_KEY` | Claude (geração de prompts + parsing de citações) |
| `OPENAI_API_KEY` | ChatGPT (auditoria) |
| `GOOGLE_AI_API_KEY` | Gemini |
| `PERPLEXITY_API_KEY` | Perplexity |
| `RESEND_API_KEY` | Email |
| `NEXT_PUBLIC_APP_URL` | URL do admin (https://admin.destaque.ai) |
| `NEXT_PUBLIC_PROPOSAL_URL` | URL do deck público (https://destaque.ai) |
| `ADMIN_EMAIL` | Único email autorizado (contacto@destaque.ai) |

## Supabase

Correr as migrations em ordem no SQL Editor:

1. `supabase/migrations/001_init.sql` — tabelas + índices + triggers
2. `supabase/migrations/002_rls.sql` — Row Level Security

Para gerar tipos (opcional, ao vivo a partir do projecto):

```bash
npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/types.generated.ts
```

## Estrutura

```
src/
├── app/
│   ├── (admin)/admin/          # painel admin (auth obrigatório)
│   │   ├── page.tsx            # dashboard
│   │   ├── prospects/
│   │   ├── proposals/
│   │   └── settings/
│   ├── (auth)/admin/login/     # magic link (público)
│   ├── (public)/proposta/[token]/  # deck público (Step 11+)
│   ├── api/
│   │   ├── audit/
│   │   ├── proposals/
│   │   └── cron/
│   ├── auth/callback/          # OAuth callback Supabase
│   ├── layout.tsx              # fontes + globals
│   └── globals.css             # design tokens + admin shell
├── components/
│   ├── admin/                  # Sidebar, Topbar, ProspectForm, ProposalWizard
│   ├── deck/                   # DeckContainer + slides (Step 11+)
│   └── Logo.tsx
├── lib/
│   ├── supabase/               # clients + types + middleware helper
│   ├── llm/                    # geradores e adapters (Step 9+)
│   ├── analytics/              # tracking client-side (Step 14)
│   ├── pptx/                   # geração PowerPoint (Step 16)
│   └── utils/
└── middleware.ts               # auth refresh em todas as rotas
supabase/migrations/            # SQL
```

## Auth

Magic link Supabase, restrito ao email definido em `ADMIN_EMAIL`.

1. Utilizador submete email em `/admin/login`
2. Server action valida que email = `ADMIN_EMAIL` e chama `signInWithOtp`
3. Supabase envia email
4. Callback em `/auth/callback` faz `exchangeCodeForSession`
5. Se email do user ≠ `ADMIN_EMAIL`, faz `signOut` e redirect

## Deploy (Vercel)

1. Importar repo no Vercel
2. Configurar domínio: `admin.destaque.ai` (DNS CNAME para `cname.vercel-dns.com`)
3. Configurar todas as env vars
4. URL público das propostas é `https://destaque.ai/proposta/{token}` — para isso adicionar redirect/proxy no Vercel do site principal

## Roadmap

| Step | Descrição | Estado |
|---|---|---|
| 1 | Setup Next 16 + Tailwind 4 | ✓ |
| 2 | Tokens, fonts, globals.css | ✓ |
| 3 | Estrutura de pastas | ✓ |
| 4 | Supabase clients + migrations | ✓ |
| 5 | Auth magic link | ✓ |
| 6 | Admin shell (sidebar) | ✓ |
| 7 | CRUD Prospects | ✓ |
| 8 | Wizard criar Proposta | ✓ |
| 9 | Geração prompts via Claude | ✓ |
| 10 | Auditoria GEO 4 motores | ✓ |
| 11 | Deck público `/proposta/[token]` | ✓ |
| 12 | DeckContainer + navegação | ✓ |
| 13 | 18 slides + Slide 4 Live Audit | ✓ |
| 14 | Tracking client-side | ✓ |
| 15 | Dashboard analytics | — |
| 16 | Download PowerPoint (pptxgenjs) | — |

## Auditoria GEO

A auditoria corre `prompts × 4 motores` (ChatGPT, Claude, Gemini, Perplexity).
Para cada resposta, Claude extrai marcas citadas, posição da marca do prospect,
concorrentes e sentimento. O resultado agregado é gravado em
`proposals.audit_results`.

- **Sem API keys configuradas** a auditoria corre em modo simulação
  (`mock-audit.ts`), gerando dados determinísticos — o fluxo completo
  (wizard → deck) é testável sem credenciais.
- A auditoria é iniciada pela página de detalhe da proposta
  (`AuditRunner`, client-driven via `/api/audit/start`), mais robusto em
  serverless do que um background job verdadeiro.
- Os motores são consultados directamente (sem grounding/web-search).
  Para produção, considerar adicionar pesquisa web a cada motor.
