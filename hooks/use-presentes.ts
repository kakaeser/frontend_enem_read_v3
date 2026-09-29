import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { authAxiosRequest } from "@/lib/api"
import { patchParticipantRedacao } from "@/hooks/use-student-detail"

export type ExamPresente = {
  id: number
  nome: string
  redacaoNota?: number | null
  _count?: { answers: number }
}

export function examPresentesQueryKey(examId: string) {
  return ["exam-presentes", examId] as const
}

export async function getExamPresentes(
  examId: string,
  signal?: AbortSignal
): Promise<ExamPresente[]> {
  const data = await authAxiosRequest<ExamPresente[]>(
    "GET",
    `/exams/${examId}/participants/presentes`,
    { signal }
  )
  return Array.isArray(data) ? data : []
}

export function useExamPresentes(examId: string, enabled = true) {
  return useQuery<ExamPresente[], Error>({
    queryKey: examPresentesQueryKey(examId),
    queryFn: ({ signal }) => getExamPresentes(examId, signal),
    enabled: Boolean(examId) && enabled,
  })
}

export function usePatchPresenteRedacao(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      participantId,
      redacaoNota,
    }: {
      participantId: number
      redacaoNota: number | null
    }) => patchParticipantRedacao(examId, participantId, redacaoNota),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examPresentesQueryKey(examId) })
    },
  })
}
