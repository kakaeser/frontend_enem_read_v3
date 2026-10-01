"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { hasValidAdmSession } from "@/lib/adm-session"
import {
  clearAplicadorAccessToken,
  getAplicadorAccessToken,
} from "@/lib/bearer-token"
import {
  clearPendingAplicadorSession,
  decodeAplicadorJwtPayload,
  loginAplicadorAndStoreToken,
  useAplicadorApprovalPoll,
  type AplicadorApprovalStatus,
} from "@/hooks/use-aplicador-me"

export default function AguardandoPage() {
  const router = useRouter()
  const [nome, setNome] = useState<string | null>(null)
  const [provaId, setProvaId] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    if (hasValidAdmSession()) {
      router.replace("/manage")
      return
    }
    const token = getAplicadorAccessToken()
    const payload = token ? decodeAplicadorJwtPayload(token) : null
    const params = new URLSearchParams(window.location.search)
    const qNome = params.get("nome")
    const qProva = params.get("provaId")
    const sNome =
      qNome ??
      localStorage.getItem("pending_aplicador_nome") ??
      payload?.nome ??
      null
    const sProva =
      qProva ??
      localStorage.getItem("pending_aplicador_provaId") ??
      (payload?.provaId ? String(payload.provaId) : null)
    setNome(sNome)
    setProvaId(sProva)
    setSessionReady(true)
  }, [router])

  const pollEnabled = sessionReady && Boolean(nome && provaId)
  const { data: polledStatus, isLoading: polling } = useAplicadorApprovalPoll(
    provaId,
    nome,
    pollEnabled
  )

  const status: AplicadorApprovalStatus | null =
    !sessionReady || !pollEnabled
      ? "PENDENTE"
      : polledStatus ?? null

  useEffect(() => {
    if (!provaId || status !== "APROVADO") return
    const token = getAplicadorAccessToken()
    void (async () => {
      if (!token && nome) {
        await loginAplicadorAndStoreToken(nome, Number(provaId))
      } else {
        clearPendingAplicadorSession()
      }
      router.replace(`/manage/aplicar/${provaId}`)
    })()
  }, [status, provaId, nome, router])

  useEffect(() => {
    if (status === "REJEITADO") {
      clearAplicadorAccessToken()
      clearPendingAplicadorSession()
    }
  }, [status])

  if (pollEnabled && polling && status === null) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-read-darkest p-6">
        <p className="text-sm text-read-gray">Verificando status…</p>
      </div>
    )
  }

  if (status === "PENDENTE") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-read-darkest p-6">
        <Card className="w-full max-w-md border-read-dark bg-read-logo-dark">
          <CardHeader className="text-center">
            <CardTitle className="text-read-white">Aguardando aprovação</CardTitle>
            <CardDescription className="text-read-gray">
              Olá {nome ?? "Aplicador"}, seu cadastro está como PENDENTE. O ADM
              precisa aprovar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-read-gray text-center">
              Assim que for APROVADO e a prova estiver em andamento, você será
              liberado para enviar o gabarito.
            </p>
            <Button
              onClick={() => router.push("/login/aplicador")}
              className="border-read-green text-read-green-dark bg-read-green hover:bg-read-green-dark hover:text-white transition-colors"
            >
              Voltar ao login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "REJEITADO") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-read-darkest p-6">
        <Card className="w-full max-w-md border-red-900 bg-red-950/40">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Acesso rejeitado</CardTitle>
            <CardDescription className="text-red-200">
              Seu cadastro foi REJEITADO pelo ADM.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                clearAplicadorAccessToken()
                clearPendingAplicadorSession()
                router.replace("/login/aplicador")
              }}
              className="w-full bg-red-500 text-white hover:bg-red-700"
            >
              Voltar para login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-read-logo-dark p-6">
      <Card className="w-full max-w-md border-read-green bg-read-green/10">
        <CardHeader className="text-center">
          <CardTitle className="text-read-white">Aprovado!</CardTitle>
          <CardDescription className="text-read-white">
            Redirecionando para o painel…
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
