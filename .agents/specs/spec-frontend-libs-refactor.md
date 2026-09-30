# Refatoração frontend — stack de dados e formulários

**Status: concluída.** MVP migrado de `fetch` + estado manual para Axios + TanStack Query + RHF/Zod onde aplicável. Checklist histórico: `spec-frontend-migration-order.md`.

**Regras de negócio e API:** `../backend_enem_read_v3/.agents/specs/spec-enem-read-v3-mvp.md` (não duplicar no frontend — ver `spec-enem-read-v3-mvp.md` como ponteiro).

## Objetivo

- Menos boilerplate de loading/erro/refetch.
- HTTP centralizado (Axios + interceptors JWT).
- Formulários com **React Hook Form** + **Zod** (`@hookform/resolvers`).
- Leituras/escritas servidor com **TanStack Query** (`useQuery` / `useMutation` + invalidação).
- Listagens com **TanStack Table** (já parcialmente adotado); busca/filtro na tabela é **client-side**, independente do Query.

## Dependências (package.json)

| Lib | Uso |
|-----|-----|
| `axios` | HTTP via [`lib/api.ts`](../../lib/api.ts) (`authAxiosRequest`, `publicAxiosRequest`, `tryRefresh`) |
| `@tanstack/react-query` | Cache, estados `isLoading`/`isError`, mutations |
| `@tanstack/react-table` | `DataTable`, colunas em `*/columns.tsx` |
| `zod` | Schemas em `lib/*-schema.ts`; validação alinhada ao Nest |
| `react-hook-form` + `@hookform/resolvers` | Forms (login, dialogs); `FieldError` em `components/ui/field.tsx` |

**Não instalar** o pacote npm `tanstack` (nome solto) — é outro produto. Usar sempre escopo `@tanstack/...`.

## Infra obrigatória

- `components/providers.tsx` — `QueryClientProvider` (defaults: `staleTime: 0`, `retry: 1`, `refetchOnWindowFocus: false`).
- `app/layout.tsx` — envolver `{children}` com `<Providers>`.

Sem provider, `useQuery` falha em runtime.

## Convenções (alvo)

```
lib/api.ts              # HTTP centralizado (Bearer + tryRefresh em 401); lib/auth-axios.ts só reexport deprecated
hooks/use-*.ts          # queryKey factory + useQuery / useMutation por domínio (18 hooks)
lib/query-keys.ts       # opcional futuro — hoje keys vivem nos hooks
```

- **`queryFn`:** retorna o **corpo útil** (ex.: `Divulgada[]`), não `AxiosResponse` inteiro. Nest costuma devolver JSON direto (array ou objeto), não envelope `{ data: T }` unless DTO explícito.
- **`queryFn` + cancelamento:** `({ signal }) => axios.get(url, { signal })`.
- **Erro HTTP:** `throw` em status fora 2xx para Query marcar `isError` (Axios não rejeita 4xx por padrão).
- **Mutations:** `onSuccess` → `queryClient.invalidateQueries({ queryKey: ... })`.
- **Auth ADM:** rotas autenticadas migram de `authFetch` para Axios com interceptor; rotas públicas (`/resultados`, login) sem token ou client separado.

## TanStack Table vs Query

- Query busca **uma vez** (ou refetch) e passa `data={lista}` ao `DataTable`.
- Filtro “Buscar prova…” em `app/manage/data-table.tsx` usa `columnFilters` do **Table**, não a `queryKey`.
- Reutilizar `DataTable` (`app/manage/data-table.tsx`); participantes: `participantes/columns.tsx` + filtro client-side.

## HTTP (`lib/api`) vs TanStack Query (TSQ)

| Camada | Status |
|--------|--------|
| HTTP centralizado | **Feito** — `lib/api.ts` |
| TSQ em leituras/escritas de API (client) | **Feito** — 18 hooks; exceções abaixo |

### Com TSQ (`useQuery` / `useMutation` em hooks)

| Hook | Páginas / componentes |
|------|------------------------|
| `hooks/use-exam-results.ts` | `app/resultados/page.tsx` |
| `hooks/use-exam-ranking.ts` | `app/resultados/[examId]/page.tsx` |
| `hooks/use-exams.ts` | `app/manage/page.tsx` |
| `hooks/use-exam-participants.ts` | `app/manage/[examId]/participantes/page.tsx`, `components/add-participants-dialog.tsx` (mutations) |
| `hooks/use-exam-questions.ts` | `app/manage/[examId]/questoes/page.tsx` |
| `hooks/use-student-detail.ts` | `components/rank-student-sheet.tsx` |
| `hooks/use-admin-exam-results.ts` | `app/manage/[examId]/page.tsx` |
| `hooks/use-update-exam-status.ts` | `app/manage/[examId]/page.tsx` (mutation status) |
| `hooks/use-create-exam.ts` | `components/create-exam-dialog.tsx` |
| `hooks/use-exam-detail.ts` | `components/edit-exam-dialog.tsx` |
| `hooks/use-aplicadores.ts` | `components/app-sidebar.tsx` |
| `hooks/use-aplicador-me.ts` | `app/aguardando/page.tsx` |
| `hooks/use-presentes.ts` | `app/manage/aplicar/*` (lista + redação) |
| `hooks/use-participant-answers.ts` | `app/manage/aplicar/.../[participantId]/page.tsx` |
| `hooks/use-bulk-answers.ts` | corretor (envio bulk) |
| `hooks/use-adm-login.ts` | `components/login-form.tsx` |
| `hooks/use-aplicador-login.ts` | `components/aplicador-login-form.tsx` |
| `hooks/use-in-progress-exams.ts` | `components/aplicador-login-form.tsx` |

**Total:** 18 hooks de domínio com TSQ.

### Exceções aceitas (sem TSQ)

| Arquivo | Comportamento |
|---------|----------------|
| `app/manage/[examId]/layout.tsx` | RSC: `publicAxiosRequest` `GET /exams/:id` só para título no header |
| `app/manage/aplicar/[examId]/layout.tsx` | Idem |
| `lib/api.ts` | `tryRefresh`, `logoutSession` — utilitários de sessão |
| `app/aguardando/page.tsx` | Após aprovação, `loginAplicadorAndStoreToken` (Axios imperativo) antes do redirect; polling = TSQ (`useAplicadorApprovalPoll`) |

### Sem HTTP de API (UI / guard)

- `components/login-form.tsx` / `aplicador-login-form.tsx` — parte do `useEffect` é só redirect com JWT no client.
- `app/manage/[examId]/questoes/page.tsx` — `useEffect` para dirty/RHF; leitura = `useExamQuestions`.
- `lib/use-aplicar-auth.ts` — guard de rota (JWT decode), sem HTTP.
- `components/landing-carousel.tsx`, `components/ui/sidebar.tsx` — UI.

Detalhe passo a passo (histórico, todos feitos): `spec-frontend-migration-order.md`.

## Ordem incremental (histórico — todos feitos)

1. **Fundação** — deps, `Providers`, primeiro hook público.
2. **`lib/api.ts`** — Axios + refresh JWT; `auth-fetch.ts` removido.
3. **Queries ADM** — exams, ranking, participantes, sidebar, aplicar.
4. **Mutations** — criar prova, status, presença, bulk questões/participantes.
5. **RHF + Zod** — logins, create/edit prova, add-participants.
6. **Table** — participantes + `DataTable`.
7. **Questões ADM** — RHF + dirty; invalidação de cache nas mutations.

## Progresso (final)

**Ordem passo a passo (checklist completo):** `spec-frontend-migration-order.md`.  
**Inventário HTTP vs TSQ (lista completa):** seção [HTTP vs TanStack Query](#http-libapi-vs-tanstack-query-tsq) acima.

| Área | HTTP (`api`) | TSQ | Notas |
|------|--------------|-----|--------|
| `GET /resultados` lista | Feito | Feito | `use-exam-results` |
| `GET /resultados/:examId` (top 15) | Feito | Feito | `use-exam-ranking`, 403 → `ResultadosBlockError` |
| `POST /resultados/:examId/consulta` | Feito | Feito | `use-resultados-consulta` + RHF/Zod dialog |
| `GET /exams` lista | Feito | Feito | `use-exams` |
| Participantes ADM | Feito | Feito | `use-exam-participants` |
| Questões ADM | Feito | Feito | `use-exam-questions` + RHF; bulk/delete invalidam cache relacionado |
| Detalhe aluno (sheet) | Feito | Feito | `use-student-detail` |
| Ranking ADM + status prova | Feito | Feito | `use-admin-exam-results`, `use-update-exam-status` |
| Create / edit / delete prova | Feito | Feito | `use-create-exam`, `use-exam-detail` + RHF |
| Sidebar aplicadores | Feito | Feito | `use-aplicadores` |
| Fluxo aplicador + aguardando | Feito | Feito | hooks Passo 5 |
| Login ADM / aplicador | Feito | Feito | `use-adm-login`, `use-aplicador-login`, `use-in-progress-exams` + RHF |
| Layouts título prova (RSC) | Feito | N/A | `publicAxiosRequest` no server |
| Forms (RHF) | — | — | Feito: logins, participantes, questões, create/edit prova |
| `DataTable` participantes | — | — | Feito — `participantes/columns.tsx` + `DataTable` |

## Referência — piloto resultados

- Hook: `hooks/use-exam-results.ts` — `examResultsQueryKey`, `getExamResults` → `Divulgada[]`, `useExamResults()`.
- Página: `app/resultados/page.tsx` — `isLoading`, `isError`, `data` → `DataTable`.
- Tipos coluna: `app/resultados/columns.tsx` (`Divulgada`).

## Gotchas já encontrados

- `AxiosPromise<T>` = `Promise<AxiosResponse<T>>`; se retornar `response.data`, tipar `Promise<T>`.
- Não usar `query.data?.data` quando a API retorna array na raiz.
- Não desmontar `DataTable` em `isFetching` de background — perde filtro digitado na tabela.
- Questões ADM: hidratar form uma vez por `examId` (`hydratedExamId`); refetch após mutation não reseta itens dirty. Validação Zod só no “Salvar”, não `zodResolver` no `useForm` inteiro.
- `npm audit` high em `xlsx` (export ranking) — assunto separado da stack Query.
- Sem `fetch()` / `authFetch` em `app/` e `components/` — HTTP via `@/lib/api`.
