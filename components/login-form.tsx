'use client'
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import z from "zod"

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

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const loginSchema = z.object({
    email: z.string().email({ message: "Email inválido" }),
    senha: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
  })
  const [email, setEmail] = useState<string>("")
  const [senha, setSenha] = useState<string>("")
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null)
  const [loading, setLoading] = useState<boolean>(false)


  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token || !isTokenValid(token)) return
    const payload = decodePayload(token)
    if (payload?.type === "aplicador") router.replace("login/aplicador/aguardando")
    else router.replace("/manage")
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const result = loginSchema.safeParse({ email, senha })
    if (!result.success) {
      setMsg({ type: "error", text: result.error.message })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${base}/auth/login`,{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.message ?? "Erro ao logar.")
      }
      const { access_token, refresh_token } = await res.json()
      localStorage.setItem("access_token", access_token)
      if (refresh_token) localStorage.setItem("refresh_token", refresh_token)
      setMsg({ type: "success", text: "Logado!" })
      router.replace("/manage")
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Erro" })
    } finally{
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
                <h1 className="text-2xl font-bold text-read-white">ENEM da READ</h1>
                <p className="text-balance text-sm text-read-gray">Entre com seu email e senha de ADM</p>
              </div>
              <Field>
                <FieldLabel htmlFor="email" className="text-read-white">
                  Email
                </FieldLabel>
                <Input id="email" type="email" placeholder="adm@read.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="border-read-ink bg-read-ink text-read-white placeholder:text-read-gray focus-visible:ring-read-green" />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password" className="text-read-white">
                    Senha
                  </FieldLabel>
                  <a href="#" className="ml-auto text-sm text-read-blue-light hover:text-read-green underline-offset-2 hover:underline">
                    Esqueceu a senha?
                  </a>
                </div>
                <Input id="password" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="border-read-ink bg-read-ink text-read-white placeholder:text-read-gray focus-visible:ring-read-green" />
              </Field>
              {msg && <p className={`text-sm ${msg.type === "error" ? "text-red-400" : "text-read-green"}`}>{msg.text}</p>}
              <Field>
                <Button type="submit" disabled={loading} className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white">
                  {loading ? "Enviando..." : "Entrar"}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-read-logo-dark text-read-gray">ou continue com</FieldSeparator>
              <Field>
                <a href="/login/aplicador" className="inline-flex h-8 items-center justify-center rounded-lg border border-read-green bg-transparent px-2.5 text-sm font-medium text-read-green hover:bg-read-green hover:text-read-logo-dark">
                  Entrar como Aplicador
                </a>
              </Field>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-read-blue md:block">
            <img src="/logo.png" alt="ENEM da READ" className="absolute inset-0 h-full w-full object-contain p-8" />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-read-gray">
        Ao continuar, você concorda com os <a href="#" className="underline text-read-blue-light">Termos</a> e <a href="#" className="underline text-read-blue-light">Privacidade</a>.
      </FieldDescription>
    </div>
  )
}
