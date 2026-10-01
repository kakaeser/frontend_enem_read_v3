import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { hasValidAdmSession } from "@/lib/adm-session"
import { decodeJwtPayload } from "@/lib/auth-token"
import { getAplicadorAccessToken } from "@/lib/bearer-token"

// ADM entra em qualquer prova; aplicador só na própria provaId.
export function useAplicarAuth(examId: string): boolean {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (hasValidAdmSession()) {
      const t = setTimeout(() => setReady(true), 0)
      return () => clearTimeout(t)
    }

    const token = getAplicadorAccessToken()
    const payload = token ? decodeJwtPayload(token) : null
    if (!token || !payload) {
      router.replace("/login")
      return
    }
    if (
      payload.type === "aplicador" &&
      String(payload.provaId) !== String(examId)
    ) {
      router.replace("/login")
      return
    }
    const t = setTimeout(() => setReady(true), 0)
    return () => clearTimeout(t)
  }, [router, examId])

  return ready
}
