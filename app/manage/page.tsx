"use client"

import HeaderAdm from "@/components/header_adm"
import { DataTable } from "./data-table"
import { columns} from "./columns"
import { useExams } from "@/hooks/use-exams"

export default function ManagePage() {
  const { data, isLoading, refetch } = useExams()

  return (
    <div className="flex min-h-svh flex-col bg-read-darkest">
      <HeaderAdm />
      <main className="mx-auto w-full max-w-5xl p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-read-white">Provas</h1>
        </div>
        {isLoading ? <p className="text-sm text-read-gray">Carregando...</p> : <DataTable columns={columns} data={data ?? []} onCreated={refetch} />}
      </main>
    </div>
  )
}
