import z from "zod"

// Espelha o DTO do backend (src/exams/questions/dto/bulk-questions.dto.ts):
// só exige o que o backend exige — enunciado vazio continua permitido
// (vira "incompleta", igual aos placeholders criados pelo POST /exams).
export const alternativaSchema = z.object({
  letra: z.enum(["A", "B", "C", "D"], {
    error: "Alternativa deve ser A, B, C ou D.",
  }),
  texto: z.string({ error: "Texto da alternativa inválido." }),
})

export const questionBulkItemSchema = z
  .object({
    id: z.number().int().optional(),
    numero: z
      .number({ error: "Número da questão inválido." })
      .int({ error: "Número da questão inválido." })
      .min(1, { error: "Número da questão deve ser ≥ 1." }),
    enunciado: z.string({ error: "Enunciado inválido." }),
    alternativas: z
      .array(alternativaSchema, { error: "Alternativas inválidas." })
      .min(1, { error: "Informe ao menos uma alternativa." }),
    correctAnswer: z.string({ error: "Escolha a alternativa correta." }),
    peso: z
      .number({ error: "Peso inválido." })
      .int({ error: "Peso deve ser um número inteiro." })
      .min(1, { error: "Peso mínimo é 1." })
      .default(1),
  })
  .refine((q) => q.alternativas.some((a) => a.letra === q.correctAnswer), {
    error: "Alternativa correta deve estar entre as alternativas.",
    path: ["correctAnswer"],
  })

export const questionsBulkSchema = z.object({
  questions: z
    .array(questionBulkItemSchema)
    .min(1, { error: "Nenhuma questão para salvar." }),
})

export type QuestionBulkPayload = z.infer<typeof questionBulkItemSchema>

/** Estado de edição local (RHF) — inclui `id` negativo para rascunhos e flag `dirty`. */
export const questionFormItemSchema = z.object({
  id: z.number().int(),
  numero: z.number().int().min(1),
  enunciado: z.string(),
  alternativas: z.array(
    z.object({
      letra: z.string(),
      texto: z.string(),
    })
  ),
  correctAnswer: z.string(),
  peso: z.number().int().min(1),
  dirty: z.boolean(),
})

export const questionsFormSchema = z.object({
  questions: z.array(questionFormItemSchema),
})

export type QuestionFormItem = z.infer<typeof questionFormItemSchema>
export type QuestionsFormValues = z.infer<typeof questionsFormSchema>

type ValidationOk = { data: QuestionBulkPayload[] }
type ValidationFail = { errors: Map<number, string> }

// Valida os payloads antes do PUT bulk. Erros agrupados por índice do item.
export function validateBulkPayload(items: unknown[]): ValidationOk | ValidationFail {
  const parsed = questionsBulkSchema.safeParse({ questions: items })
  if (parsed.success) return { data: parsed.data.questions }
  const errors = new Map<number, string>()
  for (const issue of parsed.error.issues) {
    const index = typeof issue.path[1] === "number" ? issue.path[1] : -1
    if (!errors.has(index)) errors.set(index, issue.message)
  }
  return { errors }
}
