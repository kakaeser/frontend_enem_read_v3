"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
import { useBulkAnswers } from "@/hooks/use-bulk-answers"
import { useExamQuestions } from "@/hooks/use-exam-questions"
import { useExamPresentes } from "@/hooks/use-presentes"
import { useParticipantAnswers } from "@/hooks/use-participant-answers"
import { useAplicarAuth } from "@/lib/use-aplicar-auth"

type Alternativa = { letra: string; texto: string }

type Question = {
  id: number
  numero: number
  enunciado: string
  alternativas: Alternativa[]
}

type Draft = { marks: Record<number, string>; lastQ: number | null }

const LETRAS = ["A", "B", "C", "D"]

function lsKey(examId: string, participantId: string) {
  return `aplicar:${examId}:${participantId}`
}

function readDraft(examId: string, participantId: string): Draft {
  try {
    const raw = localStorage.getItem(lsKey(examId, participantId))
    if (!raw) return { marks: {}, lastQ: null }
    const data = JSON.parse(raw) as {
      marks?: Record<string, string>
      lastQ?: number
    }
    const marks: Record<number, string> = {}
    for (const [k, v] of Object.entries(data.marks ?? {})) {
      if (typeof v === "string" && LETRAS.includes(v)) marks[Number(k)] = v
    }
    return {
      marks,
      lastQ: typeof data.lastQ === "number" ? data.lastQ : null,
    }
  } catch {
    return { marks: {}, lastQ: null }
  }
}

function toQuestions(
  raw: {
    id: number
    numero: number
    enunciado: string
    alternativas: unknown
  }[]
): Question[] {
  return raw.map((q) => ({
    id: q.id,
    numero: q.numero,
    enunciado: q.enunciado,
    alternativas: Array.isArray(q.alternativas)
      ? (q.alternativas as Alternativa[])
      : [],
  }))
}

export default function CorretorPage() {
  const { examId, participantId } = useParams<{
    examId: string
    participantId: string
  }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const ready = useAplicarAuth(examId)

  const {
    data: rawQuestions = [],
    isLoading: loadingQuestions,
    isError: errorQuestions,
  } = useExamQuestions(examId, ready)
  const {
    data: answerRows = [],
    isLoading: loadingAnswers,
    isError: errorAnswers,
  } = useParticipantAnswers(examId, participantId, ready)
  const { data: presentes = [], isLoading: loadingPresentes } =
    useExamPresentes(examId, ready)

  const bulkAnswers = useBulkAnswers(examId, participantId)

  const [questions, setQuestions] = useState<Question[]>([])
  const [studentName, setStudentName] = useState<string | null>(null)
  const [marks, setMarks] = useState<Record<number, string>>({})
  const [serverMarks, setServerMarks] = useState<Record<number, string>>({})
  const [index, setIndex] = useState(-1)
  const [feedback, setFeedback] = useState<
    { kind: "error" | "success"; message: string } | null
  >(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const initRef = useRef(false)

  const loading =
    !ready || loadingQuestions || loadingAnswers || loadingPresentes
  const error = errorQuestions || errorAnswers

  useEffect(() => {
    if (!ready || loading || error || initRef.current) return
    initRef.current = true

    const qs = toQuestions(rawQuestions)
    const server: Record<number, string> = {}
    for (const a of answerRows) server[a.questId] = a.alternativa
    const draft = readDraft(examId, participantId)
    const merged =
      Object.keys(draft.marks).length > 0
        ? { ...server, ...draft.marks }
        : server

    setStudentName(
      presentes.find((p) => p.id === Number(participantId))?.nome ?? null
    )
    setQuestions(qs)
    setServerMarks(server)
    setMarks(merged)

    const total = qs.length
    const qParam = parseInt(searchParams.get("q") ?? "", 10)
    let start = 0
    if (qParam >= 1 && qParam <= total) {
      start = qParam - 1
    } else if (
      draft.lastQ !== null &&
      draft.lastQ >= 1 &&
      draft.lastQ <= total
    ) {
      start = draft.lastQ - 1
    } else {
      const firstBlank = qs.findIndex((q) => !merged[q.id])
      start = firstBlank >= 0 ? firstBlank : 0
    }
    setIndex(total > 0 ? start : -1)
    if (total > 0) {
      router.replace(`?q=${start + 1}`, { scroll: false })
      try {
        localStorage.setItem(
          lsKey(examId, participantId),
          JSON.stringify({ marks: merged, lastQ: start + 1 })
        )
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, loading, error, rawQuestions, answerRows, presentes])

  if (!ready) return null

  const total = questions.length
  const current = index >= 0 && index < total ? questions[index] : null
  const answered = questions.filter((q) => marks[q.id]).length
  const blanks = questions.filter((q) => !marks[q.id])
  const sending = bulkAnswers.isPending

  function persist(next: Record<number, string>, lastQ: number) {
    try {
      localStorage.setItem(
        lsKey(examId, participantId),
        JSON.stringify({ marks: next, lastQ })
      )
    } catch {}
  }

  function go(n: number) {
    const clamped = Math.max(0, Math.min(total - 1, n))
    setIndex(clamped)
    setFeedback(null)
    router.replace(`?q=${clamped + 1}`, { scroll: false })
    persist(marks, clamped + 1)
    window.scrollTo(0, 0)
  }

  function tap(letra: string) {
    if (!current || sending) return
    const next = { ...marks, [current.id]: letra }
    setMarks(next)
    setFeedback(null)
    if (index < total - 1) {
      const nxt = index + 1
      setIndex(nxt)
      router.replace(`?q=${nxt + 1}`, { scroll: false })
      persist(next, nxt + 1)
    } else {
      persist(next, index + 1)
    }
    window.scrollTo(0, 0)
  }

  function discardDraft() {
    setMarks(serverMarks)
    setFeedback(null)
    try {
      localStorage.removeItem(lsKey(examId, participantId))
    } catch {}
  }

  function send() {
    if (sending) return
    setFeedback(null)
    const payload = questions
      .filter((q) => marks[q.id])
      .map((q) => ({
        userId: Number(participantId),
        questId: q.id,
        alternativa: marks[q.id],
      }))
    bulkAnswers.mutate(payload, {
      onSuccess: () => {
        try {
          localStorage.removeItem(lsKey(examId, participantId))
        } catch {}
        setServerMarks({ ...marks })
        setConfirmOpen(false)
        setFeedback({
          kind: "success",
          message: `Enviadas ${payload.length} respostas.`,
        })
        setTimeout(() => router.push(`/manage/aplicar/${examId}`), 1200)
      },
      onError: (e) => {
        setConfirmOpen(false)
        setFeedback({
          kind: "error",
          message:
            e instanceof Error ? `Erro ao enviar: ${e.message}` : "Erro ao enviar.",
        })
      },
    })
  }

  return (
    <div className="flex min-h-[calc(100svh-6rem)] flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/manage/aplicar/${examId}`}
          className="text-sm text-read-gray hover:text-read-green"
        >
          ‹ Alunos
        </Link>
        {studentName && (
          <span className="truncate text-sm font-medium text-read-white">
            {studentName}
          </span>
        )}
      </div>

      {loading && <p className="text-sm text-read-gray">Carregando prova…</p>}

      {!loading && error && (
        <p className="text-sm text-red-400">Não foi possível carregar a prova.</p>
      )}

      {!loading && !error && total === 0 && (
        <p className="text-sm text-read-gray">
          Nenhuma questão cadastrada para esta prova.
        </p>
      )}

      {!loading && !error && current && (
        <>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-read-ink">
              <div
                className="h-full rounded-full bg-read-green transition-all"
                style={{ width: `${total ? (answered / total) * 100 : 0}%` }}
              />
            </div>
            <Badge
              className={`tabular-nums ${
                total > 0 && answered === total
                  ? "bg-read-green text-read-logo-dark"
                  : "bg-read-ink text-read-gray"
              }`}
            >
              {answered}/{total}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => go(index - 1)}
              disabled={index <= 0}
              className="h-10 w-10 shrink-0 text-read-gray hover:bg-read-ink hover:text-read-green disabled:opacity-30"
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Anterior</span>
            </Button>
            <select
              value={index}
              onChange={(e) => go(Number(e.target.value))}
              aria-label="Ir para questão"
              className="h-10 min-w-0 flex-1 rounded-lg border border-read-ink bg-read-ink-dark px-2 text-center text-lg font-bold text-read-white focus:border-read-green focus:outline-none"
            >
              {questions.map((q, i) => (
                <option key={q.id} value={i}>
                  Questão {q.numero}
                  {marks[q.id] ? ` — ${marks[q.id]}` : ""}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => go(index + 1)}
              disabled={index >= total - 1}
              className="h-10 w-10 shrink-0 text-read-gray hover:bg-read-ink hover:text-read-green disabled:opacity-30"
            >
              <ChevronRight className="h-6 w-6" />
              <span className="sr-only">Próxima</span>
            </Button>
          </div>

          <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-2.5">
            {LETRAS.map((letra) => {
              const selected = marks[current.id] === letra
              return (
                <button
                  key={letra}
                  type="button"
                  onClick={() => tap(letra)}
                  disabled={sending}
                  className={`flex h-full min-h-28 items-center justify-center rounded-xl border text-4xl font-bold transition-colors disabled:opacity-70 ${
                    selected
                      ? "border-read-green bg-read-green text-read-logo-dark"
                      : "border-read-ink bg-read-ink-dark text-read-white active:bg-read-ink"
                  }`}
                >
                  {letra}
                </button>
              )
            })}
          </div>

          {feedback && (
            <p
              className={`text-sm ${
                feedback.kind === "error" ? "text-red-400" : "text-read-green"
              }`}
            >
              {feedback.message}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={discardDraft}
              className="text-xs text-read-gray hover:bg-read-ink hover:text-red-400"
            >
              Descartar rascunho
            </Button>
            <Button
              onClick={() => {
                if (blanks.length > 0) setConfirmOpen(true)
                else send()
              }}
              disabled={sending || answered === 0}
              className="ml-auto bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white disabled:opacity-50"
            >
              {sending ? "Enviando…" : `Enviar (${answered}/${total})`}
            </Button>
          </div>
        </>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-read-ink-dark border-read-ink text-read-white">
          <DialogHeader>
            <DialogTitle className="text-read-white">
              Enviar com {blanks.length}{" "}
              {blanks.length === 1 ? "branca" : "brancas"}?
            </DialogTitle>
            <DialogDescription className="text-read-gray">
              Sem resposta:{" "}
              {blanks.map((q) => `Q${q.numero}`).join(", ")}. Elas não serão
              enviadas — volte para preenchê-las ou confirme o envio parcial.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-read-ink bg-transparent">
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={sending}
              className="text-read-gray hover:bg-read-ink hover:text-read-white"
            >
              Voltar
            </Button>
            <Button
              onClick={send}
              disabled={sending}
              className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
            >
              {sending ? "Enviando…" : "Enviar assim mesmo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
