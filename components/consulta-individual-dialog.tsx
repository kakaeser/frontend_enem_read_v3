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
import { useResultadosConsulta } from "@/hooks/use-resultados-consulta"
import {
  resultadosConsultaSchema,
  type ResultadosConsultaFormValues,
} from "@/lib/resultados-consulta-schema"
import type { StudentDetail } from "@/lib/student-detail"

const defaultValues: ResultadosConsultaFormValues = { codigo: "" }

export function ConsultaIndividualDialog({
  examId,
  onSuccess,
}: {
  examId: string
  onSuccess: (detail: StudentDetail) => void
}) {
  const [open, setOpen] = useState(false)
  const consulta = useResultadosConsulta(examId)

  const form = useForm<ResultadosConsultaFormValues>({
    resolver: zodResolver(resultadosConsultaSchema),
    defaultValues,
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      form.reset(defaultValues)
      consulta.reset()
    }
  }

  function onSubmit(values: ResultadosConsultaFormValues) {
    form.clearErrors("root")
    consulta.mutate(values.codigo, {
      onSuccess: (detail) => {
        handleOpenChange(false)
        onSuccess(detail)
      },
      onError: (err) => {
        form.setError("root", {
          message:
            err instanceof Error ? err.message : "Não foi possível consultar.",
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
            size="sm"
            className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
          >
            Consulta individual
          </Button>
        }
      />
      <DialogContent className="bg-read-darkest border-read-ink">
        <DialogHeader>
          <DialogTitle className="text-read-white">Consulta individual</DialogTitle>
          <DialogDescription className="text-read-gray">
            Digite o código de consulta recebido no dia da prova.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.codigo}>
              <FieldLabel htmlFor="consulta-codigo" className="text-read-white">
                Código de consulta
              </FieldLabel>
              <Input
                id="consulta-codigo"
                autoComplete="off"
                placeholder="Ex.: K7M2P9QX"
                className="border-read-ink bg-read-ink-dark font-mono text-read-white uppercase placeholder:normal-case placeholder:text-read-gray/60 focus-visible:ring-read-green"
                {...form.register("codigo")}
              />
              <FieldError errors={[form.formState.errors.codigo]} />
            </Field>
            {form.formState.errors.root && (
              <p className="text-sm text-red-400">
                {form.formState.errors.root.message}
              </p>
            )}
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="border-read-ink bg-transparent text-read-white hover:bg-read-ink"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={consulta.isPending}
              className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
            >
              {consulta.isPending ? "Consultando…" : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
