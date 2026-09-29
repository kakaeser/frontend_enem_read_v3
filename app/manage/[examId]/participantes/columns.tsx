"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { ArrowUpDown, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { DataTableFeatures } from "@/app/manage/data-table-features"
import type { ExamParticipant } from "@/hooks/use-exam-participants"

export type ParticipantColumnHandlers = {
  togglingId?: number
  onTogglePresenca: (p: ExamParticipant) => void
  onDelete: (p: ExamParticipant) => void
}

const columnHelper = createColumnHelper<DataTableFeatures, ExamParticipant>()

export function createParticipantColumns(handlers: ParticipantColumnHandlers) {
  const { togglingId, onTogglePresenca, onDelete } = handlers

  return columnHelper.columns([
    columnHelper.accessor("nome", {
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 -ml-3 text-read-white hover:text-read-green"
        >
          Nome <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => (
        <span className="font-medium text-read-white">{getValue() as string}</span>
      ),
      filterFn: "includesString",
    }),
    columnHelper.accessor("presenca", {
      header: () => <span className="text-read-white">Presença</span>,
      cell: ({ getValue }) =>
        getValue() ? (
          <Badge className="bg-read-green text-read-logo-dark">presente</Badge>
        ) : (
          <Badge className="bg-read-ink text-read-gray">ausente</Badge>
        ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span className="text-read-white">Ações</span>,
      cell: ({ row }) => {
        const p = row.original
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onTogglePresenca(p)
              }}
              disabled={togglingId === p.id}
              className="border-read-ink bg-transparent text-xs text-read-gray hover:border-read-green hover:text-read-green disabled:opacity-50"
            >
              {p.presenca ? "Marcar ausente" : "Marcar presente"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(p)
              }}
              className="h-8 w-8 shrink-0 text-red-400 hover:bg-read-ink hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remover {p.nome}</span>
            </Button>
          </div>
        )
      },
    }),
  ])
}
