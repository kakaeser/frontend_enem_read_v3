"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { hasValidAdmSession, migrateLegacyAdmStorage } from "@/lib/adm-session"
import { usePathname } from "next/navigation"
import { tryRefreshAdmSession } from "@/lib/api"

type Props = {
  children: ReactNode
  /** Redireciona para /login se não houver sessão ADM após tentar refresh. */
  requireAuth?: boolean
  /** Rotas que não exigem sessão ADM (ex.: painel do aplicador). */
  skipAuthPathPrefix?: string
}

export function AdmAuthBootstrap({
  children,
  requireAuth = false,
  skipAuthPathPrefix,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  const skipAuth = Boolean(
    skipAuthPathPrefix && pathname?.startsWith(skipAuthPathPrefix)
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      migrateLegacyAdmStorage()
      if (!hasValidAdmSession()) {
        await tryRefreshAdmSession()
      }
      if (cancelled) return
      if (requireAuth && !skipAuth && !hasValidAdmSession()) {
        router.replace("/login")
        return
      }
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [requireAuth, skipAuth, router])

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-read-darkest">
        <p className="text-sm text-read-gray">Carregando…</p>
      </div>
    )
  }

  return children
}
