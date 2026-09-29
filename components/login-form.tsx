'use client'
import { cn } from "@/lib/utils"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { decodeJwtPayload, isAccessTokenValid } from "@/lib/auth-token"
import { admLoginSchema, type AdmLoginFormValues } from "@/lib/login-schema"
import { useAdmLogin } from "@/hooks/use-adm-login"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const loginMutation = useAdmLogin()

  const form = useForm<AdmLoginFormValues>({
    resolver: zodResolver(admLoginSchema),
    defaultValues: { email: "", senha: "" },
  })

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token || !isAccessTokenValid(token)) return
    const payload = decodeJwtPayload(token)
    if (payload?.type === "aplicador") router.replace("/aguardando")
    else router.replace("/manage")
  }, [router])

  function onSubmit(values: AdmLoginFormValues) {
    form.clearErrors("root")
    loginMutation.mutate(values, {
      onSuccess: () => {
        router.replace("/manage")
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
                <h1 className="text-2xl font-bold text-read-white">ENEM da READ</h1>
                <p className="text-balance text-sm text-read-gray">Entre com seu email e senha de ADM</p>
                <p className="text-balance text-sm text-read-blue">* Login é apenas para os organizadores do evento!</p>
              </div>
              <Field data-invalid={!!form.formState.errors.email}>
                <FieldLabel htmlFor="email" className="text-read-white">
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  className="border-read-ink bg-read-ink text-read-white placeholder:text-read-gray focus-visible:ring-read-green"
                  {...form.register("email")}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>
              <Field data-invalid={!!form.formState.errors.senha}>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password" className="text-read-white">
                    Senha
                  </FieldLabel>
                  <a href="#" className="ml-auto text-sm text-read-blue-light hover:text-read-green underline-offset-2 hover:underline">
                    Esqueceu a senha?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="example"
                  className="border-read-ink bg-read-ink text-read-white placeholder:text-read-gray focus-visible:ring-read-green"
                  {...form.register("senha")}
                />
                <FieldError errors={[form.formState.errors.senha]} />
              </Field>
              {form.formState.errors.root && (
                <p className="text-sm text-red-400">{form.formState.errors.root.message}</p>
              )}
              <Field>
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
                >
                  {loginMutation.isPending ? "Enviando..." : "Entrar"}
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
