# Ordem de migração — TanStack Query + Axios + Zod + RHF

Passo a passo para concluir a refatoração descrita em `spec-frontend-libs-refactor.md`.  
Migrar **um bloco por vez**, validar manualmente, marcar o checklist e só então avançar.

**Referências**

- Convenções e gotchas: `spec-frontend-libs-refactor.md`
- **Inventário o que tem / não tem TanStack Query:** seção *HTTP vs TanStack Query* em `spec-frontend-libs-refactor.md`
- API / negócio: `../backend_enem_read_v3/.agents/specs/spec-enem-read-v3-mvp.md`
- Piloto de leitura pública: `hooks/use-exam-results.ts` + `app/resultados/page.tsx`
- Piloto ADM autenticado: `hooks/use-exam-participants.ts` + `authAxiosRequest` de `@/lib/api`

---

## Estado atual (baseline)

| Status | Área | Arquivos principais |
|--------|------|---------------------|
| Feito | Fundação Query | `components/providers.tsx`, `app/layout.tsx` |
| Feito | Resultados públicos (lista) | `hooks/use-exam-results.ts`, `app/resultados/page.tsx` |
| Feito | Resultados públicos (por prova) | `hooks/use-exam-ranking.ts`, `app/resultados/[examId]/page.tsx` |
| Feito | Participantes ADM | `hooks/use-exam-participants.ts`, `app/manage/[examId]/participantes/page.tsx` |
| Feito | Questões ADM (RHF + Zod) | `hooks/use-exam-questions.ts`, `app/manage/[examId]/questoes/page.tsx` |
| Feito | Detalhe aluno (sheet) | `hooks/use-student-detail.ts`, `components/rank-student-sheet.tsx` |
| Feito | Lista de provas ADM | `hooks/use-exams.ts`, `app/manage/page.tsx` |
| Feito | HTTP (`lib/api.ts`) | `tryRefresh`, `authAxiosRequest`, `publicAxiosRequest`; `@/lib/auth-axios` reexport deprecated |
| Parcial | TanStack Query | 8 hooks feitos; ranking ADM (Passo 3) feito; ~9 arquivos ainda `useEffect` + `api` |
| Pendente | RHF forms, TSQ aplicar/sidebar, polish | ver passos abaixo |

---

## Passo 1 — `lib/api.ts` e auth unificada

**Status: feito** (implementação via `axiosHttp` + retry 401, não `axios.create` interceptors — equivalente funcional).

### Tarefas restantes (opcional)

- [ ] Criar `lib/auth-token.ts` — `decodeJwtPayload`, `isAccessTokenValid` (skew ~30s), reutilizar nos logins
- [ ] Evoluir para `axios.create` + interceptors se quiser alinhar 100% à spec “empresa”

### Critério de pronto (atingido)

- HTTP em `@/lib/api`; `lib/auth-fetch.ts` removido; imports novos usam `@/lib/api`

---

## Passo 2 — Lista de provas (`GET /exams`)

**Status:** em grande parte **feito** (`use-exams` + `manage/page`).

### Tarefas restantes

- [ ] `useExams`: tipar `useQuery<Exam[], Error>`; tipo `Exam` de `@/app/manage/columns`
- [ ] Tratar `isError` na UI (hoje só `isLoading`)
- [ ] `create-exam-dialog`: mutation `POST /exams` + `invalidateQueries({ queryKey: examsQueryKey })` — remover `onCreated={refetch}` quando invalidação estiver no dialog (Passo 4)

### Critério de pronto

- Criar prova atualiza a tabela sem `fetch` manual no dialog

---

## Passo 3 — Ranking ADM e status da prova

**Status: feito** (`hooks/use-admin-exam-results.ts`, `hooks/use-update-exam-status.ts`, `app/manage/[examId]/page.tsx`).

**Objetivo:** substituir `useEffect` + `authFetch` em `app/manage/[examId]/page.tsx`.

### Criar hooks (sugestão de nomes)

- `hooks/use-admin-exam-results.ts` (ou `use-exam-admin-ranking.ts`)
  - `adminExamResultsQueryKey(examId)` → `["exam-admin-results", examId]`
  - `GET /exams/:examId/results` → `RankingResponse` (`lib/ranking-types.ts`)
  - `useAdminExamResults(examId)`
- `hooks/use-update-exam-status.ts`
  - `PATCH /exams/:examId/status` com `{ status }`
  - `onSuccess`: invalidar `adminExamResultsQueryKey(examId)` e `examsQueryKey`

### Arquivos a alterar

- [x] `app/manage/[examId]/page.tsx` — consumir hooks; remover `requestRanking`, `fetchRanking`, estados manuais de loading/erro onde o Query cobrir
- [x] Manter `RankStudentSheet` + `useStudentDetail` (já em Query)

### Critério de pronto

- Abrir painel da prova: ranking carrega via Query
- Iniciar / encerrar prova via mutation; lista e ranking coerentes após invalidação
- Export Excel após encerrar continua funcionando

---

## Passo 4 — Sidebar, criar e editar prova

**Objetivo:** ADM no layout da prova sem `fetch`/`authFetch` solto.

### Hooks / mutations sugeridos

- `hooks/use-aplicadores.ts` — `GET /aplicadores?provaId=`, `PATCH /aplicadores/:id/status`
- `hooks/use-create-exam.ts` — `POST /exams` (ou mutation dentro de `use-exams.ts`)
- `hooks/use-exam-detail.ts` — `GET` / `PUT` / `PATCH` `/exams/:examId` para o dialog de edição

### Arquivos

- [ ] `components/app-sidebar.tsx` — lista aplicadores, aprovar/rejeitar, logout (logout pode ficar utilitário em `lib/auth.ts`)
- [ ] `components/create-exam-dialog.tsx` — mutation + Zod (`lib/exam-schema.ts`) + RHF
- [ ] `components/edit-exam-dialog.tsx` — Query para carregar + mutations para salvar/excluir
- [ ] `app/manage/data-table.tsx` — `onCreated` opcional após invalidação global de `examsQueryKey`

### Critério de pronto

- Fluxo criar/editar prova e aprovar aplicador na sidebar sem `authFetch`

---

## Passo 5 — Fluxo aplicador (`aguardando` + `aplicar/*`)

**Objetivo:** mesma stack; rotas autenticadas com Bearer (aplicador pode não ter `refresh_token` — tratar 401 com redirect login).

### Hooks sugeridos (agrupar por domínio)

- `hooks/use-aplicador-me.ts` — polling ou refetch em `aguardando` (`GET /aplicadores/me`, status da fila)
- `hooks/use-aplicar-exam-questions.ts` — `GET /exams/:examId/questions` (hoje `fetch` sem auth em partes)
- `hooks/use-presentes.ts` — `GET .../participants/presentes`
- `hooks/use-bulk-answers.ts` — `POST .../answers/bulk`
- Redação: `hooks/use-participant-redacao.ts` ou reutilizar padrão de `use-student-detail` se endpoint compatível

### Arquivos

- [ ] `app/aguardando/page.tsx`
- [ ] `app/manage/aplicar/[examId]/page.tsx`
- [ ] `app/manage/aplicar/[examId]/[participantId]/page.tsx`
- [ ] `app/manage/aplicar/[examId]/redacao/page.tsx`
- [ ] `components/aplicar-logout-button.tsx` — centralizar logout (opcional)

### Critério de pronto

- Aplicador: login → aguardando → aplicar cartão → salvar respostas/redação sem `authFetch`/`fetch` manual
- `lib/use-aplicar-auth.ts` pode continuar só com JWT no client (sem HTTP)

---

## Passo 6 — Formulários de login (RHF + Zod)

**Objetivo:** alinhar aos dialogs já migrados (`add-participants-dialog`, questões).

### Arquivos

- [ ] `components/login-form.tsx` — `useForm` + `zodResolver`; `POST /auth/login` via Axios (`api` público)
- [ ] `components/aplicador-login-form.tsx` — RHF; `GET /exams?status=in_progress` via Query (`enabled` no mount); login mutation
- [ ] Extrair schemas para `lib/login-schema.ts` / reutilizar `lib/exam-schema.ts` onde couber
- [ ] Remover duplicação de `decodePayload` / `isTokenValid` (usar `lib/auth-token.ts` do Passo 1)

### Critério de pronto

- Login ADM e aplicador com mesma UX; redirect automático se token válido no mount

---

## Passo 7 — Por último: layouts RSC e polish

**Objetivo:** decidir se metadados de prova no layout continuam em Server Component ou viram client + Query.

### Arquivos

- [ ] `app/manage/[examId]/layout.tsx` — hoje `fetch` server `GET /exams/:examId`
- [ ] `app/manage/aplicar/[examId]/layout.tsx` — idem
- [ ] `components/header_adm.tsx` — logout via util compartilhado

**Opções**

1. Manter RSC `fetch` só para título/metadata (sem Query).
2. Client wrapper com `useExamDetail(examId)` e skeleton no layout.

### Extras (spec original)

- [ ] Participantes: opcional migrar `<table>` manual para `DataTable` + colunas (filtro client-side)
- [ ] `lib/query-keys.ts` — centralizar factories (`examsQueryKey`, etc.) quando a maioria dos hooks existir
- [ ] Atualizar tabela “Progresso” em `spec-frontend-libs-refactor.md`

### Critério de pronto

- Nenhum `grep 'authFetch'` / `fetch(\`\${base}`` em `app/` e `components/` exceto `lib/*` e testes
- `npm run lint` e `npm run build` limpos

---

## Checklist rápido por arquivo (pendentes)

Use como mapa ao fechar o Passo 7:

| Arquivo | Passo |
|---------|-------|
| `lib/api.ts`, `lib/auth-token.ts` | 1 |
| `hooks/use-exams.ts`, `app/manage/page.tsx` | 2 (revisão) |
| `app/manage/[examId]/page.tsx` | 3 |
| `components/app-sidebar.tsx` | 4 |
| `components/create-exam-dialog.tsx` | 4 |
| `components/edit-exam-dialog.tsx` | 4 |
| `app/aguardando/page.tsx` | 5 |
| `app/manage/aplicar/**` | 5 |
| `components/login-form.tsx` | 6 |
| `components/aplicador-login-form.tsx` | 6 |
| `app/manage/[examId]/layout.tsx`, `app/manage/aplicar/[examId]/layout.tsx` | 7 |
| `components/header_adm.tsx`, `components/aplicar-logout-button.tsx` | 4 / 7 |

---

## Ordem resumida (não pular)

1. Infra Axios + token  
2. Lista provas (fechar create + invalidação)  
3. Ranking ADM + status  
4. Sidebar + create/edit exam  
5. Aplicador  
6. Logins RHF  
7. Layouts RSC + polish  

Cada passo deve deixar o app utilizável em produção local (`npm run dev` + backend `start:dev`).
