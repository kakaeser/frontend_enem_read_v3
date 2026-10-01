"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Check, Search } from "lucide-react"
import { AplicarTabs } from "@/components/aplicar-tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useExamPresentes,
  usePatchPresenteRedacao,
  type ExamPresente,
} from "@/hooks/use-presentes"
import { useAplicarAuth } from "@/lib/use-aplicar-auth"

export default function RedacaoPage() {
  const { examId } = useParams<{ examId: string }>()
  const ready = useAplicarAuth(examId)
  const [search, setSearch] = useState("")
  const [edits, setEdits] = useState<Record<number, string>>({})
  const [savedIds, setSavedIds] = useState<number[]>([])
  const [rowError, setRowError] = useState<Record<number, string>>({})

  const {
    data: presentes = [],
    isLoading,
    isError,
  } = useExamPresentes(examId, ready)
  const patchRedacao = usePatchPresenteRedacao(examId)

  if (!ready) return null

  const visible = presentes.filter((p) =>
    p.nome.toLowerCase().includes(search.trim().toLowerCase())
  )

  function displayValue(p: ExamPresente): string {
    if (edits[p.id] !== undefined) return edits[p.id]
    return p.redacaoNota != null ? String(p.redacaoNota) : ""
  }

  function save(p: ExamPresente) {
    const raw = (edits[p.id] ?? "").trim()
    const value = raw === "" ? null : Number(raw)
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 1000)) {
      setRowError((prev) => ({ ...prev, [p.id]: "0–1000 ou vazio." }))
      return
    }
    setRowError((prev) => {
      if (!prev[p.id]) return prev
      const next = { ...prev }
      delete next[p.id]
      return next
    })
    patchRedacao.mutate(
      { participantId: p.id, redacaoNota: value },
      {
        onSuccess: () => {
          setEdits((prev) => {
            if (prev[p.id] === undefined) return prev
            const next = { ...prev }
            delete next[p.id]
            return next
          })
          setSavedIds((prev) => [...prev, p.id])
          setTimeout(
            () => setSavedIds((prev) => prev.filter((id) => id !== p.id)),
            2000
          )
        },
        onError: (e) => {
          setRowError((prev) => ({
            ...prev,
            [p.id]:
              e instanceof Error ? `Erro: ${e.message}` : "Erro ao salvar.",
          }))
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <AplicarTabs />

      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-read-white">Redação</h1>
        {!isLoading && (
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

      {isLoading && <p className="text-sm text-read-gray">Carregando…</p>}

      {!isLoading && isError && (
        <p className="text-sm text-red-400">Não foi possível carregar os presentes.</p>
      )}

      {!isLoading && !isError && presentes.length === 0 && (
        <p className="text-sm text-read-gray">
          Nenhum aluno presente. Marque a presença na página de participantes.
        </p>
      )}

      {!isLoading && !isError && presentes.length > 0 && visible.length === 0 && (
        <p className="text-sm text-read-gray">
          Nenhum aluno encontrado para “{search.trim()}”.
        </p>
      )}

      {!isLoading && !isError && visible.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-read-ink bg-read-ink-dark">
          <ul className="divide-y divide-read-ink">
            {visible.map((p) => {
              const dirty = edits[p.id] !== undefined
              const saving =
                patchRedacao.isPending &&
                patchRedacao.variables?.participantId === p.id
              return (
                <li key={p.id} className="flex flex-col gap-1 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-read-white">
                      {p.nome}
                    </span>
                    {p.redacaoNota != null && !dirty && (
                      <Badge className="bg-read-green text-read-logo-dark tabular-nums">
                        {p.redacaoNota}
                      </Badge>
                    )}
                    {dirty && (
                      <Badge className="border border-read-green bg-transparent text-read-green">
                        não salva
                      </Badge>
                    )}
                    <Input
                      type="number"
                      min={0}
                      max={1000}
                      value={displayValue(p)}
                      onChange={(e) =>
                        setEdits((prev) => ({ ...prev, [p.id]: e.target.value }))
                      }
                      placeholder="—"
                      aria-label={`Redação de ${p.nome}`}
                      className="w-24 border-read-ink bg-read-darkest text-sm text-read-white focus-visible:border-read-green"
                    />
                    <Button
                      size="sm"
                      onClick={() => save(p)}
                      disabled={!dirty || saving}
                      className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white disabled:opacity-50"
                    >
                      {saving ? "…" : savedIds.includes(p.id) ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        "OK"
                      )}
                    </Button>
                  </div>
                  {rowError[p.id] && (
                    <p className="text-xs text-red-400">{rowError[p.id]}</p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
