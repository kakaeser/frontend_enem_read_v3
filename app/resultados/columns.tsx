"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DataTableFeatures } from "@/app/manage/data-table-features"

export type Divulgada = {
  id: number
  nome: string
  encerramento: string | null
  _count: { participants: number }
}

const columnHelper = createColumnHelper<DataTableFeatures, Divulgada>()

export const resultadosColumns = columnHelper.columns([
  columnHelper.accessor("nome", {
    header: ({ column }) => (
      <Button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 -ml-3 text-read-white hover:text-read-green">
        Prova <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ getValue }) => <span className="font-medium text-read-white">{getValue() as string}</span>,
    filterFn: "includesString",
  }),
  columnHelper.accessor("encerramento", {
    header: () => <span className="text-read-white">Encerrada em</span>,
    cell: ({ getValue }) => {
      const v = getValue() as string | null
      return (
        <span className="text-read-white">
          {v ? new Date(v).toLocaleDateString("pt-BR") : "—"}
        </span>
      )
    },
  }),
  columnHelper.accessor((row) => row._count.participants, {
    id: "participantes",
    header: () => <span className="text-read-white">Participantes</span>,
    cell: ({ getValue }) => (
      <span className="text-read-white tabular-nums">{String(getValue())}</span>
    ),
  }),
])
