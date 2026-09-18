import * as XLSX from "xlsx"
import type { RankingEntry } from "./ranking-types"

function round1(v: number): number {
  return Math.round(v * 10) / 10
}

// Gera o .xlsx do ranking (1 aba). 100% local, sem backend.
export function buildRankingWorkbook(ranking: RankingEntry[]): Blob {
  const rows = ranking.map((r, i) => ({
    Posição: i + 1,
    Aluno: r.nome,
    Ponderada: round1(r.ponderada),
    Redação: r.redacao ?? "",
    Total: r.respondidas === 0 && r.redacao == null ? "" : round1(r.total),
    Acertos: r.acertos,
    Respondidas: `${r.respondidas}/${r.totalQuestoes}`,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws["!cols"] = [
    { wch: 8 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 8 },
    { wch: 12 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Ranking")
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}

export function downloadRankingExcel(ranking: RankingEntry[], examNome: string) {
  const blob = buildRankingWorkbook(ranking)
  const date = new Date().toISOString().slice(0, 10)
  const safeName = examNome.replace(/[\\/:*?"<>|]/g, "-").trim() || "prova"
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `ranking-${safeName}-${date}.xlsx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
