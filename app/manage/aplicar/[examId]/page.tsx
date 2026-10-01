"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronRight, Search } from "lucide-react"
import { AplicarTabs } from "@/components/aplicar-tabs"
import { Badge } from "@/components/ui/badge"
import { useExamPresentes } from "@/hooks/use-presentes"
import { useExamQuestions } from "@/hooks/use-exam-questions"
import { useAplicarAuth } from "@/lib/use-aplicar-auth"

export default function AplicarListPage() {
  const { examId } = useParams<{ examId: string }>()
  const ready = useAplicarAuth(examId)
  const [search, setSearch] = useState("")

  const {
    data: presentes = [],
    isLoading: loadingPresentes,
    isError: errorPresentes,
  } = useExamPresentes(examId, ready)
  const { data: questions = [], isLoading: loadingQuestions } =
    useExamQuestions(examId, ready)

  const loading = !ready || loadingPresentes || loadingQuestions
  const totalQuestoes = questions.length

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

      {!loading && errorPresentes && (
        <p className="text-sm text-red-400">Não foi possível carregar os presentes.</p>
      )}

      {!loading && !errorPresentes && presentes.length === 0 && (
        <p className="text-sm text-read-gray">
          Nenhum aluno presente. Marque a presença na página de participantes.
        </p>
      )}

      {!loading && !errorPresentes && presentes.length > 0 && visible.length === 0 && (
        <p className="text-sm text-read-gray">
          Nenhum aluno encontrado para “{search.trim()}”.
        </p>
      )}

      {!loading && !errorPresentes && visible.length > 0 && (
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
                      (p._count?.answers ?? 0) === totalQuestoes
                        ? "bg-read-green text-read-logo-dark"
                        : "bg-read-ink text-read-gray"
                    }`}
                  >
                    {p._count?.answers ?? 0}/{totalQuestoes}
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
