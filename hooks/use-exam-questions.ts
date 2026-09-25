import { useMutation, useQuery } from "@tanstack/react-query"
import { authAxiosRequest } from "@/lib/api"
import type { QuestionBulkPayload } from "@/lib/question-schema"

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
  const data = await authAxiosRequest<ExamQuestion[]>(
    "GET",
    `/exams/${examId}/questions`,
    { signal }
  )
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
