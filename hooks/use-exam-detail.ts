import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { authAxiosRequest } from "@/lib/api"
import { adminExamResultsQueryKey } from "@/hooks/use-admin-exam-results"
import { examsQueryKey } from "@/hooks/use-exams"
import type { ExamPayload } from "@/lib/exam-schema"

export type ExamDetail = {
  nome: string
  notaSimbolica: number
  questions?: unknown[]
  _count?: { questions?: number; participants?: number }
}

export function examDetailQueryKey(examId: string) {
  return ["exam-detail", examId] as const
}

export async function getExamDetail(
  examId: string,
  signal?: AbortSignal
): Promise<ExamDetail> {
  return authAxiosRequest<ExamDetail>("GET", `/exams/${examId}`, { signal })
}

export function useExamDetail(examId: string, enabled = true) {
  return useQuery<ExamDetail, Error>({
    queryKey: examDetailQueryKey(examId),
    queryFn: ({ signal }) => getExamDetail(examId, signal),
    enabled: Boolean(examId) && enabled,
  })
}

export async function updateExam(
  examId: string,
  payload: ExamPayload
): Promise<void> {
  await authAxiosRequest("PATCH", `/exams/${examId}`, { data: payload })
}

export async function deleteExam(examId: string): Promise<void> {
  await authAxiosRequest("DELETE", `/exams/${examId}`)
}

export function useUpdateExam(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExamPayload) => updateExam(examId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examDetailQueryKey(examId) })
      queryClient.invalidateQueries({ queryKey: examsQueryKey })
      queryClient.invalidateQueries({
        queryKey: adminExamResultsQueryKey(examId),
      })
    },
  })
}

export function useDeleteExam(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteExam(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examsQueryKey })
    },
  })
}

export function examDetailCounts(data: ExamDetail | undefined) {
  if (!data) return null
  return {
    questions: Array.isArray(data.questions)
      ? data.questions.length
      : (data._count?.questions ?? 0),
    participants: data._count?.participants ?? 0,
  }
}
