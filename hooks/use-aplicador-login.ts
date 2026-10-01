import { useMutation } from "@tanstack/react-query"
import { setAplicadorAccessToken } from "@/lib/bearer-token"
import { axiosHttp } from "@/lib/api"
import type { AplicadorLoginFormValues } from "@/lib/login-schema"

export type AplicadorLoginResult =
  | { kind: "authenticated" }
  | { kind: "pending"; nome: string; provaId: string }

async function aplicadorLogin(
  values: AplicadorLoginFormValues
): Promise<AplicadorLoginResult> {
  const nome = values.nome.trim()
  const provaId = values.provaId

  const res = await axiosHttp<{ access_token?: string; message?: string }>(
    "POST",
    "/auth/aplicador",
    {
      data: { nome, provaId: Number(provaId) },
      auth: false,
    }
  )

  if (res.status === 404) {
    const c = await axiosHttp("POST", "/aplicadores", {
      data: { nome, provaId: Number(provaId) },
      auth: false,
    })
    if (c.status < 200 || c.status >= 300) {
      throw new Error("Erro ao solicitar acesso")
    }
    localStorage.setItem("pending_aplicador_nome", nome)
    localStorage.setItem("pending_aplicador_provaId", provaId)
    return { kind: "pending", nome, provaId }
  }

  if (res.status < 200 || res.status >= 300) {
    const msgText =
      typeof res.data === "object" &&
      res.data !== null &&
      "message" in res.data &&
      typeof (res.data as { message: unknown }).message === "string"
        ? (res.data as { message: string }).message
        : ""
    if (msgText.includes("PENDENTE")) {
      localStorage.setItem("pending_aplicador_nome", nome)
      localStorage.setItem("pending_aplicador_provaId", provaId)
      return { kind: "pending", nome, provaId }
    }
    throw new Error(msgText || "Acesso pendente ou rejeitado.")
  }

  const { access_token } = res.data
  if (!access_token) throw new Error("Resposta de login inválida.")
  setAplicadorAccessToken(access_token)
  localStorage.removeItem("pending_aplicador_nome")
  localStorage.removeItem("pending_aplicador_provaId")
  return { kind: "authenticated" }
}

export function useAplicadorLogin() {
  return useMutation({
    mutationFn: aplicadorLogin,
  })
}
