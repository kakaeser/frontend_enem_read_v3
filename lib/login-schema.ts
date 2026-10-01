import { z } from "zod"

export const admLoginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  senha: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
})

export type AdmLoginFormValues = z.infer<typeof admLoginSchema>

export const aplicadorLoginSchema = z.object({
  nome: z.string().trim().min(1, { message: "Informe seu nome" }),
  provaId: z.string().min(1, { message: "Selecione a prova" }),
})

export type AplicadorLoginFormValues = z.infer<typeof aplicadorLoginSchema>
