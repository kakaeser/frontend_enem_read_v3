"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Status = "PENDENTE" | "APROVADO" | "REJEITADO"

function decodePayload(token: string): { type?: string; provaId?: number; nome?: string } | null {
  try {
    return JSON.parse(atob(token.split(".")[1]))
  } catch {
    return null
  }
}

export default function AguardandoPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status | null>(null)
  const [nome, setNome] = useState<string | null>(null)
  const [provaId, setProvaId] = useState<string | null>(null)

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    const payload = token ? decodePayload(token) : null
    if (payload?.type === "adm") {
      router.replace("/manage")
      return
    }
    const params = new URLSearchParams(window.location.search)
    const qNome = params.get("nome")
    const qProva = params.get("provaId")
    const sNome = qNome ?? localStorage.getItem("pending_aplicador_nome") ?? payload?.nome ?? null
    const sProva = qProva ?? localStorage.getItem("pending_aplicador_provaId") ?? (payload?.provaId ? String(payload.provaId) : null)
    setNome(sNome)
    setProvaId(sProva)
    if (!sNome || !sProva) {
      setStatus("PENDENTE")
      return
    }

    let interval: ReturnType<typeof setInterval> | null = null

    async function pollWithToken() {
      const token = localStorage.getItem("access_token")
      if (!token) return null
      try {
        const res = await fetch(`${base}/aplicadores/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
        if (!res.ok) throw new Error()
        const data: { status: Status } = await res.json()
        return data.status
      } catch {
        return null
      }
    }

    async function pollPublic() {
      try {
        const res = await fetch(`${base}/aplicadores?provaId=${sProva}`, { cache: "no-store" })
        if (!res.ok) throw new Error()
        const list: { nome: string; status: Status }[] = await res.json()
        const found = list.find((a) => a.nome === sNome)
        return found?.status ?? null
      } catch {
        return null
      }
    }

    async function poll() {
      const token = localStorage.getItem("access_token")
      let currentStatus: Status | null = null
      if (token) {
        const payload = decodePayload(token)
        // Se tem token, tenta o endpoint preciso primeiro
        const meStatus = await pollWithToken()
        if (meStatus) currentStatus = meStatus
        else if (payload?.type === "aplicador") {
          // Fallback para público se /me falhar
          currentStatus = await pollPublic()
        }
      } else {
        currentStatus = await pollPublic()
      }
      if (!currentStatus) return
      if (currentStatus !== status) setStatus(currentStatus)
      else if (!status) setStatus(currentStatus)

      if (currentStatus === "APROVADO") {
        if (!token) {
          const loginRes = await fetch(`${base}/auth/aplicador`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: sNome, provaId: Number(sProva) }),
          })
          if (loginRes.ok) {
            const data = await loginRes.json()
            if (data.access_token) {
              localStorage.setItem("access_token", data.access_token)
              localStorage.removeItem("pending_aplicador_nome")
              localStorage.removeItem("pending_aplicador_provaId")
            }
          }
        } else {
          localStorage.removeItem("pending_aplicador_nome")
          localStorage.removeItem("pending_aplicador_provaId")
        }
        if (interval) clearInterval(interval)
        router.replace("/manage")
      } else if (currentStatus === "REJEITADO") {
        if (interval) clearInterval(interval)
        localStorage.removeItem("pending_aplicador_nome")
        localStorage.removeItem("pending_aplicador_provaId")
      }
    }

    poll()
    // Só polla enquanto PENDENTE
    interval = setInterval(() => {
      // @ts-ignore status captured, check current
      // Só continua se ainda pendente
      // @ts-ignore
      if (status !== "PENDENTE" && status !== null) {
        if (interval) clearInterval(interval)
        return
      }
      poll()
    }, 5000)
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [router, base, status])

  if (status === "PENDENTE") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-read-darkest p-6">
        <Card className="w-full max-w-md border-read-dark bg-read-logo-dark">
          <CardHeader className="text-center">
            <CardTitle className="text-read-white">Aguardando aprovação</CardTitle>
            <CardDescription className="text-read-gray">Olá {nome ?? "Aplicador"}, seu cadastro está como PENDENTE. O ADM precisa aprovar.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-read-gray text-center">Assim que for APROVADO e a prova estiver em andamento, você será liberado para enviar o gabarito.</p>
            <Button  onClick={() => router.push("/login/aplicador")} className="border-read-green text-read-green-dark bg-read-green hover:bg-read-green-dark hover:text-white transition-colors">
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
            <CardDescription className="text-red-200">Seu cadastro foi REJEITADO pelo ADM.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                localStorage.removeItem("access_token")
                localStorage.removeItem("refresh_token")
                localStorage.removeItem("pending_aplicador_nome")
                localStorage.removeItem("pending_aplicador_provaId")
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

  // APROVADO
  return (
    <div className="flex min-h-svh items-center justify-center bg-read-logo-dark p-6">
      <Card className="w-full max-w-md border-read-green bg-read-green/10">
        <CardHeader className="text-center">
          <CardTitle className="text-read-white">Aprovado!</CardTitle>
          <CardDescription className="text-read-white">Você já pode acessar o painel.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/manage")} className="w-full bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white">
            Ir para o painel
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
