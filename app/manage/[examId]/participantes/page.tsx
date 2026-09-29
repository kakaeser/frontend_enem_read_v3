"use client"

import { useCallback, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { AddParticipantsDialog } from "@/components/add-participants-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataTable } from "@/app/manage/data-table"
import {
  useDeleteParticipant,
  useExamParticipants,
  useUpdateParticipantPresenca,
  type ExamParticipant,
} from "@/hooks/use-exam-participants"
import { createParticipantColumns } from "./columns"

export default function ParticipantesPage() {
  const { examId } = useParams<{ examId: string }>()
  const { data: participants = [], isLoading, isError } = useExamParticipants(examId)
  const presencaMutation = useUpdateParticipantPresenca(examId)
  const deleteMutation = useDeleteParticipant(examId)

  const [actionError, setActionError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ExamParticipant | null>(null)

  const presentes = participants.filter((p) => p.presenca).length

  const togglingId =
    presencaMutation.isPending ? presencaMutation.variables?.id : undefined

  const togglePresenca = useCallback(
    (p: ExamParticipant) => {
      setActionError(null)
      presencaMutation.mutate(
        { id: p.id, presenca: !p.presenca },
        {
          onError: (e) => {
            setActionError(
              e instanceof Error
                ? `Erro ao atualizar ${p.nome}: ${e.message}`
                : `Erro ao atualizar ${p.nome}.`
            )
          },
        }
      )
    },
    [presencaMutation]
  )

  function confirmDelete() {
    const target = deleteTarget
    if (!target) return
    setActionError(null)
    deleteMutation.mutate(target.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (e) => {
        setActionError(
          e instanceof Error
            ? `Erro ao remover ${target.nome}: ${e.message}`
            : `Erro ao remover ${target.nome}.`
        )
        setDeleteTarget(null)
      },
    })
  }

  const columns = useMemo(
    () =>
      createParticipantColumns({
        togglingId,
        onTogglePresenca: togglePresenca,
        onDelete: setDeleteTarget,
      }),
    [togglingId, togglePresenca]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-read-white">Participantes</h1>
        {!isLoading && (
          <>
            <Badge className="bg-read-ink text-read-gray">
              {participants.length}{" "}
              {participants.length === 1 ? "aluno" : "alunos"}
            </Badge>
            <Badge className="bg-read-green text-read-logo-dark">
              {presentes} presentes
            </Badge>
          </>
        )}
      </div>

      {actionError && <p className="text-sm text-red-400">{actionError}</p>}

      {isLoading && (
        <p className="text-sm text-read-gray">Carregando participantes…</p>
      )}

      {isError && (
        <p className="text-sm text-red-400">
          Não foi possível carregar os participantes.
        </p>
      )}

      {!isLoading && !isError && participants.length === 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-read-gray">
            Nenhum participante cadastrado. Clique em Adicionar para começar.
          </p>
          <AddParticipantsDialog examId={examId} />
        </div>
      )}

      {!isLoading && !isError && participants.length > 0 && (
        <DataTable
          columns={columns}
          data={participants}
          toolbarEnd={<AddParticipantsDialog examId={examId} />}
          searchPlaceholder="Buscar aluno…"
          emptyMessage="Nenhum participante encontrado."
        />
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteTarget(null)
        }}
      >
        <DialogContent className="bg-read-ink-dark border-read-ink text-read-white">
          <DialogHeader>
            <DialogTitle className="text-read-white">
              Remover {deleteTarget?.nome}?
            </DialogTitle>
            <DialogDescription className="text-read-gray">
              O participante será removido permanentemente, junto com as
              respostas já lançadas para ele.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-read-ink bg-transparent">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
              className="text-read-gray hover:bg-read-ink hover:text-read-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-500 text-white hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Removendo…" : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
