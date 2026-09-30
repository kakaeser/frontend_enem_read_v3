<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Enem Read v3 — Frontend

Refatoração do `enem_read` (FastAPI + SQLAlchemy) para **NestJS + Prisma** (backend) e **Next.js 16** (este frontend). Sistema para correção/divulgação do ENEM da Read — 8ª Igreja Presbiteriana, ~60 participantes/edição, ~70 questões + redação.

## Repo layout

```
enem_read_v3/
  frontend_enem_read_v3/  # este repo — Next.js App Router
  backend_enem_read_v3/   # NestJS 12 + Prisma 6 + Postgres (Neon) + API no Render — irmão, não monorepo workspaces
```

Sem workspaces — cada projeto tem seu `package.json`/`node_modules`. Backend path: `../backend_enem_read_v3`.

## Stack / Tooling

- Next.js `16.3.3` (App Router), React `19.2.8`, Tailwind CSS `4` via `@tailwindcss/postcss`, TypeScript `5` strict.
- **Dados / forms:** Axios (`lib/api.ts`), TanStack Query (`components/providers.tsx`), TanStack Table (`app/manage/data-table.tsx`), Zod + React Hook Form — convenções em `.agents/specs/spec-frontend-libs-refactor.md` (**concluída**).
- ESLint `9` com `eslint-config-next` (core-web-vitals + typescript). Config em `eslint.config.mjs:1`.
- `postcss.config.mjs:1` — apenas `{"@tailwindcss/postcss": {}}`, não `tailwindcss` direto.
- Path alias `@/*` → `./*` (`tsconfig.json:22`). Ex: `import x from "@/app/page"`.
- `app/layout.tsx:20` usa `LayoutProps<"/">` (Next 16 typed routes) + `next/font` Geist.

## Commands

```bash
npm run dev      # Next dev (recria bloco AGENTS.md acima — não remover do diff)
npm run build    # next build
npm run lint     # eslint (oxlint é do backend, não usar aqui)
```

Frontend é `create-next-app` limpo — sem testes, sem `.env`, sem `opencode.json`. Adicionar env quando integrar com backend.

Backend (executar em `../backend_enem_read_v3`):
```bash
npm run start:dev          # nest --watch
npm run build              # nest build -> dist/
npm test                   # vitest run (units, **/*.spec.ts)
npm run test:e2e           # vitest --config vitest.config.e2e.ts (**/*.e2e-spec.ts)
npm run lint               # oxlint src/ test/  (não eslint)
npx prisma validate|generate|migrate dev --name init
npm run seed               # tsx prisma/seed.ts — importa legacy SQLite prisma/legacy/database.db
```

## Data model (Prisma `backend/prisma/schema.prisma:24`)

Backend é fonte da verdade. Frontend consome via REST.

- `Exam` (`exams`, PK `exam_id`): `nome`, `qtdQuestoes`, `notaSimbolica` default 1000, `status` enum `draft|in_progress|completed`, `encerramento`, `createdAt/updatedAt`. 1:N `Participant|Question|Aplicador` cascade.
- `Adm` (`adms`): `email` unique, `senha` (bcrypt hash), sem `role`.
- `Aplicador` (`aplicadores`): `nome`, `status` `PENDENTE|APROVADO|REJEITADO`, FK `provaId→Exam` Cascade, `aprovadoPorId?`.
- `Participant` (`participantes`): `nome`, `consultaCode` (único por prova), `presenca` default true, `redacaoNota?`, FK `examId` Cascade + index, `aplicadorId?` SetNull. 1:N `Answer`.
- `Question` (`questoes`): `numero`, `peso` default 1, `correctAnswer` (`question_correct_answer`), `enunciado` Text, `alternativas` Json `[{letra,texto}]`, FK `examId` Cascade, `@@unique([examId, numero])`.
- `Answer` (`resultados`): `alternativa`, `confidenceScore?`, `manuallyReviewed` default false, FK `userId→Participant` Cascade, `questId→Question` Cascade, `@@unique([userId, questId])`. Sem `examId` redundante (normalizado vs legado).

Gaps legados ainda relevantes: validação `user.examId == quest.examId` é na aplicação (sem constraint DB); `Fix_schema_constraints.py` adicionava ON DELETE CASCADE que só existe se via Prisma/migration, não `Base.metadata.create_all`. Todas relations no Prisma têm `onDelete: Cascade` explícito.

## 7-step backend flow

1. `POST /exams` cria prova + N `Question` placeholders vazias em transaction.
2. `PUT /exams/:examId/questions/bulk` — upsert em lote (array `{id?, numero, enunciado, alternativas, correctAnswer, peso}`) — cria e edita em 1 request.
3. `POST /exams/:examId/participants` + `POST .../participants/bulk` — cadastra participantes (gera `consultaCode` no servidor).
4. Gabarito via `Question.correctAnswer` (manual, sem OCR no MVP).
5. Respostas via `POST /exams/:examId/answers/bulk` (manual, sem OMR), `unique [userId, questId]`.
6. Nota = `(sum(peso*acerto)/sum(pesos) * notaSimbolica) + redacaoNota` — cálculo estático em `ResultsService`.
7. `GET /resultados` lista divulgadas + `GET /resultados/:examId` pódio top 15 + `POST /resultados/:examId/consulta` detalhe por código; `GET /exams/:examId/results` (ADM ranking completo).

## Frontend routes (MVP + stack Axios/Query/RHF — ver spec-frontend-libs-refactor.md)

- `/` login com toggle ADM (email/senha → `POST /auth/login`) vs Aplicador (nome+provaId → `POST /auth/aplicador`); botão "Entrar como aplicador" só habilita se `GET /exams?status=in_progress` retorna >0.
- `/resultados` público — só libera se `now >= encerramento + 2 dias` (403 antes). Lista provas; `/resultados/[examId]` mostra top 15 (nome) + dialog **Consulta individual** (código) → sheet com detalhe por questão.
- `/manage/[examId]` — painel ADM: status `draft→in_progress→completed` (popup warning ao encerrar), rank ao vivo + drawer lateral ao clicar aluno (editar `presenca`/`redacaoNota`). Subrotas: `/manage/[examId]/participantes`, `/manage/[examId]/questoes` (edição dinâmica bulk).
- Auth: JWT Bearer 1h (`JWT_SECRET`/`JWT_EXPIRES_IN` no backend `.env`). Aplicador sem senha, só `APROVADO` + `Exam in_progress` libera.

> Sem WebSocket no MVP — ranking estático; ver `../backend_enem_read_v3/.agents/specs/spec-enem-read-v3-mvp.md`.

## Infra / Deploy

- Frontend → **Cloudflare Workers** via OpenNext (`@opennextjs/cloudflare`, `wrangler.jsonc`, `npm run deploy`). Sem bindings: o frontend fala com a API via HTTPS (`NEXT_PUBLIC_API_URL` → URL do Render).
- Backend → **Render** — NestJS com `PORT` injetado (`process.env.PORT ?? 3030`); deploy via `Dockerfile` (multi-stage) ou build nativo no Render. Env: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`. Detalhes em `../backend_enem_read_v3/AGENTS.md` e `../backend_enem_read_v3/docs/render-keep-alive.md`.
- DB → **Neon Postgres** (só no backend) — `DATABASE_URL` (pooler) + `DIRECT_URL` (conexão direta / `DATABASE_URL_UNPOOLED`) no `.env` do backend (gitignored). Prisma: `directUrl = env("DIRECT_URL")` em `prisma/schema.prisma`.

## Gotchas

- Next 16 breaking changes — ler `node_modules/next/dist/docs/` antes de codar; `next dev` reescreve o bloco no topo deste arquivo.
- Backend é ESM (`"type":"module"`, `moduleResolution: nodenext`) — imports com `.js` mesmo para `.ts` (`import { X } from "./x.js"`). `strictPropertyInitialization: false` no backend `tsconfig`.
- `frontend` usa `eslint`, `backend` usa `oxlint` + `vitest` (não Jest). Não misturar.
- Backend specs: `src/**/*.spec.ts` (vitest) vs `test/**/*.e2e-spec.ts` com `supertest` sobre `AppModule` — seam HTTP único.
- Prisma 6 pinned (não v7/v8 RC) — `driverAdapters` breaking change evitado.
- `app/layout.tsx:20` tipagem `LayoutProps<"/">` é Next 16 — não trocar por `PropsWithChildren`.
- shadcn/ui: `npx shadcn add` sobrescreve `app/globals.css` com paleta `oklch` + `@import "tw-animate-css"`/`shadcn/tailwind.css` — sempre deletar e manter apenas PALETA OFICIAL ENEM DA READ comentada em `globals.css:6` (`--read-green`/`--read-logo-dark`/etc.) e usar só `bg-read-*`/`text-read-*`. Não reintroduzir tokens `oklch`.
- Paleta travada (não criar cores novas): `app/globals.css:6` é fonte da verdade — 8 oficiais `#05dd86` `#196143` `#248fa3` `#3e9eb5` `#414342` `#f6f9f9` `#bdbebd` `#131f20` + 3 variações `#1a2424` `read-ink`, `#0e1212` `read-ink-dark`, `#0a0c0c` `read-darkest` (sidebar/header), já mapeadas em `--sidebar` via `var(--read-*)`. Ao instalar shadcn, fazer `cp globals.css.bak && npx shadcn add ... && git diff` e reverter qualquer `oklch` ou hex novo; hovers devem ser diferentes do bg (ex: `bg-read-ink` → `hover:bg-read-dark`, nunca `hover:bg-read-ink`).

## Specs

- **Negócio / API (canônico):** `../backend_enem_read_v3/.agents/specs/spec-enem-read-v3-mvp.md` — ponteiro local: `.agents/specs/spec-enem-read-v3-mvp.md`.
- **Frontend (concluído):** `.agents/specs/spec-frontend-libs-refactor.md` + histórico `.agents/specs/spec-frontend-migration-order.md`.
