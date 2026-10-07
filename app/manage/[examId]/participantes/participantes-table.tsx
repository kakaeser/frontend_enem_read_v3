"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import {
  useDeleteParticipant,
  useExamParticipants,
  useExamParticipantsPresentesCount,
  useUpdateParticipantPresenca,
  type ExamParticipant,
} from "@/hooks/use-exam-participants"
import { DEFAULT_LIST_LIMIT } from "@/lib/pagination-types"
import { createParticipantColumns } from "./columns"

export function ParticipantesTable({ examId }: { examId: string }) {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebouncedValue(searchInput)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ExamParticipant | null>(null)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data: participants, meta, isLoading, isError, isFetching } =
    useExamParticipants(examId, {
      page,
      limit: DEFAULT_LIST_LIMIT,
      search: debouncedSearch,
    })

  const { data: presentesCount = 0 } = useExamParticipantsPresentesCount(examId)

  const { mutate: mutatePresenca, isPending: presencaPending, variables: presencaVariables } =
    useUpdateParticipantPresenca(examId)
  const deleteMutation = useDeleteParticipant(examId)

  useEffect(() => {
    if (!isLoading && participants.length === 0 && page > 1 && meta.totalPages < page) {
      setPage(Math.max(1, meta.totalPages))
    }
  }, [participants.length, isLoading, meta.totalPages, page])

  const togglingId = presencaPending ? presencaVariables?.id : undefined

  const togglePresenca = useCallback(
    (p: ExamParticipant) => {
      setActionError(null)
      mutatePresenca(
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
    [mutatePresenca]
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

  const showInitialEmpty = !isLoading && !isError && meta.total === 0 && !debouncedSearch
  const showTable =
    !isLoading && !isError && (meta.total > 0 || Boolean(debouncedSearch))

  return (
    <>
      <div className="flex items-center gap-3">
        {!isLoading && !isError && meta.total > 0 && (
          <>
            <Badge className="bg-read-ink text-read-gray">
              {meta.total} {meta.total === 1 ? "aluno" : "alunos"}
            </Badge>
            <Badge className="bg-read-green text-read-logo-dark">
              {presentesCount} presentes
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

      {showInitialEmpty && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-read-gray">
            Nenhum participante cadastrado. Clique em Adicionar para começar.
          </p>
          <AddParticipantsDialog examId={examId} />
        </div>
      )}

      {showTable && (
        <DataTable
          columns={columns}
          data={participants}
          toolbarEnd={<AddParticipantsDialog examId={examId} />}
          searchPlaceholder="Buscar aluno…"
          emptyMessage="Nenhum participante encontrado."
          showHeader={false}
          tableBorderClassName="border-read-ink"
          tableBodyClassName="bg-read-ink-dark divide-y divide-read-ink"
          pagination={{
            page: meta.page,
            totalPages: meta.totalPages,
            onPageChange: setPage,
            isFetching,
          }}
          search={{ value: searchInput, onChange: setSearchInput }}
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
    </>
  )
}
