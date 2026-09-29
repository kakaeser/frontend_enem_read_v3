"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { decodeJwtPayload, isAccessTokenValid } from "@/lib/auth-token"
import {
  aplicadorLoginSchema,
  type AplicadorLoginFormValues,
} from "@/lib/login-schema"
import { useInProgressExams } from "@/hooks/use-in-progress-exams"
import { useAplicadorLogin } from "@/hooks/use-aplicador-login"

export function AplicadorLoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const { data: exams = [], isLoading: examsLoading, isError: examsError } =
    useInProgressExams()
  const loginMutation = useAplicadorLogin()

  const form = useForm<AplicadorLoginFormValues>({
    resolver: zodResolver(aplicadorLoginSchema),
    defaultValues: { nome: "", provaId: "" },
  })

  const noExams = !examsLoading && exams.length === 0

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token || !isAccessTokenValid(token)) return
    const payload = decodeJwtPayload(token)
    if (payload?.type === "adm") router.replace("/manage")
    else router.replace("/aguardando")
  }, [router])

  function onSubmit(values: AplicadorLoginFormValues) {
    form.clearErrors("root")
    loginMutation.mutate(values, {
      onSuccess: (result) => {
        if (result.kind === "pending") {
          router.replace(
            `/aguardando?nome=${encodeURIComponent(result.nome)}&provaId=${result.provaId}`
          )
          return
        }
        router.replace("/aguardando")
      },
      onError: (err) => {
        form.setError("root", {
          message: err instanceof Error ? err.message : "Erro",
        })
      },
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-read-dark bg-read-dark/40 backdrop-blur">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8 bg-read-logo-dark" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold text-read-white">Aplicador</h1>
                <p className="text-balance text-sm text-read-gray">Só o nome. Se já existe na prova, loga direto. Senão cria como PENDENTE.</p>
              </div>
              {examsLoading && (
                <p className="text-sm text-read-gray">Carregando provas…</p>
              )}
              {examsError && (
                <p className="text-sm text-red-400">Não foi possível carregar as provas.</p>
              )}
              {noExams && (
                <p className="text-sm text-read-gray">
                  Nenhuma prova em andamento — peça ao ADM para criar e colocar em andamento.
                </p>
              )}
              <Field data-invalid={!!form.formState.errors.nome}>
                <FieldLabel htmlFor="nome" className="text-read-white">
                  Nome
                </FieldLabel>
                <Input
                  id="nome"
                  placeholder="Seu nome"
                  disabled={noExams || examsLoading}
                  className="border-read-ink bg-read-ink text-read-white placeholder:text-read-gray focus-visible:ring-read-green disabled:opacity-50"
                  {...form.register("nome")}
                />
                <FieldError errors={[form.formState.errors.nome]} />
              </Field>
              <Field data-invalid={!!form.formState.errors.provaId}>
                <FieldLabel htmlFor="provaId" className="text-read-white">
                  Prova
                </FieldLabel>
                <select
                  id="provaId"
                  disabled={noExams || examsLoading}
                  className="flex h-9 w-full rounded-md border border-read-ink bg-read-ink px-3 py-1 text-sm text-read-white focus-visible:ring-1 focus-visible:ring-read-green disabled:opacity-50"
                  {...form.register("provaId")}
                >
                  <option value="">Selecione a prova</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={String(ex.id)}>
                      {ex.nome}
                    </option>
                  ))}
                </select>
                <FieldError errors={[form.formState.errors.provaId]} />
              </Field>
              {form.formState.errors.root && (
                <p className="text-sm text-red-400">{form.formState.errors.root.message}</p>
              )}
              <Field>
                <Button
                  type="submit"
                  disabled={loginMutation.isPending || noExams || examsLoading}
                  className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white disabled:opacity-50"
                >
                  {loginMutation.isPending ? "Enviando..." : "Continuar"}
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
