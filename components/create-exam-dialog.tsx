"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authAxiosRequest } from "@/lib/api"

export function CreateExamDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState("")
  const [qtdQuestoes, setQtdQuestoes] = useState(70)
  const [notaSimbolica, setNotaSimbolica] = useState(1000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!nome.trim() || qtdQuestoes < 1) {
      setError("Informe nome e quantidade válida.")
      return
    }
    setLoading(true)
    try {
      await authAxiosRequest("POST", "/exams", {
        data: { nome: nome.trim(), qtdQuestoes, notaSimbolica },
      })
      setOpen(false)
      setNome("")
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white">Criar prova</Button>} />
      <DialogContent className="bg-read-darkest border-read-ink">
        <DialogHeader>
          <DialogTitle className="text-read-white">Nova prova</DialogTitle>
          <DialogDescription className="text-read-gray">Cria a prova e gera {qtdQuestoes} questões vazias.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nome" className="text-read-white">Nome</FieldLabel>
              <Input id="nome" placeholder="ex: ENEM 2025" value={nome} onChange={(e) => setNome(e.target.value)} required className="border-read-ink bg-read-ink-dark text-read-white placeholder:text-read-gray/10 focus-visible:ring-read-green"/>
            </Field>
            <Field>
              <FieldLabel htmlFor="qtd" className="text-read-white">Qtd. questões</FieldLabel>
              <Input id="qtd" type="number" min={1} value={qtdQuestoes} onChange={(e) => setQtdQuestoes(Number(e.target.value))} required className="border-read-ink bg-read-ink-dark text-read-white focus-visible:ring-read-green" />
            </Field>
            <Field>
              <FieldLabel htmlFor="nota" className="text-read-white">Nota simbólica</FieldLabel>
              <Input id="nota" type="number" value={notaSimbolica} onChange={(e) => setNotaSimbolica(Number(e.target.value))} className="border-read-ink bg-read-ink-dark text-read-white focus-visible:ring-read-green" />
            </Field>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-read-ink bg-transparent text-read-white hover:bg-read-ink">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white">
              {loading ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
