export type RankingEntry = {
  participantId: number
  nome: string
  ponderada: number
  redacao: number | null
  total: number
  acertos: number
  respondidas: number
  totalQuestoes: number
}

export type RankingStats = {
  totalParticipantes: number
  media: number
  maior: number
  menor: number
}

export type RankingResponse = {
  exam: {
    id: number
    nome: string
    status: string
    encerramento: string | null
  }
  ranking: RankingEntry[]
  stats: RankingStats & { acertosPorQuestao: unknown[] }
}
