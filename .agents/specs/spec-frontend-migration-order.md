# Ordem de migração — TanStack Query + Axios + Zod + RHF

**Status: concluída** (refatoração frontend fechada; exceções documentadas em `spec-frontend-libs-refactor.md`).

Passo a passo histórico da migração descrita em `spec-frontend-libs-refactor.md`.  
Cada bloco foi validado manualmente com `npm run dev` + backend `start:dev`.

**Referências**

- Convenções e gotchas: `spec-frontend-libs-refactor.md`
- Inventário HTTP vs TSQ: seção *HTTP vs TanStack Query* em `spec-frontend-libs-refactor.md`
- API / negócio: `../backend_enem_read_v3/.agents/specs/spec-enem-read-v3-mvp.md`
- Piloto público: `hooks/use-exam-results.ts` + `app/resultados/page.tsx`
- Piloto ADM: `hooks/use-exam-participants.ts` + `authAxiosRequest` de `@/lib/api`

---

## Estado final

| Status | Área | Arquivos principais |
|--------|------|---------------------|
| Feito | Fundação Query | `components/providers.tsx`, `app/layout.tsx` |
| Feito | Resultados públicos | `use-exam-results`, `use-exam-ranking` |
| Feito | Participantes ADM + DataTable | `use-exam-participants`, `participantes/columns.tsx` |
| Feito | Questões ADM (RHF + dirty) | `use-exam-questions`, `questoes/page.tsx` |
| Feito | Ranking ADM + status | `use-admin-exam-results`, `use-update-exam-status` |
| Feito | Create / edit prova + sidebar | `use-create-exam`, `use-exam-detail`, `use-aplicadores` |
| Feito | Fluxo aplicador | `use-aplicador-me`, `use-presentes`, `use-participant-answers`, `use-bulk-answers` |
| Feito | Logins RHF | `use-adm-login`, `use-aplicador-login`, `use-in-progress-exams` |
| Feito | HTTP | `lib/api.ts`, `lib/auth-token.ts` |
| Aceito | Layouts título (RSC) | `manage/[examId]/layout.tsx`, `aplicar/[examId]/layout.tsx` — Axios no server, sem TSQ |

**18 hooks** com `useQuery` / `useMutation`. Sem `fetch()` nem `authFetch` em `app/` e `components/`.

---

## Passo 1 — `lib/api.ts` e auth unificada

**Status: feito** (`axiosHttp` + retry 401 em 401).

- [x] `lib/auth-token.ts` — `decodeJwtPayload`, `isAccessTokenValid`
- [ ] *(opcional, não feito)* `axios.create` + interceptors — equivalente funcional hoje

---

## Passo 2 — Lista de provas

**Status: feito** — `use-exams`, `use-create-exam`, invalidação `examsQueryKey`.

---

## Passo 3 — Ranking ADM e status

**Status: feito** — `use-admin-exam-results`, `use-update-exam-status`, `manage/[examId]/page.tsx`.

---

## Passo 4 — Sidebar, criar e editar prova

**Status: feito** — dialogs RHF + `use-aplicadores`; `logoutSession` em sidebar/header.

---

## Passo 5 — Fluxo aplicador

**Status: feito** — `aguardando` + `manage/aplicar/*` (questões reutilizam `use-exam-questions`).

---

## Passo 6 — Logins RHF + participantes DataTable

**Status: feito**.

---

## Passo 7 — Questões ADM + polish

**Status: feito (escopo libs-refactor).**

- [x] Questões: mutations invalidam `exam-questions`, `exam-detail`, `exam-admin-results`
- [x] Critério: sem `authFetch` / `fetch(` manual em `app/` e `components/`
- [x] `header_adm.tsx` / `aplicar-logout-button` — `logoutSession` de `@/lib/api`
- [x] Tabela Progresso em `spec-frontend-libs-refactor.md` atualizada

**Layouts RSC (polish opcional, não bloqueante):**

- [x] Decisão: **manter RSC** + `publicAxiosRequest` para título no header (sem TSQ)
- [ ] *(futuro)* Client + `useExamDetail` se título precisar sincronizar após editar prova sem refresh
- [ ] *(futuro)* `lib/query-keys.ts` — centralizar factories (hoje cada hook exporta sua key)

---

## Ordem resumida (histórico)

1. Infra Axios + token  
2. Lista provas  
3. Ranking ADM + status  
4. Sidebar + create/edit exam  
5. Aplicador  
6. Logins RHF + DataTable participantes  
7. Questões ADM + critérios de fechamento  
