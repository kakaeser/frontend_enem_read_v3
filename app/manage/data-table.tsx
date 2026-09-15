"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTable, type ColumnDef, type RowData, type SortingState, type ColumnFiltersState } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { CreateExamDialog } from "@/components/create-exam-dialog"
import { features, type DataTableFeatures } from "./data-table-features"

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  onCreated?: () => void
}

export function DataTable<TData extends RowData>({ columns, data, onCreated }: DataTableProps<TData>) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-read-gray" />
          <input
            placeholder="Buscar prova..."
            value={(table.getColumn("nome")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("nome")?.setFilterValue(e.target.value)}
            className="h-9 w-full rounded-lg border border-read-ink bg-read-ink-dark pl-9 pr-3 text-sm text-read-white placeholder:text-read-gray/60 focus:border-read-green focus:outline-none"
          />
        </div>
        {onCreated && <CreateExamDialog onCreated={onCreated} />}
      </div>
      <div className="overflow-hidden rounded-lg border border-read-green">
        <Table>
          <TableHeader className="bg-read-logo-dark">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent border-read-dark">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-read-white">
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => {
                    const exam = row.original as { id: number }
                    router.push(`/manage/${exam.id}`)
                  }}
                  className="cursor-pointer hover:bg-read-ink border-read-ink/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-read-gray">
                  Nenhuma prova encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="border-read-ink bg-read-ink text-read-white hover:bg-read-darkest hover:text-read-white">
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="border-read-ink bg-read-ink text-read-white hover:bg-read-darkest hover:text-read-white">
          Próxima
        </Button>
      </div>
    </div>
  )
}
