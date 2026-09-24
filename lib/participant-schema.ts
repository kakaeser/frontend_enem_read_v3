import z from "zod"

// Espelha CreateParticipantDto (nome min 2). Usado para validar cada linha
// do dialog de adição antes do POST bulk.
export const participantSchema = z.object({
  nome: z
    .string({ error: "Nome inválido." })
    .trim()
    .min(2, { error: "Nome deve ter ao menos 2 caracteres." }),
  presenca: z.boolean().optional(),
})

export type ParticipantPayload = z.infer<typeof participantSchema>

export const addParticipantsFormSchema = z.object({
  text: z.string(),
}).superRefine((data, ctx) => {
  const names = data.text
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean)
  if (names.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Digite ao menos um nome (um por linha).",
      path: ["text"],
    })
    return
  }
  const invalid = names.filter(
    (n) => !participantSchema.safeParse({ nome: n }).success
  )
  if (invalid.length > 0) {
    ctx.addIssue({
      code: "custom",
      message: `Nomes com menos de 2 caracteres: ${invalid.slice(0, 3).join(", ")}${
        invalid.length > 3 ? ` (+${invalid.length - 3})` : ""
      }`,
      path: ["text"],
    })
  }
})

export type AddParticipantsFormValues = z.infer<typeof addParticipantsFormSchema>

export function parseParticipantNamesFromText(text: string): ParticipantPayload[] {
  return text
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean)
    .map((nome) => ({ nome }))
}
