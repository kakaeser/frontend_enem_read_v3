"use client"

import { memo } from "react"
import { Check, Trash2 } from "lucide-react"
import {
  useFormContext,
  useWatch,
  type Control,
} from "react-hook-form"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { QuestionsFormValues } from "@/lib/question-schema"

export const LETRAS = ["A", "B", "C", "D"] as const

export type AlternativaDraft = { letra: string; texto: string }

/** @deprecated use QuestionFormItem from lib/question-schema */
export type QuestionDraft = {
  id: number
  numero: number
  enunciado: string
  alternativas: AlternativaDraft[]
  correctAnswer: string
  peso: number
  dirty: boolean
}

export function normalizeAlternativas(
  raw: unknown
): AlternativaDraft[] {
  const list = Array.isArray(raw) ? raw : []
  return LETRAS.map((letra) => {
    const found = list.find(
      (a): a is { letra: string; texto: string } =>
        typeof a === "object" &&
        a !== null &&
        (a as { letra?: unknown }).letra === letra
    )
    return {
      letra,
      texto: typeof found?.texto === "string" ? found.texto : "",
    }
  })
}

export function isIncompleta(
  d: Pick<QuestionDraft, "enunciado" | "correctAnswer">
) {
  return (
    !d.enunciado ||
    !LETRAS.includes(d.correctAnswer as (typeof LETRAS)[number])
  )
}

export type QuestionFeedback = {
  kind: "error" | "success"
  message: string
}

type ItemProps = {
  index: number
  questionId: number
  control: Control<QuestionsFormValues>
  saving: boolean
  deletingThis: boolean
  feedback: QuestionFeedback | null
  onSave: (index: number) => void
  onDelete: (index: number) => void
}

function QuestionAccordionHeader({
  index,
  control,
}: {
  index: number
  control: Control<QuestionsFormValues>
}) {
  const base = `questions.${index}` as const
  const enunciado = useWatch({ control, name: `${base}.enunciado`, defaultValue: "" })
  const correctAnswer = useWatch({
    control,
    name: `${base}.correctAnswer`,
    defaultValue: "",
  })
  const dirty = useWatch({ control, name: `${base}.dirty`, defaultValue: false })
  const numero = useWatch({ control, name: `${base}.numero`, defaultValue: index + 1 })
  const peso = useWatch({ control, name: `${base}.peso`, defaultValue: 1 })

  const incompleta = isIncompleta({
    enunciado: enunciado ?? "",
    correctAnswer: correctAnswer ?? "",
  })

  return (
    <AccordionTrigger className="text-read-white hover:no-underline">
      <span className="flex flex-1 items-center gap-2">
        <span className="w-14 shrink-0 font-semibold tabular-nums">
          Q{numero}
        </span>
        <span className="ml-auto flex items-center gap-2">
          {dirty && (
            <Badge className="border border-read-green bg-transparent text-read-green">
              não salva
            </Badge>
          )}
          {incompleta ? (
            <Badge className="bg-read-blue text-white">incompleta</Badge>
          ) : (
            <Badge className="bg-read-green text-read-logo-dark">
              {correctAnswer}
            </Badge>
          )}
          <Badge className="bg-read-ink text-read-gray">peso {peso}</Badge>
        </span>
      </span>
    </AccordionTrigger>
  )
}

type FormFieldsProps = {
  index: number
  questionId: number
}

function QuestionAccordionFormFieldsInner({
  index,
  questionId,
}: FormFieldsProps) {
  const { register, setValue, getValues } =
    useFormContext<QuestionsFormValues>()
  const base = `questions.${index}` as const

  const correctAnswer = useWatch({
    name: `${base}.correctAnswer`,
    defaultValue: "A",
  })

  function markDirty() {
    if (getValues(`${base}.dirty`)) return
    setValue(`${base}.dirty`, true, { shouldDirty: true })
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`enunciado-${questionId}`}
          className="text-xs font-medium text-read-gray"
        >
          Enunciado
        </label>
        <textarea
          id={`enunciado-${questionId}`}
          rows={4}
          placeholder="Digite o enunciado da questão…"
          className="min-h-24 w-full rounded-lg border border-read-ink bg-read-darkest px-3 py-2 text-sm text-read-white placeholder:text-read-gray/60 focus:border-read-green focus:outline-none"
          {...register(`${base}.enunciado`, {
            onChange: () => markDirty(),
          })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-read-gray">Alternativas</span>
        {LETRAS.map((letra, altIndex) => (
          <div key={letra} className="flex items-center gap-2">
            <span
              className={`w-6 shrink-0 text-center text-sm font-bold ${
                letra === correctAnswer ? "text-read-green" : "text-read-gray"
              }`}
            >
              {letra}
            </span>
            <Input
              placeholder={`Texto da alternativa ${letra}…`}
              className="border-read-ink bg-read-darkest text-sm text-read-white placeholder:text-read-gray/60 focus-visible:border-read-green"
              {...register(`${base}.alternativas.${altIndex}.texto`, {
                onChange: () => markDirty(),
              })}
            />
          </div>
        ))}
      </div>

    </>
  )
}

function QuestionAccordionFormMetaInner({
  index,
  questionId,
}: FormFieldsProps) {
  const { register, setValue, getValues } =
    useFormContext<QuestionsFormValues>()
  const base = `questions.${index}` as const

  function markDirty() {
    if (getValues(`${base}.dirty`)) return
    setValue(`${base}.dirty`, true, { shouldDirty: true })
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`gabarito-${questionId}`}
          className="text-xs font-medium text-read-gray"
        >
          Correta
        </label>
        <select
          id={`gabarito-${questionId}`}
          className="h-8 rounded-lg border border-read-ink bg-read-darkest px-2.5 text-sm text-read-white focus:border-read-green focus:outline-none"
          {...register(`${base}.correctAnswer`, {
            onChange: () => markDirty(),
          })}
        >
          {LETRAS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`peso-${questionId}`}
          className="text-xs font-medium text-read-gray"
        >
          Peso (mín. 1)
        </label>
        <Input
          id={`peso-${questionId}`}
          type="number"
          min={1}
          step={1}
          className="w-24 border-read-ink bg-read-darkest text-sm text-read-white focus-visible:border-read-green"
          {...register(`${base}.peso`, {
            valueAsNumber: true,
            onChange: (e) => {
              const v = parseInt(e.target.value, 10)
              setValue(
                `${base}.peso`,
                Number.isNaN(v) ? 1 : Math.max(1, v),
                { shouldDirty: true }
              )
              markDirty()
            },
          })}
        />
      </div>
    </>
  )
}

const QuestionAccordionFormMeta = memo(
  QuestionAccordionFormMetaInner,
  formFieldsPropsEqual
)

function formFieldsPropsEqual(prev: FormFieldsProps, next: FormFieldsProps) {
  return prev.index === next.index && prev.questionId === next.questionId
}

const QuestionAccordionFormFields = memo(
  QuestionAccordionFormFieldsInner,
  formFieldsPropsEqual
)

function QuestionAccordionFormActions({
  index,
  control,
  saving,
  deletingThis,
  feedback,
  onSave,
  onDelete,
}: {
  index: number
  control: Control<QuestionsFormValues>
  saving: boolean
  deletingThis: boolean
  feedback: QuestionFeedback | null
  onSave: (index: number) => void
  onDelete: (index: number) => void
}) {
  const dirty = useWatch({
    control,
    name: `questions.${index}.dirty`,
    defaultValue: false,
  })
  const numero = useWatch({
    control,
    name: `questions.${index}.numero`,
    defaultValue: index + 1,
  })

  return (
    <div className="ml-auto flex items-center gap-3">
      {feedback && (
        <p
          className={`flex items-center gap-1.5 text-xs ${
            feedback.kind === "error" ? "text-red-400" : "text-read-green"
          }`}
        >
          {feedback.kind === "success" && <Check className="h-3.5 w-3.5" />}
          {feedback.message}
        </p>
      )}
      <Button
        type="button"
        onClick={() => onSave(index)}
        disabled={!dirty || saving || deletingThis}
        className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white disabled:opacity-50"
      >
        {saving ? "Salvando…" : "Salvar questão"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onDelete(index)}
        disabled={saving || deletingThis}
        className="h-8 w-8 shrink-0 text-red-400 hover:bg-read-ink hover:text-red-500 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Excluir questão {numero}</span>
      </Button>
    </div>
  )
}

function QuestionAccordionItemShell({
  index,
  questionId,
  control,
  saving,
  deletingThis,
  feedback,
  onSave,
  onDelete,
}: ItemProps) {
  return (
    <AccordionItem value={`q-${questionId}`} className="px-4">
      <QuestionAccordionHeader index={index} control={control} />
      <AccordionContent className="pb-4">
        <div className="flex flex-col gap-4">
          <QuestionAccordionFormFields index={index} questionId={questionId} />
          <div className="flex flex-wrap items-end gap-3">
            <QuestionAccordionFormMeta index={index} questionId={questionId} />
            <QuestionAccordionFormActions
              index={index}
              control={control}
              saving={saving}
              deletingThis={deletingThis}
              feedback={feedback}
              onSave={onSave}
              onDelete={onDelete}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

function itemPropsEqual(prev: ItemProps, next: ItemProps) {
  return (
    prev.index === next.index &&
    prev.questionId === next.questionId &&
    prev.control === next.control &&
    prev.saving === next.saving &&
    prev.deletingThis === next.deletingThis &&
    prev.feedback === next.feedback &&
    prev.onSave === next.onSave &&
    prev.onDelete === next.onDelete
  )
}

export const QuestionAccordionItem = memo(
  QuestionAccordionItemShell,
  itemPropsEqual
)
