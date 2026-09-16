"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { authFetch } from "@/lib/auth-fetch"
import type { RankingEntry } from "@/lib/ranking-types"

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"

type DetailQuestao = {
  numero: number
  correctAnswer: string
  marcada: string
  acertou: boolean
  peso: number
}

type Detail = {
  participant: { id: number; nome: string; presenca: boolean }
  notas: { ponderada: number; redacao: number | null; total: number }
  questoes: DetailQuestao[]
}

export function formatTotal(e: Pick<RankingEntry, "respondidas" | "redacao" | "total">): string {
  if (e.respondidas === 0 && e.redacao == null) return "—"
  return e.total.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
}

export function RankStudentSheet({
  examId,
  entry,
  onClose,
  onSaved,
}: {
  examId: string
  entry: RankingEntry | null
  onClose: () => void
  onSaved: () => void
}) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(false)
  const [redacao, setRedacao] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  function handleOpenChange(open: boolean) {
    if (!open) onClose()
  }

  const entryId = entry?.participantId ?? null
  useEffect(() => {
    if (entryId === null) return
    const controller = new AbortController()
    async function initialLoad() {
      setLoading(true)
      setError(null)
      setDetail(null)
      setSavedFlash(false)
      try {
        const res = await authFetch(
          base,
          `${base}/exams/${examId}/results/${entryId}`,
          { signal: controller.signal }
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: Detail = await res.json()
        setDetail(data)
        setRedacao(data.notas.redacao != null ? String(data.notas.redacao) : "")
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return
        setError("Não foi possível carregar o detalhe.")
        setDetail(null)
      } finally {
        setLoading(false)
      }
    }
    void initialLoad()
    return () => controller.abort()
  }, [entryId, examId, reloadKey])

  async function saveRedacao() {
    if (!entry) return
    const trimmed = redacao.trim()
    const value = trimmed === "" ? null : Number(trimmed)
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 1000)) {
      setError("Redação deve estar entre 0 e 1000 (ou vazio para limpar).")
      return
    }
    setSaving(true)
    setError(null)
    setSavedFlash(false)
    try {
      const res = await authFetch(
        base,
        `${base}/exams/${examId}/participants/${entry.participantId}/redacao`,
        { method: "PATCH", body: JSON.stringify({ redacaoNota: value }) }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? `HTTP ${res.status}`)
      }
      setSavedFlash(true)
      onSaved()
      setReloadKey((k) => k + 1)
    } catch (e) {
      setError(
        e instanceof Error ? `Erro ao salvar: ${e.message}` : "Erro ao salvar."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={entry !== null}
      onOpenChange={handleOpenChange}
    >
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
          {loading && (
            <p className="text-sm text-read-gray">Carregando detalhe…</p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}

          {detail && (
            <>
              <div className="grid grid-cols-3 gap-2">
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
              </div>

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
                    onClick={saveRedacao}
                    disabled={saving}
                    className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white disabled:opacity-50"
                  >
                    {saving ? "Salvando…" : "Salvar"}
                  </Button>
                  {savedFlash && (
                    <span className="text-xs text-read-green">Salva!</span>
                  )}
                </div>
              </div>

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
                          <th className="px-2 py-2 text-center font-medium">Peso</th>
                          <th className="px-2 py-2 text-center font-medium">Correta</th>
                          <th className="px-3 py-2 text-center font-medium">Marcada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-read-ink">
                        {detail.questoes.map((q) => (
                          <tr key={q.numero}>
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
