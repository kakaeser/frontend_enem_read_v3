"use client"

import { useEffect, useState } from "react"
import { DataTable } from "@/app/manage/data-table"
import { resultadosColumns, type Divulgada } from "./columns"
import Header_menu from "@/components/header_landing"

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"

export default function ResultadosPage() {
  const [exams, setExams] = useState<Divulgada[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const res = await fetch(`${base}/resultados`, {
          cache: "no-store",
          signal: controller.signal,
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setExams(Array.isArray(data) ? data : [])
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  return (
    <div className="flex min-h-svh flex-col bg-read-darkest text-read-white">
      <Header_menu></Header_menu>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4 pb-8 md:p-6">
        <h1 className="text-xl font-bold">Provas divulgadas</h1>

        {loading && (
          <p className="text-sm text-read-gray">Carregando resultados…</p>
        )}

        {!loading && error && (
          <p className="text-sm text-red-400">
            Não foi possível carregar os resultados.
          </p>
        )}

        {!loading && !error && (
          <DataTable
            columns={resultadosColumns}
            data={exams}
            rowHref={(row) => `/resultados/${(row as Divulgada).id}`}
          />
        )}
      </main>
    </div>
  )
}
