"use client"

import { forwardRef, useImperativeHandle } from "react"
import { useFieldArray, type Control } from "react-hook-form"
import { Accordion } from "@/components/ui/accordion"
import {
  QuestionAccordionItem,
  type QuestionFeedback,
} from "@/components/question-accordion-item"
import type {
  QuestionFormItem,
  QuestionsFormValues,
} from "@/lib/question-schema"

export type QuestionsAccordionListHandle = {
  appendQuestion: (item: QuestionFormItem) => void
}

type Props = {
  control: Control<QuestionsFormValues>
  savingIds: number[]
  savingAll: boolean
  deleting: boolean
  deleteTargetId: number | null
  feedbackById: Record<number, QuestionFeedback>
  onSave: (index: number) => void
  onDelete: (index: number) => void
}

export const QuestionsAccordionList = forwardRef<
  QuestionsAccordionListHandle,
  Props
>(function QuestionsAccordionList(
  {
    control,
    savingIds,
    savingAll,
    deleting,
    deleteTargetId,
    feedbackById,
    onSave,
    onDelete,
  },
  ref
) {
  const { fields, append } = useFieldArray({
    control,
    name: "questions",
    keyName: "fieldKey",
  })

  useImperativeHandle(
    ref,
    () => ({
      appendQuestion: (item) => {
        append(item)
      },
    }),
    [append]
  )

  return (
    <div className="overflow-hidden rounded-lg border border-read-ink bg-read-ink-dark">
      <Accordion>
        {fields.map((field, index) => {
          const questionId = field.id
          return (
            <QuestionAccordionItem
              key={field.fieldKey}
              index={index}
              questionId={questionId}
              control={control}
              saving={savingIds.includes(questionId) || savingAll}
              deletingThis={deleting && deleteTargetId === questionId}
              feedback={feedbackById[questionId] ?? null}
              onSave={onSave}
              onDelete={onDelete}
            />
          )
        })}
      </Accordion>
    </div>
  )
})
