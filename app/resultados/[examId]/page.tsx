"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { ConsultaIndividualDialog } from "@/components/consulta-individual-dialog"
import { RankStudentSheet } from "@/components/rank-student-sheet"
import Header_menu from "@/components/header_landing"
import { useExamRanking, ResultadosBlockError } from "@/hooks/use-exam-ranking"
import { studentDetailFromRanking } from "@/hooks/use-student-detail"
import type { RankingEntry } from "@/lib/ranking-types"
import type { StudentDetail } from "@/lib/student-detail"

export default function ResultadoExamPage() {
  const { examId } = useParams<{ examId: string }>()
  const { data, isLoading, isError, error } = useExamRanking(examId)
  const [entry, setEntry] = useState<RankingEntry | null>(null)
  const [prefetchedDetail, setPrefetchedDetail] = useState<StudentDetail | null>(
    null
  )

  const blocked = error instanceof ResultadosBlockError
  const top15 = Array.isArray(data?.top15) ? data.top15 : []
  const examNome = data?.exam?.nome ?? null
  const loadError = isError && !blocked

  function handleConsultaSuccess(detail: StudentDetail) {
    setPrefetchedDetail(detail)
    setEntry(studentDetailFromRanking(detail))
  }

  function closeSheet() {
    setEntry(null)
    setPrefetchedDetail(null)
  }

  return (
    <div className="flex min-h-svh flex-col bg-read-darkest text-read-white">
      <Header_menu />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 pb-8">
        <h1 className="text-xl font-bold">
          {examNome ?? `Prova #${examId}`}
        </h1>

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

        {!isLoading && !blocked && !error && top15.length === 0 && (
          <p className="text-sm text-read-gray">
            Nenhum participante neste ranking.
          </p>
        )}

        {!isLoading && !blocked && !error && top15.length > 0 && (
          <>
            <div className="flex w-full justify-end">
              <ConsultaIndividualDialog
                examId={examId}
                onSuccess={handleConsultaSuccess}
              />
            </div>
            <div className="overflow-hidden rounded-lg border border-read-ink bg-read-ink-dark">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-read-ink bg-read-darkest text-left text-xs text-read-gray">
                    <th className="w-12 px-4 py-2.5 font-medium">#</th>
                    <th className="w-full px-2 py-2.5 font-medium">Aluno</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-read-ink">
                  {top15.map((r) => (
                    <tr key={`${r.posicao}-${r.nome}`}>
                      <td className="px-4 py-2.5 font-bold text-read-gray tabular-nums">
                        {r.posicao}
                      </td>
                      <td className="max-w-0 w-full truncate px-2 py-2.5 font-medium text-read-white">
                        {r.nome}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <RankStudentSheet
          examId={examId}
          entry={entry}
          onClose={closeSheet}
          onSaved={() => {}}
          editable={false}
          expandableQuestions
          prefetchedDetail={prefetchedDetail}
        />
      </main>
    </div>
  )
}
