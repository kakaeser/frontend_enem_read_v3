import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { StudentDetail } from "@/lib/student-detail"
import { authAxiosRequest } from "@/lib/api"
import { examRankingQueryKey, getParticipantResult } from "@/hooks/use-exam-ranking"

export type StudentDetailSource = "public" | "admin"

export function studentDetailQueryKey(
  source: StudentDetailSource,
  examId: string,
  participantId: number
) {
  return ["student-detail", source, examId, participantId] as const
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

export async function fetchStudentDetail(
  source: StudentDetailSource,
  examId: string,
  participantId: number,
  signal?: AbortSignal
): Promise<StudentDetail> {
  if (source === "public") {
    return getParticipantResult(examId, participantId, signal)
  }
  return getAdminParticipantResult(examId, participantId, signal)
}

export function useStudentDetail(
  source: StudentDetailSource,
  examId: string,
  participantId: number | null
) {
  return useQuery<StudentDetail, Error>({
    queryKey: studentDetailQueryKey(
      source,
      examId,
      participantId ?? 0
    ),
    queryFn: ({ signal }) =>
      fetchStudentDetail(source, examId, participantId!, signal),
    enabled: participantId !== null && Boolean(examId),
  })
}

async function patchParticipantRedacao(
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
          queryKey: studentDetailQueryKey("admin", examId, participantId),
        })
      }
      queryClient.invalidateQueries({ queryKey: examRankingQueryKey(examId) })
      options?.onSuccess?.()
    },
  })
}
