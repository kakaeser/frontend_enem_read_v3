"use client"

import { useEffect, useState } from "react"
import { DataTable } from "@/app/manage/data-table"
import { columns } from "@/app/manage/columns"
import { CreateExamDialog } from "@/components/create-exam-dialog"
import { useExams } from "@/hooks/use-exams"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { DEFAULT_LIST_LIMIT } from "@/lib/pagination-types"

export function ManageExamsTable() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebouncedValue(searchInput)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data, meta, isLoading, isError, isFetching } = useExams({
    page,
    limit: DEFAULT_LIST_LIMIT,
    search: debouncedSearch,
  })

  useEffect(() => {
    if (!isLoading && data.length === 0 && page > 1 && meta.totalPages < page) {
      setPage(Math.max(1, meta.totalPages))
    }
  }, [data.length, isLoading, meta.totalPages, page])

  if (isLoading) {
    return <p className="text-sm text-read-gray">Carregando...</p>
  }

  if (isError) {
    return <p className="text-sm text-red-400">Não foi possível carregar as provas.</p>
  }

  if (meta.total === 0 && !debouncedSearch) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-read-gray">Nenhuma prova cadastrada.</p>
        <CreateExamDialog />
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      rowHref={(row) => `/manage/${row.id}`}
      toolbarEnd={<CreateExamDialog />}
      pagination={{
        page: meta.page,
        totalPages: meta.totalPages,
        onPageChange: setPage,
        isFetching,
      }}
      search={{ value: searchInput, onChange: setSearchInput }}
    />
  )
}
