"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronRight, Search } from "lucide-react"
import { AplicarTabs } from "@/components/aplicar-tabs"
import { Badge } from "@/components/ui/badge"
import { authAxiosRequest } from "@/lib/api"
import { useAplicarAuth } from "@/lib/use-aplicar-auth"

type Presente = {
  id: number
  nome: string
  _count: { answers: number }
}

export default function AplicarListPage() {
  const { examId } = useParams<{ examId: string }>()
  const ready = useAplicarAuth(examId)
  const [presentes, setPresentes] = useState<Presente[]>([])
  const [totalQuestoes, setTotalQuestoes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!ready) return
    const controller = new AbortController()
    async function load() {
      try {
        const [dataP, dataQ] = await Promise.all([
          authAxiosRequest<Presente[]>(
            "GET",
            `/exams/${examId}/participants/presentes`,
            { signal: controller.signal }
          ),
          authAxiosRequest<unknown[]>("GET", `/exams/${examId}/questions`, {
            signal: controller.signal,
          }),
        ])
        setPresentes(Array.isArray(dataP) ? dataP : [])
        setTotalQuestoes(Array.isArray(dataQ) ? dataQ.length : 0)
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return
        setError("Não foi possível carregar os presentes.")
      } finally {
        setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [ready, examId])

  if (!ready) return null

  const visible = presentes.filter((p) =>
    p.nome.toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4">
      <AplicarTabs />

      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-read-white">Corrigir</h1>
        {!loading && (
          <Badge className="bg-read-ink text-read-gray">
            {presentes.length}{" "}
            {presentes.length === 1 ? "presente" : "presentes"}
          </Badge>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-read-gray" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar aluno…"
          className="h-10 w-full rounded-lg border border-read-ink bg-read-ink-dark pl-9 pr-3 text-sm text-read-white placeholder:text-read-gray/60 focus:border-read-green focus:outline-none"
        />
      </div>

      {loading && (
        <p className="text-sm text-read-gray">Carregando presentes…</p>
      )}

      {!loading && error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && presentes.length === 0 && (
        <p className="text-sm text-read-gray">
          Nenhum aluno presente. Marque a presença na página de participantes.
        </p>
      )}

      {!loading && !error && presentes.length > 0 && visible.length === 0 && (
        <p className="text-sm text-read-gray">
          Nenhum aluno encontrado para “{search.trim()}”.
        </p>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-read-ink bg-read-ink-dark">
          <ul className="divide-y divide-read-ink">
            {visible.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/manage/aplicar/${examId}/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-read-ink/40"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-read-white">
                    {p.nome}
                  </span>
                  <Badge
                    className={`tabular-nums ${
                      totalQuestoes > 0 &&
                      p._count.answers === totalQuestoes
                        ? "bg-read-green text-read-logo-dark"
                        : "bg-read-ink text-read-gray"
                    }`}
                  >
                    {p._count.answers}/{totalQuestoes}
                  </Badge>
                  <ChevronRight className="h-4 w-4 shrink-0 text-read-gray" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
