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

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      router.replace("/login")
      return
    }
    const payload = decodePayload(token)
    if (payload?.type === "adm") {
      router.replace("/manage")
      return
    }
    // TODO: buscar status real via GET /aplicadores/me quando backend expor
    // Por enquanto decodifica do token se vier, senão assume PENDENTE
    setNome(payload?.nome ?? null)
    setStatus("PENDENTE")

    // Polling simples a cada 10s para quando ADM aprovar
    const id = setInterval(() => {
      // fetch status -> se APROVADO, router.replace("/manage") ou libera gabarito
    }, 10000)
    return () => clearInterval(id)
  }, [router])

  if (status === "PENDENTE") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-read-logo-dark p-6">
        <Card className="w-full max-w-md border-read-dark bg-read-dark/40">
          <CardHeader className="text-center">
            <CardTitle className="text-read-white">Aguardando aprovação</CardTitle>
            <CardDescription className="text-read-gray">Olá {nome ?? "Aplicador"}, seu cadastro está como PENDENTE. O ADM precisa aprovar.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-read-gray text-center">Assim que for APROVADO e a prova estiver em andamento, você será liberado para enviar o gabarito.</p>
            <Button variant="outline" onClick={() => router.push("/login")} className="border-read-green text-read-green">
              Voltar ao login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "REJEITADO") {
    return (
      <div className="flex min-h-svh items-center justify-center bg-read-logo-dark p-6">
        <Card className="w-full max-w-md border-red-900 bg-red-950/40">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Acesso rejeitado</CardTitle>
            <CardDescription className="text-red-200">Seu cadastro foi REJEITADO pelo ADM.</CardDescription>
          </CardHeader>
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
