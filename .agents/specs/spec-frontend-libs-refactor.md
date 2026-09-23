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
| `axios` | HTTP; futuro `lib/api.ts` com Bearer + refresh 401 |
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
lib/api.ts              # axios instance, interceptors (migrar lógica de lib/auth-fetch.ts)
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

## Ordem incremental (não migrar tudo de uma vez)

1. **Fundação** — deps, `Providers`, primeiro hook público (feito abaixo).
2. **`lib/api.ts`** — Axios + refresh JWT; deprecar `auth-fetch.ts`.
3. **Queries ADM** — `GET /exams`, ranking, participantes, sidebar aplicadores, fluxo aplicar.
4. **Mutations** — criar prova, status, presença, bulk questões/participantes.
5. **RHF + Zod** — `login-form`, `aplicador-login-form`, `create-exam-dialog`, `edit-exam-dialog`, `add-participants-dialog`.
6. **Table** — página participantes.
7. **Por último** — `/manage/[examId]/questoes` (muito estado local / dirty; RHF opcional).

## Progresso (atualizar ao migrar)

| Área | Status | Notas |
|------|--------|--------|
| `GET /resultados` lista | **Feito** | `hooks/use-exam-results.ts`, `app/resultados/page.tsx` |
| `GET /resultados/:examId` | Pendente | Ainda `useEffect` + `fetch`; tratar **403** como “bloqueado”, não `isError` genérico |
| `lib/api.ts` + interceptors | Pendente | `lib/auth-fetch.ts` ainda usado no manage |
| Manage / participantes / ranking | Pendente | `authFetch` + `useEffect` |
| Forms (RHF) | Pendente | Zod parcial (`login-form` safeParse manual, `lib/exam-schema.ts`, etc.) |
| `DataTable` em participantes | Pendente | |

## Referência — piloto resultados

- Hook: `hooks/use-exam-results.ts` — `examResultsQueryKey`, `getExamResults` → `Divulgada[]`, `useExamResults()`.
- Página: `app/resultados/page.tsx` — `isLoading`, `isError`, `data` → `DataTable`.
- Tipos coluna: `app/resultados/columns.tsx` (`Divulgada`).

## Gotchas já encontrados

- `AxiosPromise<T>` = `Promise<AxiosResponse<T>>`; se retornar `response.data`, tipar `Promise<T>`.
- Não usar `query.data?.data` quando a API retorna array na raiz.
- Não desmontar `DataTable` em `isFetching` de background — perde filtro digitado na tabela.
- `npm audit` high em `xlsx` (export ranking) — assunto separado da stack Query.
