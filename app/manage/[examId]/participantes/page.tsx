"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Search, Trash2 } from "lucide-react"
import { AddParticipantsDialog } from "@/components/add-participants-dialog"
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
import { authFetch } from "@/lib/auth-fetch"

type Participant = {
  id: number
  nome: string
  presenca: boolean
}

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"

export default function ParticipantesPage() {
  const { examId } = useParams<{ examId: string }>()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [togglingIds, setTogglingIds] = useState<number[]>([])
  const [deleteTarget, setDeleteTarget] = useState<Participant | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")

  const presentes = participants.filter((p) => p.presenca).length
  const visible = participants.filter((p) =>
    p.nome.toLowerCase().includes(search.trim().toLowerCase())
  )

  async function requestParticipants(
    signal?: AbortSignal
  ): Promise<Participant[]> {
    const res = await authFetch(
      base,
      `${base}/exams/${examId}/participants`,
      { signal }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return Array.isArray(data) ? data : []
  }

  async function fetchParticipants() {
    setLoading(true)
    setError(null)
    try {
      setParticipants(await requestParticipants())
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      setError("Não foi possível carregar os participantes.")
      setParticipants([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    async function initialLoad() {
      try {
        setParticipants(await requestParticipants(controller.signal))
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return
        setError("Não foi possível carregar os participantes.")
      } finally {
        setLoading(false)
      }
    }
    void initialLoad()
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId])

  async function togglePresenca(p: Participant) {
    const next = !p.presenca
    setTogglingIds((prev) => [...prev, p.id])
    setActionError(null)
    setParticipants((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, presenca: next } : x))
    )
    try {
      const res = await authFetch(
        base,
        `${base}/exams/${examId}/participants/${p.id}/presenca`,
        { method: "PATCH", body: JSON.stringify({ presenca: next }) }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? `HTTP ${res.status}`)
      }
    } catch (e) {
      setParticipants((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, presenca: p.presenca } : x))
      )
      setActionError(
        e instanceof Error
          ? `Erro ao atualizar ${p.nome}: ${e.message}`
          : `Erro ao atualizar ${p.nome}.`
      )
    } finally {
      setTogglingIds((prev) => prev.filter((id) => id !== p.id))
    }
  }

  async function confirmDelete() {
    const target = deleteTarget
    if (!target) return
    setDeleting(true)
    setActionError(null)
    try {
      const res = await authFetch(
        base,
        `${base}/exams/${examId}/participants/${target.id}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message ?? `HTTP ${res.status}`)
      }
      setParticipants((prev) => prev.filter((x) => x.id !== target.id))
      setDeleteTarget(null)
    } catch (e) {
      setActionError(
        e instanceof Error
          ? `Erro ao remover ${target.nome}: ${e.message}`
          : `Erro ao remover ${target.nome}.`
      )
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-read-white">Participantes</h1>
        {!loading && (
          <>
            <Badge className="bg-read-ink text-read-gray">
              {participants.length}{" "}
              {participants.length === 1 ? "aluno" : "alunos"}
            </Badge>
            <Badge className="bg-read-green text-read-logo-dark">
              {presentes} presentes
            </Badge>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-read-gray" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar aluno…"
            className="h-9 w-full rounded-lg border border-read-ink bg-read-ink-dark pl-9 pr-3 text-sm text-read-white placeholder:text-read-gray/60 focus:border-read-green focus:outline-none"
          />
        </div>
        <AddParticipantsDialog examId={examId} onAdded={fetchParticipants} />
      </div>

      {actionError && <p className="text-sm text-red-400">{actionError}</p>}

      {loading && (
        <p className="text-sm text-read-gray">Carregando participantes…</p>
      )}

      {!loading && error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && participants.length === 0 && (
        <p className="text-sm text-read-gray">
          Nenhum participante cadastrado. Clique em Adicionar para começar.
        </p>
      )}

      {!loading && !error && participants.length > 0 && visible.length === 0 && (
        <p className="text-sm text-read-gray">
          Nenhum participante encontrado para “{search.trim()}”.
        </p>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-read-ink bg-read-ink-dark">
          <ul className="divide-y divide-read-ink">
            {visible.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-read-white">
                  {p.nome}
                </span>
                {p.presenca ? (
                  <Badge className="bg-read-green text-read-logo-dark">
                    presente
                  </Badge>
                ) : (
                  <Badge className="bg-read-ink text-read-gray">ausente</Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => togglePresenca(p)}
                  disabled={togglingIds.includes(p.id)}
                  className="border-read-ink bg-transparent text-xs text-read-gray hover:border-read-green hover:text-read-green disabled:opacity-50"
                >
                  {p.presenca ? "Marcar ausente" : "Marcar presente"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(p)}
                  className="h-8 w-8 shrink-0 text-red-400 hover:bg-read-ink hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remover {p.nome}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null)
        }}
      >
        <DialogContent className="bg-read-ink-dark border-read-ink text-read-white">
          <DialogHeader>
            <DialogTitle className="text-read-white">
              Remover {deleteTarget?.nome}?
            </DialogTitle>
            <DialogDescription className="text-read-gray">
              O participante será removido permanentemente, junto com as
              respostas já lançadas para ele.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-read-ink bg-transparent">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="text-read-gray hover:bg-read-ink hover:text-read-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-500 text-white hover:bg-red-700"
            >
              {deleting ? "Removendo…" : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
