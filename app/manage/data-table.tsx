"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTable, type ColumnDef, type RowData, type SortingState, type ColumnFiltersState } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { features, type DataTableFeatures } from "./data-table-features"

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  rowHref?: (row: TData) => string
  toolbarEnd?: React.ReactNode
  searchPlaceholder?: string
  filterColumnId?: string
  emptyMessage?: string
  showHeader?: boolean
  tableBorderClassName?: string
  tableBodyClassName?: string
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  rowHref,
  toolbarEnd,
  searchPlaceholder = "Buscar prova...",
  filterColumnId = "nome",
  emptyMessage = "Nenhuma prova encontrada.",
  showHeader = true,
  tableBorderClassName = "border-read-green",
  tableBodyClassName,
}: DataTableProps<TData>) {
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

  const filterColumn = table.getColumn(filterColumnId)
  const rowNavigation = Boolean(rowHref)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-read-gray" />
          <input
            placeholder={searchPlaceholder}
            value={(filterColumn?.getFilterValue() as string) ?? ""}
            onChange={(e) => filterColumn?.setFilterValue(e.target.value)}
            className="h-9 w-full rounded-lg border border-read-ink bg-read-ink-dark pl-9 pr-3 text-sm text-read-white placeholder:text-read-gray/60 focus:border-read-green focus:outline-none"
          />
        </div>
        {toolbarEnd}
      </div>
      <div className={cn("overflow-hidden rounded-lg border", tableBorderClassName)}>
        <Table>
          {showHeader && (
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
          )}
          <TableBody className={tableBodyClassName}>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const href = rowHref?.(row.original)
                const rowClass = cn(
                  "border-read-ink/50",
                  rowNavigation && href
                    ? "cursor-pointer hover:bg-read-ink"
                    : "hover:bg-transparent"
                )
                const handleRowClick =
                  rowNavigation && href
                    ? () => router.push(href)
                    : undefined

                return (
                  <TableRow key={row.id} onClick={handleRowClick} className={rowClass}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={!showHeader ? "py-2.5" : undefined}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-read-gray">
                  {emptyMessage}
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
