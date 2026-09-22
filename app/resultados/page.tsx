"use client"

import { DataTable } from "@/app/manage/data-table"
import { resultadosColumns, type Divulgada } from "./columns"
import Header_menu from "@/components/header_landing"
import { useExamResults } from "@/hooks/use-exam-results"


export default function ResultadosPage() {
  const {data = [], isLoading, isError} = useExamResults();

  return (
    <div className="flex min-h-svh flex-col bg-read-darkest text-read-white">
      <Header_menu></Header_menu>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4 pb-8 md:p-6">
        <h1 className="text-xl font-bold">Provas divulgadas</h1>

        {isLoading && (
          <p className="text-sm text-read-gray">Carregando resultados…</p>
        )}

        {!isLoading && isError && (
          <p className="text-sm text-red-400">
            Não foi possível carregar os resultados.
          </p>
        )}

        {!isLoading && !isError && (
          <DataTable
            columns={resultadosColumns}
            data={data}
            rowHref={(row) => `/resultados/${(row as Divulgada).id}`}
          />
        )}
      </main>
    </div>
  )
}
