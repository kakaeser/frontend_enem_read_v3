"use client"

import Link from "next/link"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AuthFlowHeader, AuthFlowShell } from "@/components/auth-flow-shell"
import {
  FORGOT_PASSWORD_SUCCESS_MESSAGE,
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/auth-flow-schema"
import { useForgotPassword } from "@/hooks/use-auth-flow"

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)
  const mutation = useForgotPassword()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  function onSubmit(values: ForgotPasswordFormValues) {
    form.clearErrors("root")
    mutation.mutate(values, {
      onSuccess: () => {
        setSubmitted(true)
      },
      onError: (err) => {
        form.setError("root", {
          message: err instanceof Error ? err.message : "Não foi possível enviar o e-mail.",
        })
      },
    })
  }

  return (
    <AuthFlowShell>
      <div className="flex flex-col gap-6">
        <AuthFlowHeader
          title="Esqueci a senha"
          description="Informe o e-mail da sua conta de administrador."
        />
        {submitted ? (
          <p className="text-center text-sm text-read-gray">{FORGOT_PASSWORD_SUCCESS_MESSAGE}</p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.email}>
                <FieldLabel htmlFor="email" className="text-read-white">
                  Email
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  className="border-read-ink bg-read-ink text-read-white placeholder:text-read-gray focus-visible:ring-read-green"
                  {...form.register("email")}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>
              {form.formState.errors.root && (
                <p className="text-sm text-red-400">{form.formState.errors.root.message}</p>
              )}
              <Field>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
                >
                  {mutation.isPending ? "Enviando..." : "Enviar instruções"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        )}
        <p className="text-center text-sm text-read-gray">
          <Link href="/login" className="text-read-blue-light hover:text-read-green hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </AuthFlowShell>
  )
}
