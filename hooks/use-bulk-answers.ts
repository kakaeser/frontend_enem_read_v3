import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authAxiosRequest } from "@/lib/api"
import { examPresentesQueryKey } from "@/hooks/use-presentes"
import { participantAnswersQueryKey } from "@/hooks/use-participant-answers"

export type BulkAnswerPayload = {
  userId: number
  questId: number
  alternativa: string
}

export async function submitBulkAnswers(
  examId: string,
  answers: BulkAnswerPayload[]
): Promise<void> {
  await authAxiosRequest("POST", `/exams/${examId}/answers/bulk`, {
    data: { answers },
  })
}

export function useBulkAnswers(examId: string, participantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (answers: BulkAnswerPayload[]) =>
      submitBulkAnswers(examId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examPresentesQueryKey(examId) })
      queryClient.invalidateQueries({
        queryKey: participantAnswersQueryKey(examId, participantId),
      })
    },
  })
}
