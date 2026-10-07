import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { authAxiosRequest } from "@/lib/api"
import type { ParticipantPayload } from "@/lib/participant-schema"
import {
  buildListParams,
  DEFAULT_LIST_LIMIT,
  fetchAllPaginatedAuth,
  type ListQueryParams,
  type PaginatedMeta,
  type PaginatedResponse,
} from "@/lib/pagination-types"

export type ExamParticipant = {
  id: number
  nome: string
  consultaCode: string
  presenca: boolean
}

export function examParticipantsQueryKey(examId: string) {
  return ["exam-participants", examId] as const
}

export type ParticipantsListParams = Pick<ListQueryParams, "page" | "limit" | "search">

export async function getExamParticipants(
  examId: string,
  params: ParticipantsListParams,
  signal?: AbortSignal
): Promise<PaginatedResponse<ExamParticipant>> {
  return authAxiosRequest<PaginatedResponse<ExamParticipant>>(
    "GET",
    `/exams/${examId}/participants`,
    {
      signal,
      params: buildListParams({
        page: params.page ?? 1,
        limit: params.limit ?? DEFAULT_LIST_LIMIT,
        search: params.search,
      }),
    }
  )
}

export async function fetchAllExamParticipants(
  examId: string,
  signal?: AbortSignal
): Promise<ExamParticipant[]> {
  return fetchAllPaginatedAuth<ExamParticipant>(
    `/exams/${examId}/participants`,
    {},
    signal
  )
}

export async function bulkCreateParticipants(
  examId: string,
  participants: ParticipantPayload[]
): Promise<void> {
  await authAxiosRequest("POST", `/exams/${examId}/participants/bulk`, {
    data: { participants },
  })
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

const emptyMeta: PaginatedMeta = {
  page: 1,
  limit: DEFAULT_LIST_LIMIT,
  total: 0,
  totalPages: 0,
}

export function useExamParticipants(examId: string, params: ParticipantsListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? DEFAULT_LIST_LIMIT
  const search = params.search?.trim() || undefined

  const query = useQuery({
    queryKey: [...examParticipantsQueryKey(examId), { page, limit, search }],
    queryFn: ({ signal }) =>
      getExamParticipants(examId, { page, limit, search }, signal),
    enabled: Boolean(examId),
    placeholderData: keepPreviousData,
  })

  return {
    ...query,
    data: query.data?.data ?? [],
    meta: query.data?.meta ?? emptyMeta,
  }
}

export function useBulkCreateParticipants(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (participants: ParticipantPayload[]) =>
      bulkCreateParticipants(examId, participants),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examParticipantsQueryKey(examId) })
      queryClient.invalidateQueries({
        queryKey: [...examParticipantsQueryKey(examId), "presentes-count"],
      })
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
      await queryClient.cancelQueries({ queryKey: examParticipantsQueryKey(examId) })
      const previous = queryClient.getQueriesData<PaginatedResponse<ExamParticipant>>({
        queryKey: examParticipantsQueryKey(examId),
      })
      for (const [key, cached] of previous) {
        if (!cached) continue
        queryClient.setQueryData<PaginatedResponse<ExamParticipant>>(key, {
          ...cached,
          data: cached.data.map((p) =>
            p.id === id ? { ...p, presenca } : p
          ),
        })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data)
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: examParticipantsQueryKey(examId) })
      queryClient.invalidateQueries({
        queryKey: [...examParticipantsQueryKey(examId), "presentes-count"],
      })
    },
  })
}

export function useExamParticipantsPresentesCount(examId: string) {
  return useQuery({
    queryKey: [...examParticipantsQueryKey(examId), "presentes-count"],
    queryFn: ({ signal }) =>
      fetchAllExamParticipants(examId, signal).then(
        (list) => list.filter((p) => p.presenca).length
      ),
    enabled: Boolean(examId),
  })
}

export function useDeleteParticipant(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (participantId: number) =>
      deleteParticipant(examId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examParticipantsQueryKey(examId) })
      queryClient.invalidateQueries({
        queryKey: [...examParticipantsQueryKey(examId), "presentes-count"],
      })
    },
  })
}
