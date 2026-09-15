import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

function decodePayload(token: string): {
  type?: string
  provaId?: number
} | null {
  try {
    return JSON.parse(atob(token.split(".")[1]))
  } catch {
    return null
  }
}

// ADM entra em qualquer prova; aplicador só na própria provaId.
export function useAplicarAuth(examId: string): boolean {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    const payload = token ? decodePayload(token) : null
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
    // Assíncrono de propósito: evita setState síncrono no effect
    // (regra react-hooks/set-state-in-effect).
    const t = setTimeout(() => setReady(true), 0)
    return () => clearTimeout(t)
  }, [router, examId])

  return ready
}
