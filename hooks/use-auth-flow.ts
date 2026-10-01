import { useMutation } from "@tanstack/react-query"
import { publicAxiosRequest } from "@/lib/api"
import type { ForgotPasswordFormValues, SetPasswordFormValues } from "@/lib/auth-flow-schema"

type MessageResponse = { message?: string }

export function useAcceptInvite(token: string) {
  return useMutation({
    mutationFn: (values: SetPasswordFormValues) =>
      publicAxiosRequest<MessageResponse>("POST", "/auth/accept-invite", {
        data: { token, senha: values.senha },
      }),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (values: ForgotPasswordFormValues) =>
      publicAxiosRequest<MessageResponse>("POST", "/auth/forgot-password", {
        data: { email: values.email },
      }),
  })
}

export function useResetPassword(token: string) {
  return useMutation({
    mutationFn: (values: SetPasswordFormValues) =>
      publicAxiosRequest<MessageResponse>("POST", "/auth/reset-password", {
        data: { token, senha: values.senha },
      }),
  })
}
