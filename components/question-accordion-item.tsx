"use client"

import { Check, Trash2 } from "lucide-react"
import { useFormContext } from "react-hook-form"
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

type Props = {
  index: number
  saving: boolean
  deleting: boolean
  feedback?: QuestionFeedback | null
  onSave: () => void
  onDelete: () => void
}

export function QuestionAccordionItem({
  index,
  saving,
  deleting,
  feedback,
  onSave,
  onDelete,
}: Props) {
  const { register, setValue, watch } = useFormContext<QuestionsFormValues>()
  const draft = watch(`questions.${index}`)
  if (!draft) return null

  const incompleta = isIncompleta(draft)
  const base = `questions.${index}` as const

  function markDirty() {
    setValue(`${base}.dirty`, true, { shouldDirty: true })
  }

  function setAlternativaTexto(altIndex: number, texto: string) {
    setValue(`${base}.alternativas.${altIndex}.texto`, texto, {
      shouldDirty: true,
    })
    markDirty()
  }

  return (
    <AccordionItem value={`q-${draft.id}`} className="px-4">
      <AccordionTrigger className="text-read-white hover:no-underline">
        <span className="flex flex-1 items-center gap-2">
          <span className="w-14 shrink-0 font-semibold tabular-nums">
            Q{draft.numero}
          </span>
          <span className="ml-auto flex items-center gap-2">
            {draft.dirty && (
              <Badge className="border border-read-green bg-transparent text-read-green">
                não salva
              </Badge>
            )}
            {incompleta ? (
              <Badge className="bg-read-blue text-white">incompleta</Badge>
            ) : (
              <Badge className="bg-read-green text-read-logo-dark">
                {draft.correctAnswer}
              </Badge>
            )}
            <Badge className="bg-read-ink text-read-gray">
              peso {draft.peso}
            </Badge>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`enunciado-${draft.id}`}
              className="text-xs font-medium text-read-gray"
            >
              Enunciado
            </label>
            <textarea
              id={`enunciado-${draft.id}`}
              rows={4}
              placeholder="Digite o enunciado da questão…"
              className="min-h-24 w-full rounded-lg border border-read-ink bg-read-darkest px-3 py-2 text-sm text-read-white placeholder:text-read-gray/60 focus:border-read-green focus:outline-none"
              {...register(`${base}.enunciado`, {
                onChange: () => markDirty(),
              })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-read-gray">
              Alternativas
            </span>
            {draft.alternativas.map((a, altIndex) => (
              <div key={a.letra} className="flex items-center gap-2">
                <span
                  className={`w-6 shrink-0 text-center text-sm font-bold ${
                    a.letra === draft.correctAnswer
                      ? "text-read-green"
                      : "text-read-gray"
                  }`}
                >
                  {a.letra}
                </span>
                <Input
                  value={a.texto}
                  onChange={(e) => setAlternativaTexto(altIndex, e.target.value)}
                  placeholder={`Texto da alternativa ${a.letra}…`}
                  className="border-read-ink bg-read-darkest text-sm text-read-white placeholder:text-read-gray/60 focus-visible:border-read-green"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`gabarito-${draft.id}`}
                className="text-xs font-medium text-read-gray"
              >
                Correta
              </label>
              <select
                id={`gabarito-${draft.id}`}
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
                htmlFor={`peso-${draft.id}`}
                className="text-xs font-medium text-read-gray"
              >
                Peso (mín. 1)
              </label>
              <Input
                id={`peso-${draft.id}`}
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
            <div className="ml-auto flex items-center gap-3">
              {feedback && (
                <p
                  className={`flex items-center gap-1.5 text-xs ${
                    feedback.kind === "error" ? "text-red-400" : "text-read-green"
                  }`}
                >
                  {feedback.kind === "success" && (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {feedback.message}
                </p>
              )}
              <Button
                type="button"
                onClick={onSave}
                disabled={!draft.dirty || saving || deleting}
                className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white disabled:opacity-50"
              >
                {saving ? "Salvando…" : "Salvar questão"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDelete}
                disabled={saving || deleting}
                className="h-8 w-8 shrink-0 text-red-400 hover:bg-read-ink hover:text-red-500 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Excluir questão {draft.numero}</span>
              </Button>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
