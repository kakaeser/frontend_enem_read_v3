import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { authAxiosRequest } from "@/lib/auth-axios"
import type { ParticipantPayload } from "@/lib/participant-schema"

export type ExamParticipant = {
  id: number
  nome: string
  presenca: boolean
}

export function examParticipantsQueryKey(examId: string) {
  return ["exam-participants", examId] as const
}

export async function getExamParticipants(
  examId: string,
  signal?: AbortSignal
): Promise<ExamParticipant[]> {
  const data = await authAxiosRequest<ExamParticipant[]>(
    "GET",
    `/exams/${examId}/participants`,
    { signal }
  )
  return Array.isArray(data) ? data : []
}

export async function bulkCreateParticipants(
  examId: string,
  participants: ParticipantPayload[]
): Promise<ExamParticipant[]> {
  return authAxiosRequest<ExamParticipant[]>(
    "POST",
    `/exams/${examId}/participants/bulk`,
    { data: { participants } }
  )
}

export async function updateParticipantPresenca(
  examId: string,
  participantId: number,
  presenca: boolean
): Promise<void> {
  await authAxiosRequest("PATCH", `/exams/${examId}/participants/${participantId}/presenca`, {
    data: { presenca },
  })
}

export async function deleteParticipant(
  examId: string,
  participantId: number
): Promise<void> {
  await authAxiosRequest("DELETE", `/exams/${examId}/participants/${participantId}`)
}

export function useExamParticipants(examId: string) {
  return useQuery<ExamParticipant[], Error>({
    queryKey: examParticipantsQueryKey(examId),
    queryFn: ({ signal }) => getExamParticipants(examId, signal),
    enabled: Boolean(examId),
  })
}

export function useBulkCreateParticipants(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (participants: ParticipantPayload[]) =>
      bulkCreateParticipants(examId, participants),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examParticipantsQueryKey(examId) })
    },
  })
}

export function useUpdateParticipantPresenca(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      presenca,
    }: {
      id: number
      presenca: boolean
    }) => updateParticipantPresenca(examId, id, presenca),
    onMutate: async ({ id, presenca }) => {
      const key = examParticipantsQueryKey(examId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ExamParticipant[]>(key)
      queryClient.setQueryData<ExamParticipant[]>(key, (old) =>
        old?.map((p) => (p.id === id ? { ...p, presenca } : p)) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(examParticipantsQueryKey(examId), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: examParticipantsQueryKey(examId) })
    },
  })
}

export function useDeleteParticipant(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (participantId: number) =>
      deleteParticipant(examId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examParticipantsQueryKey(examId) })
    },
  })
}
