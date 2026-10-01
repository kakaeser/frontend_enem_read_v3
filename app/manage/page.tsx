"use client"

import HeaderAdm from "@/components/header_adm"
import { CreateExamDialog } from "@/components/create-exam-dialog"
import { DataTable } from "./data-table"
import { columns} from "./columns"
import { useExams } from "@/hooks/use-exams"

export default function ManagePage() {
  const { data, isLoading, isError } = useExams()

  return (
    <div className="flex min-h-svh flex-col bg-read-darkest">
      <HeaderAdm />
      <main className="mx-auto w-full max-w-5xl p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-read-white">Provas</h1>
        </div>
        {isLoading ? (
          <p className="text-sm text-read-gray">Carregando...</p>
        ) : isError ? (
          <p className="text-sm text-red-400">Não foi possível carregar as provas.</p>
        ) : (
          <DataTable
            columns={columns}
            data={data ?? []}
            rowHref={(row) => `/manage/${row.id}`}
            toolbarEnd={<CreateExamDialog />}
          />
        )}
      </main>
    </div>
  )
}
