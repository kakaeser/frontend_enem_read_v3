"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { DataTableFeatures } from "./data-table-features"

export type Exam = {
  id: number
  nome: string
  qtdQuestoes: number
  notaSimbolica: number
  status: "draft" | "in_progress" | "completed"
  encerramento?: string | null
  createdAt?: string
}

const columnHelper = createColumnHelper<DataTableFeatures, Exam>()

function StatusBadge({ status }: { status: Exam["status"] }) {
  const map: Record<Exam["status"], string> = {
    draft: "bg-read-gray text-read-logo-dark",
    in_progress: "bg-read-green text-read-logo-dark",
    completed: "bg-read-dark text-read-white",
  }
  const label: Record<Exam["status"], string> = {
    draft: "Rascunho",
    in_progress: "Em andamento",
    completed: "Encerrada",
  }
  return <Badge className={map[status]}>{label[status]}</Badge>
}

export const columns = columnHelper.columns([
  columnHelper.accessor("nome", {
    header: ({ column }) => (
      <Button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 -ml-3 text-read-white hover:text-read-green">
        Prova <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ getValue }) => <span className="font-medium text-read-white">{getValue() as string}</span>,
    filterFn: "includesString",
  }),
  columnHelper.accessor("qtdQuestoes", {
    header: () => <span className="text-read-white">Questões</span>,
    cell: ({ getValue }) => <span className="text-read-white">{String(getValue())}</span>,
  }),
  columnHelper.accessor("notaSimbolica", {
    header: () => <span className="text-read-white">Nota simbólica</span>,
    cell: ({ getValue }) => <span className="text-read-white">{String(getValue())}</span>,
  }),
  columnHelper.accessor("status", {
    header: () => <span className="text-read-white">Status</span>,
    cell: ({ getValue }) => <StatusBadge status={getValue() as Exam["status"]} />,
  }),
])
