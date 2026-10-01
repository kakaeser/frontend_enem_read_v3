import { useMutation } from "@tanstack/react-query"
import { axiosHttp } from "@/lib/api"
import type { ForgotPasswordFormValues } from "@/lib/auth-flow-schema"

export type InviteAdmResponse = {
  message: string
  email: string
}

function errorMessageFromBody(data: unknown, status: number): string {
  if (typeof data === "object" && data !== null && "message" in data) {
    const msg = (data as { message: unknown }).message
    if (typeof msg === "string") return msg
    if (Array.isArray(msg)) return msg.join(", ")
  }
  return `HTTP ${status}`
}

export async function inviteAdm(
  payload: ForgotPasswordFormValues
): Promise<InviteAdmResponse> {
  const { data, status } = await axiosHttp<InviteAdmResponse>(
    "POST",
    "/users/invite",
    { data: { email: payload.email } }
  )
  if (status === 409) {
    throw new Error("E-mail já cadastrado")
  }
  if (status < 200 || status >= 300) {
    throw new Error(errorMessageFromBody(data, status))
  }
  return data
}

export function useInviteAdm() {
  return useMutation({ mutationFn: inviteAdm })
}
