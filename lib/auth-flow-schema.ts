import { z } from "zod"

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const setPasswordSchema = z.object({
  senha: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
})

export type SetPasswordFormValues = z.infer<typeof setPasswordSchema>

export const FORGOT_PASSWORD_SUCCESS_MESSAGE =
  "Se o e-mail existir, enviaremos instruções."
