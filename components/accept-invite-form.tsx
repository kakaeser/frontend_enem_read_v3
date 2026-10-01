"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AuthFlowHeader, AuthFlowShell } from "@/components/auth-flow-shell"
import { setPasswordSchema, type SetPasswordFormValues } from "@/lib/auth-flow-schema"
import { useAcceptInvite } from "@/hooks/use-auth-flow"

export function AcceptInviteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")?.trim() ?? ""
  const mutation = useAcceptInvite(token)

  const form = useForm<SetPasswordFormValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { senha: "" },
  })

  function onSubmit(values: SetPasswordFormValues) {
    if (!token) {
      form.setError("root", { message: "Link inválido ou expirado." })
      return
    }
    form.clearErrors("root")
    mutation.mutate(values, {
      onSuccess: () => {
        router.replace("/login")
      },
      onError: (err) => {
        form.setError("root", {
          message: err instanceof Error ? err.message : "Não foi possível aceitar o convite.",
        })
      },
    })
  }

  return (
    <AuthFlowShell>
      <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSubmit)}>
        <AuthFlowHeader
          title="Aceitar convite"
          description="Defina sua senha para acessar o painel de organização."
        />
        <FieldGroup>
          {!token && (
            <p className="text-center text-sm text-red-400">
              Link inválido. Solicite um novo convite ao administrador.
            </p>
          )}
          <Field data-invalid={!!form.formState.errors.senha}>
            <FieldLabel htmlFor="senha" className="text-read-white">
              Nova senha
            </FieldLabel>
            <Input
              id="senha"
              type="password"
              autoComplete="new-password"
              disabled={!token}
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
              disabled={!token || mutation.isPending}
              className="w-full bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
            >
              {mutation.isPending ? "Salvando..." : "Criar conta"}
            </Button>
          </Field>
          <p className="text-center text-sm text-read-gray">
            <Link href="/login" className="text-read-blue-light hover:text-read-green hover:underline">
              Voltar ao login
            </Link>
          </p>
        </FieldGroup>
      </form>
    </AuthFlowShell>
  )
}
