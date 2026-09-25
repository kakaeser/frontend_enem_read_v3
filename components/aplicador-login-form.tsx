"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { axiosHttp, publicAxiosRequest } from "@/lib/api"

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

  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token || !isTokenValid(token)) return
    const payload = decodePayload(token)
    if (payload?.type === "adm") router.replace("/manage")
    else router.replace("/aguardando")
  }, [router])

  useEffect(() => {
    publicAxiosRequest<Exam[]>("GET", "/exams?status=in_progress")
      .then((d) => setExams(Array.isArray(d) ? d : []))
      .catch(() => setExams([]))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!nome.trim() || !provaId) {
      setMsg({ type: "error", text: "Informe nome e prova." })
      return
    }
    setLoading(true)
    try {
      const res = await axiosHttp<{ access_token?: string; refresh_token?: string; message?: string }>(
        "POST",
        "/auth/aplicador",
        {
          data: { nome: nome.trim(), provaId: Number(provaId) },
        }
      )
      if (res.status === 404) {
        const c = await axiosHttp("POST", "/aplicadores", {
          data: { nome: nome.trim(), provaId: Number(provaId) },
        })
        if (c.status < 200 || c.status >= 300) {
          throw new Error("Erro ao solicitar acesso")
        }
        localStorage.setItem("pending_aplicador_nome", nome.trim())
        localStorage.setItem("pending_aplicador_provaId", String(provaId))
        router.replace(`/aguardando?nome=${encodeURIComponent(nome.trim())}&provaId=${provaId}`)
        return
      }
      if (res.status < 200 || res.status >= 300) {
        const msgText =
          typeof res.data === "object" &&
          res.data !== null &&
          "message" in res.data &&
          typeof (res.data as { message: unknown }).message === "string"
            ? (res.data as { message: string }).message
            : ""
        if (msgText.includes("PENDENTE")) {
          localStorage.setItem("pending_aplicador_nome", nome.trim())
          localStorage.setItem("pending_aplicador_provaId", String(provaId))
          router.replace(`/aguardando?nome=${encodeURIComponent(nome.trim())}&provaId=${provaId}`)
          return
        }
        throw new Error(msgText || "Acesso pendente ou rejeitado.")
      }
      const { access_token, refresh_token } = res.data
      if (!access_token) throw new Error("Resposta de login inválida.")
      localStorage.setItem("access_token", access_token)
      if (refresh_token) localStorage.setItem("refresh_token", refresh_token)
      localStorage.removeItem("pending_aplicador_nome")
      localStorage.removeItem("pending_aplicador_provaId")
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
              {exams.length === 0 && <p className="text-sm text-read-gray">Nenhuma prova em andamento — peça ao ADM para criar e colocar em andamento.</p>}
              <Field>
                <FieldLabel htmlFor="nome" className="text-read-white">
                  Nome
                </FieldLabel>
                <Input id="nome" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required disabled={exams.length === 0} className="border-read-ink bg-read-ink text-read-white placeholder:text-read-gray focus-visible:ring-read-green disabled:opacity-50" />
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
                  disabled={exams.length === 0}
                  className="flex h-9 w-full rounded-md border border-read-ink bg-read-ink px-3 py-1 text-sm text-read-white focus-visible:ring-1 focus-visible:ring-read-green disabled:opacity-50"
                >
                  <option value="">Selecione a prova</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={String(ex.id)}>
                      {ex.nome}
                    </option>
                  ))}
                </select>
              </Field>
              {msg && <p className={`text-sm ${msg.type === "error" ? "text-red-400" : "text-read-green"}`}>{msg.text}</p>}
              <Field>
                <Button type="submit" disabled={loading || exams.length === 0} className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white disabled:opacity-50">
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
      <FieldDescription className="px-6 text-center text-read-gray">
        Ao continuar, você concorda com os{" "}
        <Link href="/termos" className="underline text-read-blue-light hover:text-read-green">
          Termos
        </Link>{" "}
        e{" "}
        <Link href="/privacidade" className="underline text-read-blue-light hover:text-read-green">
          Privacidade
        </Link>
        .
      </FieldDescription>
    </div>
  )
}
