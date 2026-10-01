import { useQuery } from "@tanstack/react-query"
import { axiosHttp } from "@/lib/api"
import type { PublicExamResults } from "@/lib/public-results-types"

export function examRankingQueryKey(examId: string) {
  return ["exam-public-results", examId] as const
}

export class ResultadosBlockError extends Error {
  constructor() {
    super("Resultados indisponiveis")
    this.name = "ResultadosBlockError"
  }
}

export async function getPublicExamResults(
  examId: string,
  signal?: AbortSignal
): Promise<PublicExamResults> {
  const { data, status } = await axiosHttp<PublicExamResults>(
    "GET",
    `/resultados/${examId}`,
    { signal, auth: false }
  )
  if (status === 403) throw new ResultadosBlockError()
  if (status < 200 || status >= 300) {
    throw new Error("Não foi possivel carregar o ranking")
  }
  return data
}

export function useExamRanking(examId: string) {
  return useQuery<PublicExamResults, Error>({
    queryKey: examRankingQueryKey(examId),
    queryFn: ({ signal }) => getPublicExamResults(examId, signal),
    enabled: Boolean(examId),
  })
}
