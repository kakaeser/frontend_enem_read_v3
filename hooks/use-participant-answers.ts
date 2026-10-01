import { useQuery } from "@tanstack/react-query"
import { authAxiosRequest } from "@/lib/api"

export type ParticipantAnswer = {
  questId: number
  alternativa: string
}

export function participantAnswersQueryKey(
  examId: string,
  participantId: string
) {
  return ["participant-answers", examId, participantId] as const
}

export async function getParticipantAnswers(
  examId: string,
  participantId: string,
  signal?: AbortSignal
): Promise<ParticipantAnswer[]> {
  const data = await authAxiosRequest<ParticipantAnswer[]>(
    "GET",
    `/exams/${examId}/answers/participant/${participantId}`,
    { signal }
  )
  return Array.isArray(data) ? data : []
}

export function useParticipantAnswers(
  examId: string,
  participantId: string,
  enabled = true
) {
  return useQuery<ParticipantAnswer[], Error>({
    queryKey: participantAnswersQueryKey(examId, participantId),
    queryFn: ({ signal }) =>
      getParticipantAnswers(examId, participantId, signal),
    enabled: Boolean(examId && participantId) && enabled,
  })
}
