"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Check, Copy, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RankStudentSheet } from "@/components/rank-student-sheet"
import { EditExamDialog } from "@/components/edit-exam-dialog"
import { authFetch } from "@/lib/auth-fetch"
import { downloadRankingExcel } from "@/lib/export-ranking"
import { formatNum, formatTotal } from "@/lib/format"
import type { RankingEntry, RankingResponse } from "@/lib/ranking-types"

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"

export default function RankingPage() {
  const { examId } = useParams<{ examId: string }>()
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [stats, setStats] = useState<RankingResponse["stats"] | null>(null)
  const [exam, setExam] = useState<RankingResponse["exam"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<RankingEntry | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmMode, setConfirmMode] = useState<"start" | "end" | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function requestRanking(
    signal?: AbortSignal
  ): Promise<RankingResponse> {
    const res = await authFetch(base, `${base}/exams/${examId}/results`, {
      signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }

  const fetchRanking = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await requestRanking()
      setRanking(Array.isArray(data.ranking) ? data.ranking : [])
      setStats(data.stats ?? null)
      setExam(data.exam ?? null)
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      setError("Não foi possível carregar o ranking.")
      setRanking([])
      setStats(null)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId])

  useEffect(() => {
    const controller = new AbortController()
    async function initialLoad() {
      try {
        const data = await requestRanking(controller.signal)
        setRanking(Array.isArray(data.ranking) ? data.ranking : [])
        setStats(data.stats ?? null)
        setExam(data.exam ?? null)
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return
        setError("Não foi possível carregar o ranking.")
      } finally {
        setLoading(false)
      }
    }
    void initialLoad()
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId])

  async function confirmStatus() {
    if (!confirmMode) return
    const next = confirmMode === "start" ? "in_progress" : "completed"
    setStatusLoading(true)
    setActionError(null)
    try {
      const res = await authFetch(base, `${base}/exams/${examId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? `HTTP ${res.status}`)
      }
      setConfirmMode(null)
      await fetchRanking()
      if (next === "completed" && ranking.length > 0) {
        try {
          downloadRankingExcel(ranking, exam?.nome ?? `Prova #${examId}`)
        } catch {
          setActionError("Prova encerrada, mas o download do Excel falhou.")
        }
      }
    } catch (e) {
      setActionError(
        e instanceof Error ? `Erro ao atualizar: ${e.message}` : "Erro ao atualizar."
      )
      setConfirmMode(null)
    } finally {
      setStatusLoading(false)
    }
  }

  async function copyRank() {
    const lines = ranking.map((r, i) => `${i + 1}. ${r.nome} — ${formatTotal(r)}`)
    const text = `Ranking — ${exam?.nome ?? `Prova #${examId}`}\n${lines.join("\n")}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setActionError("Não foi possível copiar.")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-read-white">Ranking</h1>
        <div className="ml-auto flex items-center gap-2">
          {!loading && (
            <EditExamDialog examId={examId} onSaved={fetchRanking} />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchRanking}
            disabled={loading}
            className="h-8 w-8 text-read-gray hover:bg-read-ink hover:text-read-green disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Recarregar rank</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyRank}
            disabled={loading || ranking.length === 0}
            className="text-read-gray hover:bg-read-ink hover:text-read-green disabled:opacity-50"
          >
            {copied ? (
              <Check className="mr-1 h-4 w-4 text-read-green" />
            ) : (
              <Copy className="mr-1 h-4 w-4" />
            )}
            {copied ? "Copiado!" : "Copiar rank"}
          </Button>
          {!loading && exam?.status === "completed" && (
            <Badge className="bg-read-ink text-read-gray">encerrada</Badge>
          )}
          {!loading && exam?.status === "draft" && (
            <Button
              size="sm"
              onClick={() => setConfirmMode("start")}
              className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
            >
              Começar prova
            </Button>
          )}
          {!loading && exam?.status === "in_progress" && (
            <Button
              size="sm"
              onClick={() => setConfirmMode("end")}
              className="bg-red-500 text-white hover:bg-red-700"
            >
              Encerrar prova
            </Button>
          )}
        </div>
      </div>

      {actionError && <p className="text-sm text-red-400">{actionError}</p>}

      {loading && <p className="text-sm text-read-gray">Carregando ranking…</p>}

      {!loading && error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && stats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Média", value: stats.media },
            { label: "Maior", value: stats.maior },
            { label: "Menor", value: stats.menor },
            { label: "Participantes", value: stats.totalParticipantes, plain: true },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-read-ink bg-read-ink-dark px-3 py-2 text-center"
            >
              <div className="text-[11px] text-read-gray">{s.label}</div>
              <div className="text-base font-bold text-read-white tabular-nums">
                {s.plain ? s.value : formatNum(s.value)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && ranking.length === 0 && (
        <p className="text-sm text-read-gray">
          Nenhum participante presente nesta prova.
        </p>
      )}

      {!loading && !error && ranking.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-read-ink bg-read-ink-dark">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-read-ink bg-read-darkest text-left text-xs text-read-gray">
                <th className="w-12 px-4 py-2.5 font-medium">#</th>
                <th className="w-full px-2 py-2.5 font-medium">Aluno</th>
                <th className="px-2 py-2.5 text-right font-medium">Redação</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-read-ink">
              {ranking.map((r, i) => (
                <tr
                  key={r.participantId}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer transition-colors hover:bg-read-ink/40"
                >
                  <td className="px-4 py-2.5 font-bold text-read-gray tabular-nums">
                    {i + 1}
                  </td>
                  <td className="max-w-0 w-full truncate px-2 py-2.5 font-medium text-read-white">
                    {r.nome}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    {r.redacao == null ? (
                      <Badge className="bg-read-ink text-read-gray">
                        pendente
                      </Badge>
                    ) : (
                      <Badge className="bg-read-green text-read-logo-dark">
                        corrigida
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-read-white tabular-nums">
                    {formatTotal(r)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={confirmMode !== null}
        onOpenChange={(open) => {
          if (!open && !statusLoading) setConfirmMode(null)
        }}
      >
        <DialogContent className="bg-read-ink-dark border-read-ink text-read-white">
          <DialogHeader>
            <DialogTitle className="text-read-white">
              {confirmMode === "start" ? "Começar prova?" : "Encerrar prova?"}
            </DialogTitle>
            <DialogDescription className="text-read-gray">
              {confirmMode === "start"
                ? "A prova entra em andamento e libera o acesso dos aplicadores."
                : "A prova será encerrada e não poderá ser reaberta. O ranking público será liberado 2 dias após o encerramento."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-read-ink bg-transparent">
            <Button
              variant="ghost"
              onClick={() => setConfirmMode(null)}
              disabled={statusLoading}
              className="text-read-gray hover:bg-read-ink hover:text-read-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmStatus}
              disabled={statusLoading}
              className={
                confirmMode === "start"
                  ? "bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
                  : "bg-red-500 text-white hover:bg-red-700"
              }
            >
              {statusLoading
                ? "Confirmando…"
                : confirmMode === "start"
                  ? "Começar"
                  : "Encerrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RankStudentSheet
        examId={examId}
        entry={selected}
        onClose={() => setSelected(null)}
        onSaved={fetchRanking}
      />
    </div>
  )
}
