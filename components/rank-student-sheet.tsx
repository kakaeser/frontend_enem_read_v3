"use client"

import { Fragment, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatTotal } from "@/lib/format"
import type { RankingEntry } from "@/lib/ranking-types"
import type { StudentDetail } from "@/lib/student-detail"
import {
  type StudentDetailSource,
  usePatchParticipantRedacao,
  useStudentDetail,
} from "@/hooks/use-student-detail"

export type { StudentDetail } from "@/lib/student-detail"

export function RankStudentSheet({
  examId,
  entry,
  onClose,
  onSaved,
  editable = true,
  expandableQuestions = false,
  detailSource = "admin",
}: {
  examId: string
  entry: RankingEntry | null
  onClose: () => void
  onSaved: () => void
  editable?: boolean
  expandableQuestions?: boolean
  detailSource?: StudentDetailSource
}) {
  const [redacao, setRedacao] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [expandedQ, setExpandedQ] = useState<number | null>(null)

  const participantId = entry?.participantId ?? null

  const {
    data: detail,
    isLoading,
    isError: isLoadError,
  } = useStudentDetail(detailSource, examId, participantId)

  const saveRedacaoMutation = usePatchParticipantRedacao(
    examId,
    participantId,
    {
      onSuccess: () => {
        setSavedFlash(true)
        onSaved()
      },
    }
  )

  function handleOpenChange(open: boolean) {
    if (!open) onClose()
  }

  useEffect(() => {
    if (participantId === null) return
    setSavedFlash(false)
    setValidationError(null)
    setExpandedQ(null)
  }, [participantId])

  useEffect(() => {
    if (!detail) return
    setRedacao(detail.notas.redacao != null ? String(detail.notas.redacao) : "")
  }, [detail])

  function handleSaveRedacao() {
    if (!entry) return
    const trimmed = redacao.trim()
    const value = trimmed === "" ? null : Number(trimmed)
    if (
      value !== null &&
      (!Number.isFinite(value) || value < 0 || value > 1000)
    ) {
      setValidationError(
        "Redação deve estar entre 0 e 1000 (ou vazio para limpar)."
      )
      return
    }
    setValidationError(null)
    setSavedFlash(false)
    saveRedacaoMutation.mutate(value)
  }

  const saveError =
    saveRedacaoMutation.error instanceof Error
      ? `Erro ao salvar: ${saveRedacaoMutation.error.message}`
      : saveRedacaoMutation.isError
        ? "Erro ao salvar."
        : null

  return (
    <Sheet open={entry !== null} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="bg-read-ink-dark border-read-ink text-read-white overflow-y-auto p-5 sm:max-w-md"
      >
        <SheetHeader className="p-0">
          <SheetTitle className="text-read-white">
            {entry?.nome ?? ""}
          </SheetTitle>
          <SheetDescription className="text-read-gray">
            {entry
              ? `Total ${formatTotal(entry)} • ${entry.respondidas}/${entry.totalQuestoes} respondidas`
              : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 flex flex-col gap-6">
          {isLoading && (
            <p className="text-sm text-read-gray">Carregando detalhe…</p>
          )}
          {isLoadError && (
            <p className="text-sm text-red-400">
              Não foi possível carregar o detalhe.
            </p>
          )}
          {validationError && (
            <p className="text-sm text-red-400">{validationError}</p>
          )}
          {saveError && <p className="text-sm text-red-400">{saveError}</p>}

          {detail && (
            <>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Ponderada", value: detail.notas.ponderada },
                  { label: "Redação", value: detail.notas.redacao },
                  { label: "Total", value: detail.notas.total },
                ].map((n) => (
                  <div
                    key={n.label}
                    className="rounded-lg border border-read-ink bg-read-darkest px-2 py-2.5 text-center"
                  >
                    <div className="text-[11px] text-read-gray">{n.label}</div>
                    <div className="text-sm font-bold text-read-white tabular-nums">
                      {n.value == null
                        ? "—"
                        : n.value.toLocaleString("pt-BR", {
                            maximumFractionDigits: 1,
                          })}
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-read-ink bg-read-darkest px-2 py-2.5 text-center">
                  <div className="text-[11px] text-read-gray">Acertos</div>
                  <div className="text-sm font-bold text-read-white tabular-nums">
                    {detail.questoes.filter((q) => q.acertou).length}/
                    {entry?.totalQuestoes ?? detail.questoes.length}
                  </div>
                </div>
              </div>

              {editable && (
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="redacao-nota"
                    className="text-xs font-medium text-read-gray"
                  >
                    Nota da redação (0–1000, vazio limpa)
                  </label>
                  <div className="flex items-center gap-2.5">
                    <Input
                      id="redacao-nota"
                      type="number"
                      min={0}
                      max={1000}
                      value={redacao}
                      onChange={(e) => {
                        setRedacao(e.target.value)
                        setSavedFlash(false)
                      }}
                      placeholder="—"
                      className="w-32 border-read-ink bg-read-darkest text-sm text-read-white focus-visible:border-read-green"
                    />
                    <Button
                      onClick={handleSaveRedacao}
                      disabled={saveRedacaoMutation.isPending}
                      className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white disabled:opacity-50"
                    >
                      {saveRedacaoMutation.isPending ? "Salvando…" : "Salvar"}
                    </Button>
                    {savedFlash && (
                      <span className="text-xs text-read-green">Salva!</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-medium text-read-gray">
                  Por questão ({detail.questoes.length} respondidas)
                </span>
                {detail.questoes.length === 0 ? (
                  <p className="text-sm italic text-read-gray">
                    Nenhuma resposta lançada.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-read-ink">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-read-ink bg-read-darkest text-left text-[11px] text-read-gray">
                          <th className="px-3 py-2 font-medium">Q</th>
                          <th className="px-2 py-2 text-center font-medium">
                            Peso
                          </th>
                          <th className="px-2 py-2 text-center font-medium">
                            Correta
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            Marcada
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-read-ink">
                        {detail.questoes.map((q) => (
                          <Fragment key={q.numero}>
                            <tr
                              onClick={
                                expandableQuestions
                                  ? () =>
                                      setExpandedQ((prev) =>
                                        prev === q.numero ? null : q.numero
                                      )
                                  : undefined
                              }
                              className={
                                expandableQuestions
                                  ? "cursor-pointer transition-colors hover:bg-read-ink/40"
                                  : undefined
                              }
                            >
                              <td className="px-3 py-2 font-bold text-read-white tabular-nums">
                                {q.numero}
                              </td>
                              <td className="px-2 py-2 text-center text-read-gray tabular-nums">
                                {q.peso}
                              </td>
                              <td className="px-2 py-2 text-center font-bold text-read-green tabular-nums">
                                {q.correctAnswer}
                              </td>
                              <td
                                className={`px-3 py-2 text-center font-bold tabular-nums ${
                                  q.acertou ? "text-read-green" : "text-red-400"
                                }`}
                              >
                                {q.marcada}
                              </td>
                            </tr>
                            {expandableQuestions && expandedQ === q.numero && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="bg-read-darkest/60 px-3 py-3"
                                >
                                  <p className="whitespace-pre-wrap text-sm text-read-white">
                                    {q.enunciado || (
                                      <span className="italic text-read-gray">
                                        Sem enunciado.
                                      </span>
                                    )}
                                  </p>
                                  <ul className="mt-2 flex flex-col gap-1.5">
                                    {(q.alternativas ?? []).map((a) => (
                                      <li
                                        key={a.letra}
                                        className={`rounded-md border px-3 py-1.5 text-sm ${
                                          a.letra === q.correctAnswer
                                            ? "border-read-green bg-read-green/10 text-read-white"
                                            : a.letra === q.marcada
                                              ? "border-red-500/60 bg-red-500/10 text-read-white"
                                              : "border-read-ink bg-read-darkest text-read-gray"
                                        }`}
                                      >
                                        <span className="mr-2 font-bold">
                                          {a.letra})
                                        </span>
                                        {a.texto || (
                                          <span className="italic">sem texto</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
