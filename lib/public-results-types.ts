export type PublicTop15Entry = {
  posicao: number
  nome: string
}

export type PublicExamResults = {
  exam: {
    id: number
    nome: string
    status: string
    encerramento: string | null
  }
  top15: PublicTop15Entry[]
  stats: {
    totalParticipantes: number
    media: number
    maior: number
    menor: number
  }
}
