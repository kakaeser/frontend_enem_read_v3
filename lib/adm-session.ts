import { decodeJwtPayload, isAccessTokenValid } from "@/lib/auth-token"

let admAccessToken: string | null = null

export function getAdmAccessToken(): string | null {
  return admAccessToken
}

export function setAdmAccessToken(token: string | null): void {
  admAccessToken = token
}

export function clearAdmAccessToken(): void {
  admAccessToken = null
}

export function hasValidAdmSession(): boolean {
  if (!admAccessToken) return false
  const payload = decodeJwtPayload(admAccessToken)
  if (payload?.type !== "adm") return false
  return isAccessTokenValid(admAccessToken)
}

/** Remove ADM tokens legados do localStorage (pré cookie HttpOnly). */
export function migrateLegacyAdmStorage(): void {
  if (typeof window === "undefined") return
  const stored = localStorage.getItem("access_token")
  if (!stored) {
    localStorage.removeItem("refresh_token")
    return
  }
  const payload = decodeJwtPayload(stored)
  if (payload?.type === "adm") {
    localStorage.removeItem("access_token")
  }
  localStorage.removeItem("refresh_token")
}
