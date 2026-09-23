export type DetailQuestao = {
  numero: number
  enunciado: string
  alternativas: { letra: string; texto: string }[]
  correctAnswer: string
  marcada: string
  acertou: boolean
  peso: number
}

export type StudentDetail = {
  participant: { id: number; nome: string; presenca?: boolean }
  notas: { ponderada: number; redacao: number | null; total: number }
  questoes: DetailQuestao[]
}
