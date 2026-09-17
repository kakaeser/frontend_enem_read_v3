import z from "zod"

// Espelha UpdateExamDto (parcial): nome min 3, notaSimbolica int ≥ 1.
export const examSchema = z.object({
  nome: z
    .string({ error: "Nome inválido." })
    .trim()
    .min(3, { error: "Nome deve ter ao menos 3 caracteres." }),
  notaSimbolica: z
    .number({ error: "Nota simbólica inválida." })
    .int({ error: "Nota simbólica deve ser um número inteiro." })
    .min(1, { error: "Nota simbólica deve ser ≥ 1." }),
})

export type ExamPayload = z.infer<typeof examSchema>
