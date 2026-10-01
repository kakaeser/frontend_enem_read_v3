import { z } from "zod"
import { normalizeConsultaCode } from "@/lib/consulta-code"

export const resultadosConsultaSchema = z.object({
  codigo: z
    .string()
    .transform((value) => normalizeConsultaCode(value))
    .pipe(
      z
        .string()
        .min(4, "Informe o código de consulta")
        .max(32)
    ),
})

export type ResultadosConsultaFormValues = z.infer<
  typeof resultadosConsultaSchema
>
