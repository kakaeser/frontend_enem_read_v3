"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Search } from "lucide-react"
import { RankStudentSheet } from "@/components/rank-student-sheet"
import { formatTotal } from "@/lib/format"
import type { RankingEntry } from "@/lib/ranking-types"
import Header_menu from "@/components/header_landing"
import { useExamRanking, ResultadosBlockError } from "@/hooks/use-exam-ranking"

export default function ResultadoExamPage() {
  const { examId } = useParams<{ examId: string }>()
  const {data, isLoading, isError, error} = useExamRanking(examId)
  const [selected, setSelected] = useState<RankingEntry | null>(null)
  const [search, setSearch] = useState("")

  const blocked = error instanceof ResultadosBlockError
  const ranking = Array.isArray(data?.ranking) ? data.ranking : []
  const examNome = data?.exam?.nome ?? null
  const loadError = isError && !blocked

  return (
    <div className="flex min-h-svh flex-col bg-read-darkest text-read-white">
      <Header_menu></Header_menu>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 pb-8">
        <h1 className="text-xl font-bold">
          {examNome ?? `Prova #${examId}`}
        </h1>

        {!isLoading && !blocked && !error && ranking.length > 0 && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-read-gray" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar seu nome…"
              className="h-9 w-full rounded-lg border border-read-ink bg-read-ink-dark pl-9 pr-3 text-sm text-read-white placeholder:text-read-gray/60 focus:border-read-green focus:outline-none"
            />
          </div>
        )}

        {isLoading && (
          <p className="text-sm text-read-gray">Carregando ranking…</p>
        )}

        {!isLoading && blocked && (
          <p className="text-sm text-read-gray">
            Resultados disponíveis 2 dias após o encerramento.
          </p>
        )}

        {loadError && (
          <p className="text-sm text-red-400">
            Não foi possível carregar o ranking.
          </p>
        )}

        {!isLoading && !blocked && !error && ranking.length === 0 && (
          <p className="text-sm text-read-gray">
            Nenhum participante neste ranking.
          </p>
        )}

        {!isLoading && !blocked && !error && ranking.length > 0 && (() => {
          const visible = ranking.filter((r) =>
            r.nome.toLowerCase().includes(search.trim().toLowerCase())
          )
          if (visible.length === 0) {
            return (
              <p className="text-sm text-read-gray">
                Nenhum aluno encontrado para “{search.trim()}”.
              </p>
            )
          }
          return (
            <div className="overflow-hidden rounded-lg border border-read-ink bg-read-ink-dark">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-read-ink bg-read-darkest text-left text-xs text-read-gray">
                    <th className="w-12 px-4 py-2.5 font-medium">#</th>
                    <th className="w-full px-2 py-2.5 font-medium">Aluno</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-read-ink">
                  {visible.map((r) => (
                    <tr
                      key={r.participantId}
                      onClick={() => setSelected(r)}
                      className="cursor-pointer transition-colors hover:bg-read-ink/40"
                    >
                      <td className="px-4 py-2.5 font-bold text-read-gray tabular-nums">
                        {ranking.indexOf(r) + 1}
                      </td>
                      <td className="max-w-0 w-full truncate px-2 py-2.5 font-medium text-read-white">
                        {r.nome}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-read-white tabular-nums">
                        {formatTotal(r)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })()}

        <RankStudentSheet
          examId={examId}
          entry={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {}}
          editable={false}
          expandableQuestions
          detailSource="public"
        />
      </main>
    </div>
  )
}
