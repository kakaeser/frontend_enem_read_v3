"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/auth-flow-schema"
import { useInviteAdm, type InviteAdmResponse } from "@/hooks/use-invite-adm"

const defaultValues: ForgotPasswordFormValues = { email: "" }

export function InviteAdmDialog() {
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState<InviteAdmResponse | null>(null)
  const invite = useInviteAdm()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues,
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      form.reset(defaultValues)
      invite.reset()
      setSuccess(null)
    }
  }

  function onSubmit(values: ForgotPasswordFormValues) {
    form.clearErrors("root")
    invite.mutate(values, {
      onSuccess: (data) => {
        setSuccess(data)
      },
      onError: (err) => {
        form.setError("root", {
          message: err instanceof Error ? err.message : "Não foi possível enviar o convite.",
        })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="rounded-full bg-read-green text-read-logo-dark font-semibold hover:border-read-green-dark hover:bg-read-green-dark hover:text-white transition-colors"
          >
            Convidar ADM
          </Button>
        }
      />
      <DialogContent className="bg-read-darkest border-read-ink">
        <DialogHeader>
          <DialogTitle className="text-read-white">Convidar administrador</DialogTitle>
          <DialogDescription className="text-read-gray">
            {success
              ? success.message
              : "Enviamos um e-mail com o link para a pessoa definir a senha e entrar no painel."}
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="space-y-2 text-sm text-read-gray">
            <p>
              Convite enviado para{" "}
              <span className="font-medium text-read-white">{success.email}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.email}>
                <FieldLabel htmlFor="invite-email" className="text-read-white">
                  E-mail
                </FieldLabel>
                <Input
                  id="invite-email"
                  type="email"
                  autoComplete="email"
                  placeholder="novo@email.com"
                  className="border-read-ink bg-read-ink text-read-white placeholder:text-read-gray focus-visible:ring-read-green"
                  {...form.register("email")}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>
              {form.formState.errors.root && (
                <p className="text-sm text-red-400">{form.formState.errors.root.message}</p>
              )}
              <DialogFooter className="border-read-ink bg-transparent pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-read-ink bg-transparent text-read-white hover:bg-read-ink hover:text-read-white transition-colors"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={invite.isPending}
                  className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
                >
                  {invite.isPending ? "Enviando..." : "Enviar convite"}
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        )}
        {success && (
          <DialogFooter className="border-read-ink bg-transparent">
            <Button
              type="button"
              className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
              onClick={() => handleOpenChange(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
