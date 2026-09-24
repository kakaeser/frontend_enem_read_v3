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
import { useBulkCreateParticipants } from "@/hooks/use-exam-participants"
import {
  addParticipantsFormSchema,
  type AddParticipantsFormValues,
  parseParticipantNamesFromText,
} from "@/lib/participant-schema"

export function AddParticipantsDialog({ examId }: { examId: string }) {
  const [open, setOpen] = useState(false)
  const bulkCreate = useBulkCreateParticipants(examId)

  const form = useForm<AddParticipantsFormValues>({
    resolver: zodResolver(addParticipantsFormSchema),
    defaultValues: { text: "" },
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      form.reset()
      bulkCreate.reset()
    }
  }

  function onSubmit(values: AddParticipantsFormValues) {
    const participants = parseParticipantNamesFromText(values.text)
    bulkCreate.mutate(participants, {
      onSuccess: () => {
        handleOpenChange(false)
      },
      onError: (err) => {
        form.setError("root", {
          message:
            err instanceof Error ? err.message : "Erro ao adicionar participantes.",
        })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white">
            Adicionar
          </Button>
        }
      />
      <DialogContent className="bg-read-darkest border-read-ink">
        <DialogHeader>
          <DialogTitle className="text-read-white">
            Adicionar participantes
          </DialogTitle>
          <DialogDescription className="text-read-gray">
            Um nome por linha. Todos entram como presentes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.text}>
              <FieldLabel htmlFor="nomes" className="text-read-white">
                Nomes
              </FieldLabel>
              <textarea
                id="nomes"
                rows={8}
                placeholder={"Ana Silva\nBruno Souza\nCarla Lima"}
                className="min-h-32 w-full rounded-lg border border-read-ink bg-read-ink-dark px-3 py-2 text-sm text-read-white placeholder:text-read-gray/40 focus:border-read-green focus:outline-none"
                {...form.register("text")}
              />
              <FieldError errors={[form.formState.errors.text]} />
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
              disabled={bulkCreate.isPending}
              className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
            >
              {bulkCreate.isPending ? "Adicionando…" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
