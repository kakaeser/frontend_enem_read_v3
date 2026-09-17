import type { RankingEntry } from "./ranking-types"

export function formatTotal(
  e: Pick<RankingEntry, "respondidas" | "redacao" | "total">
): string {
  if (e.respondidas === 0 && e.redacao == null) return "—"
  return e.total.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
}

export function formatNum(v: number): string {
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
}
