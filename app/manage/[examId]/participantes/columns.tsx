"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { Trash2 } from "lucide-react"
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
      header: () => null,
      cell: ({ row }) => {
        const p = row.original
        return (
          <div className="flex min-w-0 items-center gap-2">
            <span className="w-48 shrink-0 truncate text-sm font-medium text-read-white sm:w-64">
              {p.nome}
            </span>
            {p.presenca ? (
              <Badge className="shrink-0 bg-read-green text-read-logo-dark">presente</Badge>
            ) : (
              <Badge className="shrink-0 bg-read-ink text-read-gray">ausente</Badge>
            )}
          </div>
        )
      },
      filterFn: "includesString",
    }),
    columnHelper.accessor("consultaCode", {
      header: () => (
        <span className="text-read-white whitespace-nowrap">Código consulta</span>
      ),
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-read-gray tabular-nums">
          {getValue() as string}
        </span>
      ),
    }),
    columnHelper.display({
      id: "rowActions",
      header: () => null,
      cell: ({ row }) => {
        const p = row.original
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              type="button"
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
              type="button"
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
