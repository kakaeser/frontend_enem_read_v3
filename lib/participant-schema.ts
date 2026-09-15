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
