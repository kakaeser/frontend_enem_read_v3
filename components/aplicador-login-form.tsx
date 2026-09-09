"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

function decodePayload(token: string): { exp?: number; type?: string } | null {
  try {
    return JSON.parse(atob(token.split(".")[1]))
  } catch {
    return null
  }
}
function isTokenValid(token: string): boolean {
  const p = decodePayload(token)
  if (!p?.exp) return !!p
  return p.exp * 1000 > Date.now()
}

type Exam = { id: number; nome: string; status: string }

export function AplicadorLoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [nome, setNome] = useState<string>("")
  const [provaId, setProvaId] = useState<string>("")
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null)

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token || !isTokenValid(token)) return
    const payload = decodePayload(token)
    if (payload?.type === "adm") router.replace("/manage")
    else router.replace("login/aplicador/aguardando")
  }, [router])

  useEffect(() => {
    fetch(`${base}/exams`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setExams(Array.isArray(d) ? d : []))
      .catch(() => setExams([]))
  }, [base])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!nome.trim() || !provaId) {
      setMsg({ type: "error", text: "Informe nome e prova." })
      return
    }
    setLoading(true)
    try {
      let res = await fetch(`${base}/auth/aplicador`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), provaId: Number(provaId) }),
      })
      if (res.status === 404) {
        const c = await fetch(`${base}/aplicadores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome: nome.trim(), provaId: Number(provaId) }),
        })
        if (!c.ok) throw new Error("Erro ao solicitar acesso")
        setMsg({ type: "success", text: "Solicitação enviada! Aguarde aprovação do ADM (PENDENTE)." })
        return
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.message ?? "Acesso pendente ou rejeitado.")
      }
      const { access_token, refresh_token } = await res.json()
      localStorage.setItem("access_token", access_token)
      if (refresh_token) localStorage.setItem("refresh_token", refresh_token)
      setMsg({ type: "success", text: "Logado!" })
      router.replace("/aguardando")
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-read-dark bg-read-dark/40 backdrop-blur">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8 bg-read-logo-dark" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold text-read-white">Aplicador</h1>
                <p className="text-balance text-sm text-read-gray">Só o nome. Se já existe na prova, loga direto. Senão cria como PENDENTE.</p>
              </div>
              {exams.length === 0 && <p className="text-sm text-read-gray">Nenhuma prova cadastrada ainda.</p>}
              <Field>
                <FieldLabel htmlFor="nome" className="text-read-white">
                  Nome
                </FieldLabel>
                <Input id="nome" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required className="border-read-ink bg-read-ink text-read-white placeholder:text-read-gray focus-visible:ring-read-green" />
              </Field>
              <Field>
                <FieldLabel htmlFor="provaId" className="text-read-white">
                  Prova
                </FieldLabel>
                <select
                  id="provaId"
                  value={provaId}
                  onChange={(e) => setProvaId(e.target.value)}
                  required
                  className="flex h-9 w-full rounded-md border border-read-ink bg-read-ink px-3 py-1 text-sm text-read-white focus-visible:ring-1 focus-visible:ring-read-green"
                >
                  <option value="">Selecione a prova</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={String(ex.id)}>
                      {ex.nome} ({ex.status})
                    </option>
                  ))}
                </select>
              </Field>
              {msg && <p className={`text-sm ${msg.type === "error" ? "text-red-400" : "text-read-green"}`}>{msg.text}</p>}
              <Field>
                <Button type="submit" disabled={loading} className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white">
                  {loading ? "Enviando..." : "Continuar"}
                </Button>
              </Field>
              <FieldDescription className="text-center text-read-gray">
                <a href="/login" className="underline text-read-green">
                  Voltar para ADM
                </a>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-read-blue md:block">
            <img src="/logo.png" alt="ENEM da READ" className="absolute inset-0 h-full w-full object-contain p-8" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
