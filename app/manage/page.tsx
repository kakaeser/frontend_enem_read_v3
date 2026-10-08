"use client"

import HeaderAdm from "@/components/header_adm"
import { ManageExamsTable } from "./manage-exams-table"

export default function ManagePage() {
  return (
    <div className="flex min-h-svh flex-col bg-read-darkest">
      <HeaderAdm />
      <main className="mx-auto w-full max-w-5xl p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-read-white">Provas</h1>
        </div>
        <ManageExamsTable />
      </main>
    </div>
  )
}
