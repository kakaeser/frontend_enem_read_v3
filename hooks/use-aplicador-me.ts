import { useQuery } from "@tanstack/react-query"
import { authAxiosRequest, axiosHttp, publicAxiosRequest } from "@/lib/api"

export type AplicadorApprovalStatus = "PENDENTE" | "APROVADO" | "REJEITADO"

export function decodeAplicadorJwtPayload(
  token: string
): { type?: string; provaId?: number; nome?: string } | null {
  try {
    return JSON.parse(atob(token.split(".")[1]))
  } catch {
    return null
  }
}

export async function getAplicadorMeStatus(
  signal?: AbortSignal
): Promise<AplicadorApprovalStatus | null> {
  try {
    const data = await authAxiosRequest<{ status: AplicadorApprovalStatus }>(
      "GET",
      "/aplicadores/me",
      { signal }
    )
    return data.status
  } catch {
    return null
  }
}

export async function getAplicadorStatusPublic(
  provaId: string,
  nome: string,
  signal?: AbortSignal
): Promise<AplicadorApprovalStatus | null> {
  try {
    const list = await publicAxiosRequest<
      { nome: string; status: AplicadorApprovalStatus }[]
    >("GET", `/aplicadores?provaId=${provaId}`, { signal })
    return list.find((a) => a.nome === nome)?.status ?? null
  } catch {
    return null
  }
}

export async function resolveAplicadorApprovalStatus(
  provaId: string,
  nome: string,
  signal?: AbortSignal
): Promise<AplicadorApprovalStatus | null> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  if (token) {
    const payload = decodeAplicadorJwtPayload(token)
    const meStatus = await getAplicadorMeStatus(signal)
    if (meStatus) return meStatus
    if (payload?.type === "aplicador") {
      return getAplicadorStatusPublic(provaId, nome, signal)
    }
  }
  return getAplicadorStatusPublic(provaId, nome, signal)
}

export function aplicadorApprovalQueryKey(provaId: string, nome: string) {
  return ["aplicador-approval", provaId, nome] as const
}

export function useAplicadorApprovalPoll(
  provaId: string | null,
  nome: string | null,
  enabled: boolean
) {
  return useQuery<AplicadorApprovalStatus | null, Error>({
    queryKey: aplicadorApprovalQueryKey(provaId ?? "", nome ?? ""),
    queryFn: ({ signal }) =>
      resolveAplicadorApprovalStatus(provaId!, nome!, signal),
    enabled: enabled && Boolean(provaId && nome),
    refetchInterval: (query) => {
      const status = query.state.data
      if (status === "APROVADO" || status === "REJEITADO") return false
      return 5000
    },
  })
}

export async function loginAplicadorAndStoreToken(
  nome: string,
  provaId: number
): Promise<boolean> {
  const { data, status } = await axiosHttp<{ access_token?: string }>(
    "POST",
    "/auth/aplicador",
    { data: { nome, provaId } }
  )
  if (status >= 200 && status < 300 && data.access_token) {
    localStorage.setItem("access_token", data.access_token)
    localStorage.removeItem("pending_aplicador_nome")
    localStorage.removeItem("pending_aplicador_provaId")
    return true
  }
  return false
}

export function clearPendingAplicadorSession() {
  localStorage.removeItem("pending_aplicador_nome")
  localStorage.removeItem("pending_aplicador_provaId")
}
