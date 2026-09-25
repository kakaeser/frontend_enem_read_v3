"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil } from "lucide-react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  examDetailCounts,
  useDeleteExam,
  useExamDetail,
  useUpdateExam,
} from "@/hooks/use-exam-detail"
import { examSchema, type ExamPayload } from "@/lib/exam-schema"

export function EditExamDialog({
  examId,
  onSaved,
}: {
  examId: string
  onSaved?: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data, isLoading: loadingData, isError: loadError } = useExamDetail(
    examId,
    open
  )
  const updateExam = useUpdateExam(examId)
  const deleteExam = useDeleteExam(examId)

  const form = useForm<ExamPayload>({
    resolver: zodResolver(examSchema),
    defaultValues: { nome: "", notaSimbolica: 1000 },
  })

  useEffect(() => {
    if (!data) return
    form.reset({
      nome: data.nome ?? "",
      notaSimbolica: data.notaSimbolica ?? 1000,
    })
  }, [data, form])

  const counts = examDetailCounts(data)
  const nome = form.watch("nome")

  function openDialog() {
    form.clearErrors()
    setConfirmDelete(false)
    setOpen(true)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setConfirmDelete(false)
      updateExam.reset()
      deleteExam.reset()
    }
  }

  function onSubmit(values: ExamPayload) {
    updateExam.mutate(values, {
      onSuccess: () => {
        handleOpenChange(false)
        onSaved?.()
      },
      onError: (err) => {
        form.setError("root", {
          message: err instanceof Error ? err.message : "Erro ao salvar.",
        })
      },
    })
  }

  function handleDelete() {
    deleteExam.mutate(undefined, {
      onSuccess: () => router.push("/manage"),
      onError: (err) => {
        form.setError("root", {
          message: err instanceof Error ? err.message : "Erro ao excluir.",
        })
        setConfirmDelete(false)
      },
    })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={openDialog}
        className="text-read-gray hover:bg-read-ink hover:text-read-green"
      >
        <Pencil className="mr-1 h-4 w-4" />
        Editar
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-read-darkest border-read-ink">
          <DialogHeader>
            <DialogTitle className="text-read-white">Editar prova</DialogTitle>
            <DialogDescription className="text-read-gray">
              Mudar a nota simbólica recalcula todos os totais na hora.
            </DialogDescription>
          </DialogHeader>
          {loadingData ? (
            <p className="text-sm text-read-gray">Carregando dados…</p>
          ) : loadError ? (
            <p className="text-sm text-red-400">
              Não foi possível carregar os dados da prova.
            </p>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field data-invalid={!!form.formState.errors.nome}>
                  <FieldLabel htmlFor="exam-nome" className="text-read-white">
                    Nome
                  </FieldLabel>
                  <Input
                    id="exam-nome"
                    className="border-read-ink bg-read-ink-dark text-read-white placeholder:text-read-gray/40 focus-visible:ring-read-green"
                    {...form.register("nome")}
                  />
                  <FieldError errors={[form.formState.errors.nome]} />
                </Field>
                <Field data-invalid={!!form.formState.errors.notaSimbolica}>
                  <FieldLabel htmlFor="exam-nota" className="text-read-white">
                    Nota simbólica
                  </FieldLabel>
                  <Input
                    id="exam-nota"
                    type="number"
                    min={1}
                    step={1}
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
              <DialogFooter className="mt-6 gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmDelete(true)}
                  className="mr-auto text-red-400 hover:bg-read-ink hover:text-red-500"
                >
                  Excluir prova
                </Button>
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
                  disabled={updateExam.isPending}
                  className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
                >
                  {updateExam.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="bg-read-ink-dark border-read-ink text-read-white">
          <DialogHeader>
            <DialogTitle className="text-read-white">
              Excluir “{nome || "esta prova"}”?
            </DialogTitle>
            <DialogDescription className="text-read-gray">
              Isso apaga a prova inteira
              {counts
                ? ` (${counts.questions} questões, ${counts.participants} participantes, todas as respostas)`
                : ""}
              . Não tem volta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-read-ink bg-transparent">
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              disabled={deleteExam.isPending}
              className="text-read-gray hover:bg-read-ink hover:text-read-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteExam.isPending}
              className="bg-red-500 text-white hover:bg-red-700"
            >
              {deleteExam.isPending ? "Excluindo…" : "Excluir tudo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
