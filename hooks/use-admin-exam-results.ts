import { useQuery } from "@tanstack/react-query"
import { authAxiosRequest } from "@/lib/api"
import type { RankingResponse } from "@/lib/ranking-types"

export function adminExamResultsQueryKey(examId: string) {
  return ["exam-admin-results", examId] as const
}

export async function getAdminExamResults(
  examId: string,
  signal?: AbortSignal
): Promise<RankingResponse> {
  return authAxiosRequest<RankingResponse>(
    "GET",
    `/exams/${examId}/results`,
    { signal }
  )
}

export function useAdminExamResults(examId: string) {
  return useQuery<RankingResponse, Error>({
    queryKey: adminExamResultsQueryKey(examId),
    queryFn: ({ signal }) => getAdminExamResults(examId, signal),
    enabled: Boolean(examId),
  })
}
