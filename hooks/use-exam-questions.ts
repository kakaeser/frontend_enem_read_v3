import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminExamResultsQueryKey } from "@/hooks/use-admin-exam-results"
import { examDetailQueryKey } from "@/hooks/use-exam-detail"
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

export function useExamQuestions(examId: string, enabled = true) {
  return useQuery<ExamQuestion[], Error>({
    queryKey: examQuestionsQueryKey(examId),
    queryFn: ({ signal }) => getExamQuestions(examId, signal),
    enabled: Boolean(examId) && enabled,
  })
}

function useInvalidateExamQuestionsRelated(examId: string) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: examQuestionsQueryKey(examId) })
    queryClient.invalidateQueries({ queryKey: examDetailQueryKey(examId) })
    queryClient.invalidateQueries({
      queryKey: adminExamResultsQueryKey(examId),
    })
  }
}

export function useBulkUpsertExamQuestions(examId: string) {
  const invalidateRelated = useInvalidateExamQuestionsRelated(examId)
  return useMutation({
    mutationFn: (questions: QuestionBulkPayload[]) =>
      bulkUpsertExamQuestions(examId, questions),
    onSuccess: () => {
      invalidateRelated()
    },
  })
}

export function useDeleteExamQuestion(examId: string) {
  const invalidateRelated = useInvalidateExamQuestionsRelated(examId)
  return useMutation({
    mutationFn: (questionId: number) => deleteExamQuestion(examId, questionId),
    onSuccess: () => {
      invalidateRelated()
    },
  })
}
