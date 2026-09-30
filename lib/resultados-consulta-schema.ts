import { z } from "zod"

export const resultadosConsultaSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(4, "Informe o código de consulta")
    .max(32),
})

export type ResultadosConsultaFormValues = z.infer<
  typeof resultadosConsultaSchema
>
