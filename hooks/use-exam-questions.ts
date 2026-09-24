import { useMutation, useQuery } from "@tanstack/react-query"
import axios from "axios"
import { authAxiosRequest } from "@/lib/auth-axios"
import type { QuestionBulkPayload } from "@/lib/question-schema"

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"

export type ExamQuestion = {
  id: number
  numero: number
  enunciado: string
  alternativas: unknown
  correctAnswer: string
  peso: number
}

export function examQuestionsQueryKey(examId: string) {
  return ["exam-questions", examId] as const
}

export async function getExamQuestions(
  examId: string,
  signal?: AbortSignal
): Promise<ExamQuestion[]> {
  const { data, status } = await axios.get<ExamQuestion[]>(
    `${base}/exams/${examId}/questions`,
    { signal, validateStatus: (s) => s < 500 }
  )
  if (status < 200 || status >= 300) {
    throw new Error("Não foi possível carregar as questões.")
  }
  return Array.isArray(data) ? data : []
}

export async function bulkUpsertExamQuestions(
  examId: string,
  questions: QuestionBulkPayload[]
): Promise<ExamQuestion[]> {
  return authAxiosRequest<ExamQuestion[]>(
    "PUT",
    `/exams/${examId}/questions/bulk`,
    { data: { questions } }
  )
}

export async function deleteExamQuestion(
  examId: string,
  questionId: number
): Promise<void> {
  await authAxiosRequest("DELETE", `/exams/${examId}/questions/${questionId}`)
}

export function useExamQuestions(examId: string) {
  return useQuery<ExamQuestion[], Error>({
    queryKey: examQuestionsQueryKey(examId),
    queryFn: ({ signal }) => getExamQuestions(examId, signal),
    enabled: Boolean(examId),
  })
}

export function useBulkUpsertExamQuestions(examId: string) {
  return useMutation({
    mutationFn: (questions: QuestionBulkPayload[]) =>
      bulkUpsertExamQuestions(examId, questions),
  })
}

export function useDeleteExamQuestion(examId: string) {
  return useMutation({
    mutationFn: (questionId: number) => deleteExamQuestion(examId, questionId),
  })
}
