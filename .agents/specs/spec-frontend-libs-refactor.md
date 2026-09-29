# Refatoração frontend — stack de dados e formulários

Documento para continuidade (mentor / estágio): migrar o MVP de `fetch` + `useEffect` + `useState` manual para o padrão usado na empresa.

**Regras de negócio e API:** continuam em `../backend_enem_read_v3/.agents/specs/spec-enem-read-v3-mvp.md`.

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
lib/query-keys.ts         # queryKey factories estáveis
hooks/queries/*.ts        # useQuery / useMutation por domínio (ou hooks/use-*.ts)
```

- **`queryFn`:** retorna o **corpo útil** (ex.: `Divulgada[]`), não `AxiosResponse` inteiro. Nest costuma devolver JSON direto (array ou objeto), não envelope `{ data: T }` unless DTO explícito.
- **`queryFn` + cancelamento:** `({ signal }) => axios.get(url, { signal })`.
- **Erro HTTP:** `throw` em status fora 2xx para Query marcar `isError` (Axios não rejeita 4xx por padrão).
- **Mutations:** `onSuccess` → `queryClient.invalidateQueries({ queryKey: ... })`.
- **Auth ADM:** rotas autenticadas migram de `authFetch` para Axios com interceptor; rotas públicas (`/resultados`, login) sem token ou client separado.

## TanStack Table vs Query

- Query busca **uma vez** (ou refetch) e passa `data={lista}` ao `DataTable`.
- Filtro “Buscar prova…” em `app/manage/data-table.tsx` usa `columnFilters` do **Table**, não a `queryKey`.
- Reutilizar `DataTable`; evoluir para `components/data-table.tsx` quando fizer sentido. Participantes ainda usa `<table>` manual — candidato a colunas + `DataTable`.

## HTTP (`lib/api`) vs TanStack Query (TSQ)

**Não confundir:** migrar para `@/lib/api` **não** significa que a tela usa TSQ. Muitos arquivos já chamam `authAxiosRequest` / `publicAxiosRequest` com `useEffect` + `useState` local.

| Camada | Status |
|--------|--------|
| HTTP centralizado | **Feito** — `lib/api.ts` |
| TSQ em todas as leituras/escritas de API | **Parcial** — ver inventário abaixo |

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

**Total:** 15 hooks de domínio com TSQ.

### Sem TSQ (API via `lib/api` + estado manual ou RSC)

| Arquivo | O que faz hoje | Próximo hook sugerido |
|---------|----------------|------------------------|
| ~~`app/manage/[examId]/page.tsx`~~ | — | **Feito** — `use-admin-exam-results`, `use-update-exam-status` |
| ~~`components/create-exam-dialog.tsx`~~ | — | **Feito** — `use-create-exam` + RHF |
| ~~`components/edit-exam-dialog.tsx`~~ | — | **Feito** — `use-exam-detail` |
| ~~`components/app-sidebar.tsx`~~ | — | **Feito** — `use-aplicadores` |
| ~~`app/aguardando/page.tsx`~~ | — | **Feito** — `use-aplicador-me` |
| ~~`app/manage/aplicar/[examId]/page.tsx`~~ | — | **Feito** — `use-presentes` + `use-exam-questions` |
| ~~`app/manage/aplicar/.../[participantId]/page.tsx`~~ | — | **Feito** — answers + `use-bulk-answers` |
| ~~`app/manage/aplicar/.../redacao/page.tsx`~~ | — | **Feito** — `usePatchPresenteRedacao` |
| `components/aplicador-login-form.tsx` | `GET /exams?status=in_progress` + login POST | `useInProgressExams` (+ mutation login opcional) |
| `components/login-form.tsx` | `POST /auth/login` no submit | TSQ opcional (`useMutation`); `useEffect` só redirect se token válido |
| `app/manage/[examId]/layout.tsx` | `GET /exams/:id` no **Server Component** | Manter RSC ou client + `useExamDetail` (decisão no Passo 7) |
| `app/manage/aplicar/[examId]/layout.tsx` | Idem título da prova (RSC) | Idem |

### Sem TSQ e sem API (não entram no inventário de dados)

- `components/login-form.tsx` / `aplicador-login-form.tsx` — parte do `useEffect` é só redirect com JWT no client.
- `app/manage/[examId]/questoes/page.tsx` — `useEffect` para dirty/RHF/localStorage, **não** para fetch (fetch = `useExamQuestions`).
- `lib/use-aplicar-auth.ts` — guard de rota (JWT decode), sem HTTP.
- `components/landing-carousel.tsx`, `components/ui/sidebar.tsx` — UI.

### Ordem sugerida para fechar TSQ

1. Ranking ADM — `manage/[examId]/page.tsx`
2. Create/edit exam — dialogs + invalidação `examsQueryKey`
3. Sidebar aplicadores
4. Fluxo `aplicar/*` + `aguardando`
5. Login aplicador — lista de provas em `useQuery`

Detalhe passo a passo: `spec-frontend-migration-order.md`.

## Ordem incremental (não migrar tudo de uma vez)

1. **Fundação** — deps, `Providers`, primeiro hook público (feito abaixo).
2. **`lib/api.ts`** — **Feito** (Axios + refresh JWT); `auth-fetch.ts` removido.
3. **Queries ADM** — `GET /exams`, ranking, participantes, sidebar aplicadores, fluxo aplicar.
4. **Mutations** — criar prova, status, presença, bulk questões/participantes.
5. **RHF + Zod** — `login-form`, `aplicador-login-form`, `create-exam-dialog`, `edit-exam-dialog`, `add-participants-dialog`.
6. **Table** — página participantes.
7. **Por último** — `/manage/[examId]/questoes` (muito estado local / dirty; RHF opcional).

## Progresso (atualizar ao migrar)

**Ordem passo a passo (checklist completo):** `spec-frontend-migration-order.md`.  
**Inventário HTTP vs TSQ (lista completa):** seção [HTTP vs TanStack Query](#http-libapi-vs-tanstack-query-tsq) acima.

| Área | HTTP (`api`) | TSQ | Notas |
|------|--------------|-----|--------|
| `GET /resultados` lista | Feito | Feito | `use-exam-results` |
| `GET /resultados/:examId` | Feito | Feito | `use-exam-ranking`, 403 → `ResultadosBlockError` |
| `GET /exams` lista | Feito | Feito | `use-exams` |
| Participantes ADM | Feito | Feito | `use-exam-participants` |
| Questões ADM | Feito | Feito | `use-exam-questions` + RHF na página |
| Detalhe aluno (sheet) | Feito | Feito | `use-student-detail` |
| Ranking ADM + status prova | Feito | Feito | `use-admin-exam-results`, `use-update-exam-status` |
| Create / edit / delete prova | Feito | Feito | `use-create-exam`, `use-exam-detail` + RHF |
| Sidebar aplicadores | Feito | Feito | `use-aplicadores` |
| Fluxo aplicador + aguardando | Feito | Feito | hooks Passo 5 |
| Login ADM / aplicador | Feito | Opcional | submit manual; lista provas aplicador sem Query |
| Layouts título prova (RSC) | Feito | N/A | `publicAxiosRequest` no server |
| Forms (RHF) | — | — | Parcial: participantes, questões, create/edit prova; login pendente |
| `DataTable` participantes | — | — | Pendente (`<table>` manual) |

## Referência — piloto resultados

- Hook: `hooks/use-exam-results.ts` — `examResultsQueryKey`, `getExamResults` → `Divulgada[]`, `useExamResults()`.
- Página: `app/resultados/page.tsx` — `isLoading`, `isError`, `data` → `DataTable`.
- Tipos coluna: `app/resultados/columns.tsx` (`Divulgada`).

## Gotchas já encontrados

- `AxiosPromise<T>` = `Promise<AxiosResponse<T>>`; se retornar `response.data`, tipar `Promise<T>`.
- Não usar `query.data?.data` quando a API retorna array na raiz.
- Não desmontar `DataTable` em `isFetching` de background — perde filtro digitado na tabela.
- `npm audit` high em `xlsx` (export ranking) — assunto separado da stack Query.
