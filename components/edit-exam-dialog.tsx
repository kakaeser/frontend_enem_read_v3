"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authAxiosRequest } from "@/lib/api"
import { examSchema } from "@/lib/exam-schema"

type ExamDetailResponse = {
  nome?: string
  notaSimbolica?: number
  questions?: unknown[]
  _count?: { questions?: number; participants?: number }
}

export function EditExamDialog({
  examId,
  onSaved,
}: {
  examId: string
  onSaved?: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState("")
  const [nota, setNota] = useState(1000)
  const [counts, setCounts] = useState<{
    questions: number
    participants: number
  } | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    async function load() {
      setLoadingData(true)
      setError(null)
      try {
        const data = await authAxiosRequest<ExamDetailResponse>(
          "GET",
          `/exams/${examId}`,
          { signal: controller.signal }
        )
        setNome(data.nome ?? "")
        setNota(data.notaSimbolica ?? 1000)
        setCounts({
          questions: Array.isArray(data.questions)
            ? data.questions.length
            : (data._count?.questions ?? 0),
          participants: data._count?.participants ?? 0,
        })
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return
        setError("Não foi possível carregar os dados da prova.")
      } finally {
        setLoadingData(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [open, examId])

  function openDialog() {
    setError(null)
    setConfirmDelete(false)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const parsed = examSchema.safeParse({ nome: nome.trim(), notaSimbolica: nota })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.")
      return
    }
    setLoading(true)
    try {
      await authAxiosRequest("PATCH", `/exams/${examId}`, {
        data: parsed.data,
      })
      setOpen(false)
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await authAxiosRequest("DELETE", `/exams/${examId}`)
      router.push("/manage")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro")
    } finally {
      setDeleting(false)
    }
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-read-darkest border-read-ink">
          <DialogHeader>
            <DialogTitle className="text-read-white">Editar prova</DialogTitle>
            <DialogDescription className="text-read-gray">
              Mudar a nota simbólica recalcula todos os totais na hora.
            </DialogDescription>
          </DialogHeader>
          {loadingData ? (
            <p className="text-sm text-read-gray">Carregando dados…</p>
          ) : (
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="exam-nome" className="text-read-white">
                  Nome
                </FieldLabel>
                <Input
                  id="exam-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="border-read-ink bg-read-ink-dark text-read-white placeholder:text-read-gray/40 focus-visible:ring-read-green"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="exam-nota" className="text-read-white">
                  Nota simbólica
                </FieldLabel>
                <Input
                  id="exam-nota"
                  type="number"
                  min={1}
                  step={1}
                  value={nota}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    setNota(Number.isNaN(v) ? 1 : Math.max(1, v))
                  }}
                  required
                  className="border-read-ink bg-read-ink-dark text-read-white focus-visible:ring-read-green"
                />
              </Field>
              {error && <p className="text-sm text-red-400">{error}</p>}
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
                onClick={() => setOpen(false)}
                className="border-read-ink bg-transparent text-read-white hover:bg-read-ink"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
              >
                {loading ? "Salvando..." : "Salvar"}
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
              disabled={deleting}
              className="text-read-gray hover:bg-read-ink hover:text-read-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 text-white hover:bg-red-700"
            >
              {deleting ? "Excluindo…" : "Excluir tudo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
