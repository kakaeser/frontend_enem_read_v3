"use client"

import { useEffect, useState } from "react"
import HeaderAdm from "@/components/header_adm"
import { DataTable } from "./data-table"
import { columns, type Exam } from "./columns"

export default function ManagePage() {
  const [data, setData] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"

  async function load() {
    setLoading(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
      const res = await fetch(`${base}/exams`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const json = res.ok ? await res.json() : []
      setData(Array.isArray(json) ? json : [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="flex min-h-svh flex-col bg-read-darkest">
      <HeaderAdm />
      <main className="mx-auto w-full max-w-5xl p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-read-white">Provas</h1>
        </div>
        {loading ? <p className="text-sm text-read-gray">Carregando...</p> : <DataTable columns={columns} data={data} onCreated={load} />}
      </main>
    </div>
  )
}
