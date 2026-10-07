import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchAllPaginatedAuth } from "@/lib/pagination-types"
import { patchParticipantRedacao } from "@/hooks/use-student-detail"

export type ExamPresente = {
  id: number
  nome: string
  redacaoNota?: number | null
  presenca?: boolean
  _count?: { answers: number }
}

export function examPresentesQueryKey(examId: string) {
  return ["exam-presentes", examId] as const
}

export async function getExamPresentes(
  examId: string,
  signal?: AbortSignal
): Promise<ExamPresente[]> {
  return fetchAllPaginatedAuth<ExamPresente>(
    `/exams/${examId}/participants/presentes`,
    {},
    signal
  )
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
