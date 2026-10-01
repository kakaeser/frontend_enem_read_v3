import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authAxiosRequest } from "@/lib/api"
import { adminExamResultsQueryKey } from "@/hooks/use-admin-exam-results"
import { examsQueryKey } from "@/hooks/use-exams"

export type ExamStatus = "draft" | "in_progress" | "completed"

export async function updateExamStatus(
  examId: string,
  status: ExamStatus
): Promise<void> {
  await authAxiosRequest("PATCH", `/exams/${examId}/status`, {
    data: { status },
  })
}

export function useUpdateExamStatus(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status: ExamStatus) => updateExamStatus(examId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminExamResultsQueryKey(examId),
      })
      queryClient.invalidateQueries({ queryKey: examsQueryKey })
    },
  })
}
