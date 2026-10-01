"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Plus } from "lucide-react"
import { FormProvider, useFieldArray, useForm } from "react-hook-form"
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
  type QuestionFeedback,
} from "@/components/question-accordion-item"
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
  const { fields, append } = useFieldArray({
    control: form.control,
    name: "questions",
    keyName: "fieldKey",
  })

  const [feedback, setFeedback] = useState<Record<number, QuestionFeedback>>({})
  const [savingIds, setSavingIds] = useState<number[]>([])
  const [deleteTarget, setDeleteTarget] = useState<QuestionFormItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const tempId = useRef(-1)
  const hydratedExamId = useRef<string | null>(null)

  const questions = form.watch("questions")
  const dirtyCount = questions.filter((d) => d.dirty).length
  const savingAll = bulkUpsert.isPending && savingIds.length === 0

  useEffect(() => {
    hydratedExamId.current = null
    form.reset({ questions: [] })
    setFeedback({})
  }, [examId, form])

  useEffect(() => {
    if (isLoading || isError || serverQuestions === undefined) return
    if (hydratedExamId.current === examId) return
    hydratedExamId.current = examId
    form.reset({ questions: serverQuestions.map(toFormItem) })
  }, [examId, serverQuestions, isLoading, isError, form])

  function clearFeedback(questionId: number) {
    setFeedback((prev) => {
      if (!prev[questionId]) return prev
      const next = { ...prev }
      delete next[questionId]
      return next
    })
  }

  function applySaved(saved: ExamQuestion[]) {
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
  }

  function addQuestion() {
    const max = questions.reduce((m, d) => Math.max(m, d.numero), 0)
    append({
      id: tempId.current--,
      numero: max + 1,
      enunciado: "",
      alternativas: normalizeAlternativas([]),
      correctAnswer: "A",
      peso: 1,
      dirty: true,
    })
  }

  async function saveOne(index: number) {
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
  }

  async function saveAll() {
    const dirty = questions.filter((d) => d.dirty)
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
    ? questions.reduce((m, d) => Math.max(m, d.numero), 0)
    : 0

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-read-white">Questões</h1>
            {!isLoading && (
              <Badge className="bg-read-ink text-read-gray">
                {questions.length}{" "}
                {questions.length === 1 ? "questão" : "questões"}
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

        {!isLoading && !isError && questions.length === 0 && (
          <p className="text-sm text-read-gray">
            Nenhuma questão cadastrada para esta prova.
          </p>
        )}

        {!isLoading && !isError && questions.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-read-ink bg-read-ink-dark">
            <Accordion>
              {fields.map((field, index) => {
                const q = questions[index]
                if (!q) return null
                return (
                  <QuestionAccordionItem
                    key={field.fieldKey}
                    index={index}
                    saving={savingIds.includes(q.id) || savingAll}
                    deleting={deleting && deleteTarget?.id === q.id}
                    feedback={feedback[q.id] ?? null}
                    onSave={() => saveOne(index)}
                    onDelete={() => setDeleteTarget(q)}
                  />
                )
              })}
            </Accordion>
          </div>
        )}

        {!isLoading && !isError && (
          <Button
            type="button"
            onClick={addQuestion}
            variant="outline"
            className="w-full border-dashed border-read-ink bg-transparent text-read-gray hover:border-read-green hover:bg-transparent hover:text-read-green"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar questão{" "}
            {questions.reduce((m, d) => Math.max(m, d.numero), 0) + 1}
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
