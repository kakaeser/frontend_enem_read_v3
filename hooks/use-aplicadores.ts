import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { authAxiosRequest } from "@/lib/api"

export type AplicadorRow = {
  id: number
  nome: string
  status: string
}

export type AplicadorStatus = "APROVADO" | "REJEITADO"

export function aplicadoresQueryKey(examId: string) {
  return ["aplicadores", examId] as const
}

export async function getAplicadores(
  examId: string,
  signal?: AbortSignal
): Promise<AplicadorRow[]> {
  const data = await authAxiosRequest<AplicadorRow[]>(
    "GET",
    `/aplicadores?provaId=${examId}`,
    { signal }
  )
  return Array.isArray(data) ? data : []
}

export function useAplicadores(examId: string, enabled = true) {
  return useQuery<AplicadorRow[], Error>({
    queryKey: aplicadoresQueryKey(examId),
    queryFn: ({ signal }) => getAplicadores(examId, signal),
    enabled: Boolean(examId) && enabled,
  })
}

export async function updateAplicadorStatus(
  id: number,
  status: AplicadorStatus
): Promise<AplicadorRow> {
  return authAxiosRequest<AplicadorRow>("PATCH", `/aplicadores/${id}/status`, {
    data: { status },
  })
}

export function useUpdateAplicadorStatus(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: AplicadorStatus }) =>
      updateAplicadorStatus(id, status),
    onMutate: async ({ id, status }) => {
      const key = aplicadoresQueryKey(examId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<AplicadorRow[]>(key)
      queryClient.setQueryData<AplicadorRow[]>(key, (old) =>
        old?.map((a) => (a.id === id ? { ...a, status } : a)) ?? []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(aplicadoresQueryKey(examId), context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: aplicadoresQueryKey(examId) })
    },
  })
}
