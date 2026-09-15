"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { authFetch } from "@/lib/auth-fetch"
import { participantSchema } from "@/lib/participant-schema"

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"

export function AddParticipantsDialog({
  examId,
  onAdded,
}: {
  examId: string
  onAdded?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const names = text
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean)
    if (names.length === 0) {
      setError("Digite ao menos um nome (um por linha).")
      return
    }
    const invalid = names.filter(
      (n) => !participantSchema.safeParse({ nome: n }).success
    )
    if (invalid.length > 0) {
      setError(
        `Nomes com menos de 2 caracteres: ${invalid.slice(0, 3).join(", ")}${
          invalid.length > 3 ? ` (+${invalid.length - 3})` : ""
        }`
      )
      return
    }
    setLoading(true)
    try {
      const res = await authFetch(
        base,
        `${base}/exams/${examId}/participants/bulk`,
        {
          method: "POST",
          body: JSON.stringify({ participants: names.map((nome) => ({ nome })) }),
        }
      )
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.message ?? "Erro ao adicionar participantes")
      }
      setOpen(false)
      setText("")
      onAdded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white">
            Adicionar
          </Button>
        }
      />
      <DialogContent className="bg-read-darkest border-read-ink">
        <DialogHeader>
          <DialogTitle className="text-read-white">
            Adicionar participantes
          </DialogTitle>
          <DialogDescription className="text-read-gray">
            Um nome por linha. Todos entram como presentes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nomes" className="text-read-white">
                Nomes
              </FieldLabel>
              <textarea
                id="nomes"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder={"Ana Silva\nBruno Souza\nCarla Lima"}
                className="min-h-32 w-full rounded-lg border border-read-ink bg-read-ink-dark px-3 py-2 text-sm text-read-white placeholder:text-read-gray/40 focus:border-read-green focus:outline-none"
              />
            </Field>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-read-ink bg-transparent text-read-white hover:bg-read-ink"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white"
            >
              {loading ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
