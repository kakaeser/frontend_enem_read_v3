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
import { useCreateExam } from "@/hooks/use-create-exam"
import {
  createExamSchema,
  type CreateExamFormValues,
} from "@/lib/exam-schema"

const defaultValues: CreateExamFormValues = {
  nome: "",
  qtdQuestoes: 70,
  notaSimbolica: 1000,
}

export function CreateExamDialog() {
  const [open, setOpen] = useState(false)
  const createExam = useCreateExam()

  const form = useForm<CreateExamFormValues>({
    resolver: zodResolver(createExamSchema),
    defaultValues,
  })

  const qtdQuestoes = form.watch("qtdQuestoes")

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      form.reset(defaultValues)
      createExam.reset()
    }
  }

  function onSubmit(values: CreateExamFormValues) {
    createExam.mutate(values, {
      onSuccess: () => handleOpenChange(false),
      onError: (err) => {
        form.setError("root", {
          message: err instanceof Error ? err.message : "Erro ao criar prova.",
        })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white">
            Criar prova
          </Button>
        }
      />
      <DialogContent className="bg-read-darkest border-read-ink">
        <DialogHeader>
          <DialogTitle className="text-read-white">Nova prova</DialogTitle>
          <DialogDescription className="text-read-gray">
            Cria a prova e gera {qtdQuestoes || 70} questões vazias.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.nome}>
              <FieldLabel htmlFor="nome" className="text-read-white">
                Nome
              </FieldLabel>
              <Input
                id="nome"
                placeholder="ex: ENEM 2025"
                className="border-read-ink bg-read-ink-dark text-read-white placeholder:text-read-gray/10 focus-visible:ring-read-green"
                {...form.register("nome")}
              />
              <FieldError errors={[form.formState.errors.nome]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.qtdQuestoes}>
              <FieldLabel htmlFor="qtd" className="text-read-white">
                Qtd. questões
              </FieldLabel>
              <Input
                id="qtd"
                type="number"
                min={1}
                className="border-read-ink bg-read-ink-dark text-read-white focus-visible:ring-read-green"
                {...form.register("qtdQuestoes", { valueAsNumber: true })}
              />
              <FieldError errors={[form.formState.errors.qtdQuestoes]} />
            </Field>
            <Field data-invalid={!!form.formState.errors.notaSimbolica}>
              <FieldLabel htmlFor="nota" className="text-read-white">
                Nota simbólica
              </FieldLabel>
              <Input
                id="nota"
                type="number"
                min={1}
                className="border-read-ink bg-read-ink-dark text-read-white focus-visible:ring-read-green"
                {...form.register("notaSimbolica", { valueAsNumber: true })}
              />
              <FieldError errors={[form.formState.errors.notaSimbolica]} />
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
              className="border-read-ink bg-transparent text-read-white hover:bg-read-ink hover:text-read-white transition-colors"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createExam.isPending}
              className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
            >
              {createExam.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
