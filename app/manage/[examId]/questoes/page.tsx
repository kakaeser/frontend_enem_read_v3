"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Plus } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"
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
  type QuestionFeedback,
} from "@/components/question-accordion-item"
import {
  QuestionsAccordionList,
  type QuestionsAccordionListHandle,
} from "@/components/questions-accordion-list"
import {
  useBulkUpsertExamQuestions,
  useDeleteExamQuestion,
  useExamQuestions,
  type ExamQuestion,
} from "@/hooks/use-exam-questions"
import {
  type QuestionBulkPayload,
  type QuestionFormItem,
  type QuestionsFormValues,
  validateBulkPayload,
} from "@/lib/question-schema"

function toFormItem(q: ExamQuestion): QuestionFormItem {
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

function toPayload(d: QuestionFormItem): QuestionBulkPayload {
  const payload: QuestionBulkPayload = {
    numero: d.numero,
    enunciado: d.enunciado,
    alternativas: d.alternativas as QuestionBulkPayload["alternativas"],
    correctAnswer: d.correctAnswer,
    peso: Math.max(1, d.peso || 1),
  }
  if (d.id >= 0) payload.id = d.id
  return payload
}

function countDirtyQuestions(questions: QuestionFormItem[]) {
  return questions.filter((d) => d.dirty).length
}

function shouldRecountDirtyOnFieldChange(name: string | undefined) {
  if (!name) return false
  if (name === "questions") return true
  if (name.endsWith(".dirty")) return true
  if (name.endsWith(".id") || name.endsWith(".numero")) return true
  return false
}

export default function QuestoesPage() {
  const { examId } = useParams<{ examId: string }>()
  const {
    data: serverQuestions,
    isLoading,
    isError,
  } = useExamQuestions(examId)
  const bulkUpsert = useBulkUpsertExamQuestions(examId)
  const deleteQuestion = useDeleteExamQuestion(examId)

  const form = useForm<QuestionsFormValues>({
    defaultValues: { questions: [] },
  })

  const listRef = useRef<QuestionsAccordionListHandle>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [feedback, setFeedback] = useState<Record<number, QuestionFeedback>>({})
  const [savingIds, setSavingIds] = useState<number[]>([])
  const [deleteTarget, setDeleteTarget] = useState<QuestionFormItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [dirtyCount, setDirtyCount] = useState(0)
  const tempId = useRef(-1)
  const hydratedExamId = useRef<string | null>(null)

  const savingAll = bulkUpsert.isPending && savingIds.length === 0

  const syncDirtyCount = useCallback(() => {
    const next = countDirtyQuestions(form.getValues("questions"))
    setDirtyCount((prev) => (prev === next ? prev : next))
  }, [form])

  const syncQuestionCount = useCallback(() => {
    setQuestionCount(form.getValues("questions").length)
  }, [form])

  useEffect(() => {
    hydratedExamId.current = null
    form.reset({ questions: [] })
    setFeedback({})
    setDirtyCount(0)
    setQuestionCount(0)
  }, [examId, form])

  useEffect(() => {
    if (isLoading || isError || serverQuestions === undefined) return
    if (hydratedExamId.current === examId) return
    hydratedExamId.current = examId
    form.reset({ questions: serverQuestions.map(toFormItem) })
    setDirtyCount(0)
    setQuestionCount(serverQuestions.length)
  }, [examId, serverQuestions, isLoading, isError, form])

  useEffect(() => {
    const subscription = form.watch((_value, { name }) => {
      if (shouldRecountDirtyOnFieldChange(name)) {
        syncDirtyCount()
      }
      if (
        name === "questions" ||
        name?.endsWith(".id") ||
        name?.endsWith(".numero")
      ) {
        syncQuestionCount()
      }
    })
    return () => subscription.unsubscribe()
  }, [form, syncDirtyCount, syncQuestionCount])

  function clearFeedback(questionId: number) {
    setFeedback((prev) => {
      if (!prev[questionId]) return prev
      const next = { ...prev }
      delete next[questionId]
      return next
    })
  }

  const applySaved = useCallback(
    (saved: ExamQuestion[]) => {
      const prev = form.getValues("questions")
      const byId = new Map(saved.map((q) => [q.id, q]))
      const used = new Set<number>()
      const updated = prev.map((d) => {
        if (d.id >= 0) {
          const s = byId.get(d.id)
          if (s) {
            used.add(s.id)
            return { ...toFormItem(s), dirty: false }
          }
          return d
        }
        const s = saved.find((q) => q.numero === d.numero && !used.has(q.id))
        if (s) {
          used.add(s.id)
          return { ...toFormItem(s), dirty: false }
        }
        return d
      })
      form.setValue("questions", updated, { shouldDirty: false })
    },
    [form]
  )

  function addQuestion() {
    const questions = form.getValues("questions")
    const max = questions.reduce((m, d) => Math.max(m, d.numero), 0)
    listRef.current?.appendQuestion({
      id: tempId.current--,
      numero: max + 1,
      enunciado: "",
      alternativas: normalizeAlternativas([]),
      correctAnswer: "A",
      peso: 1,
      dirty: true,
    })
    setQuestionCount(questions.length + 1)
  }

  const saveOne = useCallback(
    async (index: number) => {
      const draft = form.getValues(`questions.${index}`)
      if (!draft) return
      setSavingIds((prev) => [...prev, draft.id])
      clearFeedback(draft.id)
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
        const saved = await bulkUpsert.mutateAsync(validated.data)
        applySaved(saved)
        setFeedback((prev) => ({
          ...prev,
          ...Object.fromEntries(
            saved.map((q) => [
              q.id,
              {
                kind: "success",
                message: "Questão salva com sucesso.",
              } as QuestionFeedback,
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
    },
    [applySaved, bulkUpsert, form]
  )

  async function saveAll() {
    const dirty = form.getValues("questions").filter((d) => d.dirty)
    if (dirty.length === 0) return
    const validated = validateBulkPayload(dirty.map(toPayload))
    if ("errors" in validated) {
      const entries: [number, QuestionFeedback][] = []
      validated.errors.forEach((message, i) => {
        const d = dirty[i]
        if (d) entries.push([d.id, { kind: "error", message }])
      })
      setFeedback((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
      return
    }
    try {
      const saved = await bulkUpsert.mutateAsync(validated.data)
      applySaved(saved)
      setFeedback((prev) => ({
        ...prev,
        ...Object.fromEntries(
          saved.map((q) => [
            q.id,
            {
              kind: "success",
              message: "Questão salva com sucesso.",
            } as QuestionFeedback,
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
    }
  }

  const requestDelete = useCallback(
    (index: number) => {
      const item = form.getValues(`questions.${index}`)
      if (item) setDeleteTarget(item)
    },
    [form]
  )

  async function confirmDelete() {
    const target = deleteTarget
    if (!target) return
    setDeleting(true)
    const current = form.getValues("questions")
    try {
      if (target.id < 0) {
        form.setValue(
          "questions",
          current
            .filter((d) => d.id !== target.id)
            .map((d) =>
              d.numero > target.numero
                ? { ...d, numero: d.numero - 1, dirty: true }
                : d
            ),
          { shouldDirty: true }
        )
        setDeleteTarget(null)
        return
      }
      await deleteQuestion.mutateAsync(target.id)
      const renumbered = current
        .filter((d) => d.id >= 0 && d.numero > target.numero)
        .map((d) => ({ ...d, numero: d.numero - 1, dirty: true }))
        .sort((a, b) => a.numero - b.numero)
      form.setValue(
        "questions",
        current
          .filter((d) => d.id !== target.id)
          .map((d) =>
            d.numero > target.numero
              ? { ...d, numero: d.numero - 1, dirty: true }
              : d
          ),
        { shouldDirty: true }
      )
      clearFeedback(target.id)
      setDeleteTarget(null)
      if (renumbered.length > 0) {
        const saved = await bulkUpsert.mutateAsync(renumbered.map(toPayload))
        applySaved(saved)
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
    ? form
        .getValues("questions")
        .reduce((m, d) => Math.max(m, d.numero), 0)
    : 0

  const nextQuestionNumero =
    questionCount === 0
      ? 1
      : form.getValues("questions").reduce((m, d) => Math.max(m, d.numero), 0) +
        1

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-read-white">Questões</h1>
            {!isLoading && (
              <Badge className="bg-read-ink text-read-gray">
                {questionCount}{" "}
                {questionCount === 1 ? "questão" : "questões"}
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
              type="button"
              onClick={saveAll}
              disabled={dirtyCount === 0 || bulkUpsert.isPending}
              className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white disabled:opacity-50"
            >
              {savingAll ? "Salvando…" : "Salvar todas"}
            </Button>
          </div>
        </div>

        {isLoading && (
          <p className="text-sm text-read-gray">Carregando questões…</p>
        )}

        {isError && (
          <p className="text-sm text-red-400">
            Não foi possível carregar as questões.
          </p>
        )}

        {!isLoading && !isError && questionCount === 0 && (
          <p className="text-sm text-read-gray">
            Nenhuma questão cadastrada para esta prova.
          </p>
        )}

        {!isLoading && !isError && questionCount > 0 && (
          <QuestionsAccordionList
            ref={listRef}
            control={form.control}
            savingIds={savingIds}
            savingAll={savingAll}
            deleting={deleting}
            deleteTargetId={deleteTarget?.id ?? null}
            feedbackById={feedback}
            onSave={saveOne}
            onDelete={requestDelete}
          />
        )}

        {!isLoading && !isError && (
          <Button
            type="button"
            onClick={addQuestion}
            variant="outline"
            className="w-full border-dashed border-read-ink bg-transparent text-read-gray hover:border-read-green hover:bg-transparent hover:text-read-green"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar questão {nextQuestionNumero}
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
                  <>, junto com as respostas já lançadas para ela</>
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
    </FormProvider>
  )
}
