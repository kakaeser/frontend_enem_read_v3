import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { StudentDetail } from "@/lib/student-detail"
import { authAxiosRequest } from "@/lib/api"
import { adminExamResultsQueryKey } from "@/hooks/use-admin-exam-results"

export type StudentDetailSource = "admin"

export function studentDetailQueryKey(
  examId: string,
  participantId: number
) {
  return ["student-detail", "admin", examId, participantId] as const
}

async function getAdminParticipantResult(
  examId: string,
  participantId: number,
  signal?: AbortSignal
): Promise<StudentDetail> {
  return authAxiosRequest<StudentDetail>(
    "GET",
    `/exams/${examId}/results/${participantId}`,
    { signal }
  )
}

export function useStudentDetail(
  examId: string,
  participantId: number | null,
  options?: { enabled?: boolean }
) {
  return useQuery<StudentDetail, Error>({
    queryKey: studentDetailQueryKey(examId, participantId ?? 0),
    queryFn: ({ signal }) =>
      getAdminParticipantResult(examId, participantId!, signal),
    enabled:
      (options?.enabled ?? true) &&
      participantId !== null &&
      Boolean(examId),
  })
}

export async function patchParticipantRedacao(
  examId: string,
  participantId: number,
  redacaoNota: number | null
): Promise<void> {
  await authAxiosRequest("PATCH", `/exams/${examId}/participants/${participantId}/redacao`, {
    data: { redacaoNota },
  })
}

export function usePatchParticipantRedacao(
  examId: string,
  participantId: number | null,
  options?: { onSuccess?: () => void }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (redacaoNota: number | null) => {
      if (participantId === null) {
        throw new Error("Nenhum participante selecionado.")
      }
      return patchParticipantRedacao(examId, participantId, redacaoNota)
    },
    onSuccess: () => {
      if (participantId !== null) {
        queryClient.invalidateQueries({
          queryKey: studentDetailQueryKey(examId, participantId),
        })
      }
      queryClient.invalidateQueries({ queryKey: adminExamResultsQueryKey(examId) })
      options?.onSuccess?.()
    },
  })
}

export function studentDetailFromRanking(
  detail: StudentDetail
): import("@/lib/ranking-types").RankingEntry {
  const acertos = detail.questoes.filter((q) => q.acertou).length
  return {
    participantId: detail.participant.id,
    nome: detail.participant.nome,
    ponderada: detail.notas.ponderada,
    redacao: detail.notas.redacao,
    total: detail.notas.total,
    acertos,
    respondidas: detail.questoes.length,
    totalQuestoes: detail.questoes.length,
  }
}
