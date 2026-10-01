import {
  clearAdmAccessToken,
  getAdmAccessToken,
  hasValidAdmSession,
} from "@/lib/adm-session"
import { decodeJwtPayload, isAccessTokenValid } from "@/lib/auth-token"

const APLICADOR_STORAGE_KEY = "access_token"

export function getAplicadorAccessToken(): string | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem(APLICADOR_STORAGE_KEY)
  if (!token) return null
  const payload = decodeJwtPayload(token)
  if (payload?.type !== "aplicador") return null
  if (!isAccessTokenValid(token)) return null
  return token
}

export function setAplicadorAccessToken(token: string): void {
  if (typeof window === "undefined") return
  clearAdmAccessToken()
  localStorage.setItem(APLICADOR_STORAGE_KEY, token)
}

export function clearAplicadorAccessToken(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(APLICADOR_STORAGE_KEY)
}

/** Bearer para chamadas autenticadas: ADM (memória) tem prioridade sobre aplicador. */
export function getBearerToken(): string | null {
  if (hasValidAdmSession()) return getAdmAccessToken()
  return getAplicadorAccessToken()
}

export function isAplicadorBearer(token: string | null): boolean {
  if (!token) return false
  return decodeJwtPayload(token)?.type === "aplicador"
}
