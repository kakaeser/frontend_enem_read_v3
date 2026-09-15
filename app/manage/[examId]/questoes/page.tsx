"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Plus } from "lucide-react"
import { Accordion } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  normalizeAlternativas,
  QuestionAccordionItem,
  type QuestionDraft,
  type QuestionFeedback,
} from "@/components/question-accordion-item"
import { validateBulkPayload } from "@/lib/question-schema"

type Question = {
  id: number
  numero: number
  enunciado: string
  alternativas: unknown
  correctAnswer: string
  peso: number
}

function toDraft(q: Question): QuestionDraft {
  return {
    id: q.id,
    numero: q.numero,
    enunciado: q.enunciado ?? "",
    alternativas: normalizeAlternativas(q.alternativas),
    correctAnswer: q.correctAnswer ?? "",
    peso: q.peso ?? 1,
    dirty: false,
  }
}

function toPayload(d: QuestionDraft) {
  const payload: {
    id?: number
    numero: number
    enunciado: string
    alternativas: QuestionDraft["alternativas"]
    correctAnswer: string
    peso: number
  } = {
    numero: d.numero,
    enunciado: d.enunciado,
    alternativas: d.alternativas,
    correctAnswer: d.correctAnswer,
    peso: Math.max(1, d.peso || 1),
  }
  // Rascunho local (id temporário negativo): sem id → backend cria
  if (d.id >= 0) payload.id = d.id
  return payload
}

export default function QuestoesPage() {
  const { examId } = useParams<{ examId: string }>()
  const [drafts, setDrafts] = useState<QuestionDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<number, QuestionFeedback>>({})
  const [savingIds, setSavingIds] = useState<number[]>([])
  const [savingAll, setSavingAll] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<QuestionDraft | null>(null)
  const [deleting, setDeleting] = useState(false)
  const tempId = useRef(-1)

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"
  const dirtyCount = drafts.filter((d) => d.dirty).length

  async function tryRefresh(): Promise<string | null> {
    const refresh = localStorage.getItem("refresh_token")
    if (!refresh) return null
    try {
      const res = await fetch(`${base}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      })
      if (!res.ok) return null
      const data = await res.json()
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token)
        if (data.refresh_token)
          localStorage.setItem("refresh_token", data.refresh_token)
        return data.access_token
      }
    } catch {}
    return null
  }

  async function authFetch(url: string, init: RequestInit): Promise<Response> {
    let token = localStorage.getItem("access_token")
    let res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (res.status === 401) {
      const newToken = await tryRefresh()
      if (newToken) {
        token = newToken
        res = await fetch(url, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
      }
    }
    return res
  }

  async function requestQuestions(signal?: AbortSignal): Promise<Question[]> {
    const res = await fetch(`${base}/exams/${examId}/questions`, {
      cache: "no-store",
      signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return Array.isArray(data) ? data : []
  }

  useEffect(() => {
    const controller = new AbortController()
    async function initialLoad() {
      try {
        const data = await requestQuestions(controller.signal)
        setDrafts(data.map(toDraft))
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return
        setError("Não foi possível carregar as questões.")
      } finally {
        setLoading(false)
      }
    }
    void initialLoad()
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, examId])

  function patchDraft(id: number, patch: Partial<QuestionDraft>) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, ...patch, dirty: true } : d
      )
    )
    setFeedback((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function applySaved(saved: Question[]) {
    const byId = new Map(saved.map((q) => [q.id, q]))
    const used = new Set<number>()
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id >= 0) {
          const s = byId.get(d.id)
          if (s) {
            used.add(s.id)
            return { ...toDraft(s), dirty: false }
          }
          return d
        }
        // Rascunho local: casa pelo numero (único) entre os ainda não usados
        const s = saved.find((q) => q.numero === d.numero && !used.has(q.id))
        if (s) {
          used.add(s.id)
          return { ...toDraft(s), dirty: false }
        }
        return d
      })
    )
  }

  function addQuestion() {
    const max = drafts.reduce((m, d) => Math.max(m, d.numero), 0)
    const draft: QuestionDraft = {
      id: tempId.current--,
      numero: max + 1,
      enunciado: "",
      alternativas: normalizeAlternativas([]),
      correctAnswer: "A",
      peso: 1,
      dirty: true,
    }
    setDrafts((prev) => [...prev, draft])
  }

  async function saveOne(draft: QuestionDraft) {
    setSavingIds((prev) => [...prev, draft.id])
    setFeedback((prev) => {
      if (!prev[draft.id]) return prev
      const next = { ...prev }
      delete next[draft.id]
      return next
    })
    const validated = validateBulkPayload([toPayload(draft)])
    if ("errors" in validated) {
      setFeedback((prev) => ({
        ...prev,
        [draft.id]: {
          kind: "error",
          message: validated.errors.get(0) ?? "Dados da questão inválidos.",
        },
      }))
      setSavingIds((prev) => prev.filter((id) => id !== draft.id))
      return
    }
    try {
      const res = await authFetch(`${base}/exams/${examId}/questions/bulk`, {
        method: "PUT",
        body: JSON.stringify({ questions: validated.data }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? `HTTP ${res.status}`)
      }
      const saved: Question[] = await res.json()
      applySaved(saved)
      setFeedback((prev) => ({
        ...prev,
        ...Object.fromEntries(
          saved.map((q) => [
            q.id,
            { kind: "success", message: "Questão salva com sucesso." } as QuestionFeedback,
          ])
        ),
      }))
    } catch (e) {
      setFeedback((prev) => ({
        ...prev,
        [draft.id]: {
          kind: "error",
          message:
            e instanceof Error
              ? `Erro ao salvar: ${e.message}`
              : "Erro ao salvar a questão.",
        },
      }))
    } finally {
      setSavingIds((prev) => prev.filter((id) => id !== draft.id))
    }
  }

  async function saveAll() {
    const dirty = drafts.filter((d) => d.dirty)
    if (dirty.length === 0) return
    setSavingAll(true)
    const validated = validateBulkPayload(dirty.map(toPayload))
    if ("errors" in validated) {
      const entries: [number, QuestionFeedback][] = []
      validated.errors.forEach((message, i) => {
        const d = dirty[i]
        if (d) entries.push([d.id, { kind: "error", message }])
      })
      setFeedback((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
      setSavingAll(false)
      return
    }
    try {
      const res = await authFetch(`${base}/exams/${examId}/questions/bulk`, {
        method: "PUT",
        body: JSON.stringify({ questions: validated.data }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? `HTTP ${res.status}`)
      }
      const saved: Question[] = await res.json()
      applySaved(saved)
      setFeedback((prev) => ({
        ...prev,
        ...Object.fromEntries(
          saved.map((q) => [
            q.id,
            { kind: "success", message: "Questão salva com sucesso." } as QuestionFeedback,
          ])
        ),
      }))
    } catch (e) {
      const message =
        e instanceof Error
          ? `Erro ao salvar todas: ${e.message}`
          : "Erro ao salvar todas as questões."
      setFeedback((prev) => ({
        ...prev,
        ...Object.fromEntries(
          dirty.map((d) => [d.id, { kind: "error", message } as QuestionFeedback])
        ),
      }))
    } finally {
      setSavingAll(false)
    }
  }

  async function confirmDelete() {
    const target = deleteTarget
    if (!target) return
    setDeleting(true)
    try {
      // Rascunho local: só sai do estado, sem backend
      if (target.id < 0) {
        setDrafts((prev) =>
          prev
            .filter((d) => d.id !== target.id)
            .map((d) =>
              d.numero > target.numero
                ? { ...d, numero: d.numero - 1, dirty: true }
                : d
            )
        )
        setDeleteTarget(null)
        return
      }
      const res = await authFetch(
        `${base}/exams/${examId}/questions/${target.id}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? `HTTP ${res.status}`)
      }
      // Renumera as maiores localmente (dirty) e persiste via bulk.
      // Ordem crescente: cada numero destino já está livre (delete primeiro,
      // cada update libera o seu), sem conflito no unique [examId, numero].
      const renumbered = drafts
        .filter((d) => d.id >= 0 && d.numero > target.numero)
        .map((d) => ({ ...d, numero: d.numero - 1, dirty: true }))
        .sort((a, b) => a.numero - b.numero)
      setDrafts((prev) =>
        prev
          .filter((d) => d.id !== target.id)
          .map((d) =>
            d.numero > target.numero
              ? { ...d, numero: d.numero - 1, dirty: true }
              : d
          )
      )
      setFeedback((prev) => {
        if (!prev[target.id]) return prev
        const next = { ...prev }
        delete next[target.id]
        return next
      })
      setDeleteTarget(null)
      if (renumbered.length > 0) {
        const resBulk = await authFetch(
          `${base}/exams/${examId}/questions/bulk`,
          {
            method: "PUT",
            body: JSON.stringify({ questions: renumbered.map(toPayload) }),
          }
        )
        if (!resBulk.ok) {
          const body = await resBulk.json().catch(() => null)
          throw new Error(body?.message ?? `HTTP ${resBulk.status}`)
        }
        applySaved(await resBulk.json())
      }
    } catch (e) {
      setFeedback((prev) => ({
        ...prev,
        [target.id]: {
          kind: "error",
          message:
            e instanceof Error
              ? `Erro ao excluir: ${e.message}`
              : "Erro ao excluir a questão.",
        },
      }))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const deleteMax = deleteTarget
    ? drafts.reduce((m, d) => Math.max(m, d.numero), 0)
    : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-read-white">Questões</h1>
          {!loading && (
            <Badge className="bg-read-ink text-read-gray">
              {drafts.length} {drafts.length === 1 ? "questão" : "questões"}
            </Badge>
          )}
          {dirtyCount > 0 && (
            <Badge className="border border-read-green bg-transparent text-read-green">
              {dirtyCount} não {dirtyCount === 1 ? "salva" : "salvas"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={saveAll}
            disabled={dirtyCount === 0 || savingAll}
            className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white disabled:opacity-50"
          >
            {savingAll ? "Salvando…" : "Salvar todas"}
          </Button>
        </div>
      </div>

      {loading && <p className="text-sm text-read-gray">Carregando questões…</p>}

      {!loading && error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && drafts.length === 0 && (
        <p className="text-sm text-read-gray">
          Nenhuma questão cadastrada para esta prova.
        </p>
      )}

      {!loading && !error && drafts.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-read-ink bg-read-ink-dark">
          <Accordion>
            {drafts.map((d) => (
              <QuestionAccordionItem
                key={d.id}
                draft={d}
                saving={savingIds.includes(d.id) || savingAll}
                deleting={deleting && deleteTarget?.id === d.id}
                feedback={feedback[d.id] ?? null}
                onPatch={(patch) => patchDraft(d.id, patch)}
                onSave={() => saveOne(d)}
                onDelete={() => setDeleteTarget(d)}
              />
            ))}
          </Accordion>
        </div>
      )}

      {!loading && !error && (
        <Button
          onClick={addQuestion}
          variant="outline"
          className="w-full border-dashed border-read-ink bg-transparent text-read-gray hover:border-read-green hover:bg-transparent hover:text-read-green"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar questão{" "}
          {drafts.reduce((m, d) => Math.max(m, d.numero), 0) + 1}
        </Button>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null)
        }}
      >
        <DialogContent className="bg-read-ink-dark border-read-ink text-read-white">
          <DialogHeader>
            <DialogTitle className="text-read-white">
              Excluir questão {deleteTarget?.numero}?
            </DialogTitle>
            <DialogDescription className="text-read-gray">
              A questão será removida permanentemente
              {deleteTarget && deleteTarget.id >= 0 && (
                <>
                  , junto com as respostas já lançadas para ela
                </>
              )}
              .{" "}
              {deleteTarget && deleteMax > deleteTarget.numero && (
                <>
                  As questões {deleteTarget.numero + 1}–{deleteMax} serão
                  renumeradas automaticamente.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-read-ink bg-transparent">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="text-read-gray hover:bg-read-ink hover:text-read-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-500 text-white hover:bg-red-700"
            >
              {deleting ? "Excluindo…" : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
