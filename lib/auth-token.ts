export type JwtPayload = {
  exp?: number
  type?: string
  provaId?: number
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split(".")[1])) as JwtPayload
  } catch {
    return null
  }
}

export function isAccessTokenValid(token: string, skewMs = 30_000): boolean {
  const p = decodeJwtPayload(token)
  if (!p) return false
  if (!p.exp) return true
  return p.exp * 1000 > Date.now() - skewMs
}
