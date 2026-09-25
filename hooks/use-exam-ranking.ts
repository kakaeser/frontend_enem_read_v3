import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { axiosHttp } from "@/lib/api"
import type { RankingResponse } from "@/lib/ranking-types"
import type { StudentDetail } from "@/lib/student-detail"

export function examRankingQueryKey(examId: string) {
  return ["exan-ranking", examId] as const
}

export class ResultadosBlockError extends Error {
  constructor() {
    super("Resultados indisponiveis")
    this.name = "ResultadosBlockError"
  }
}

export async function getExamRanking(
  examId: string,
  signal?: AbortSignal
): Promise<RankingResponse> {
  const { data, status } = await axiosHttp<RankingResponse>(
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

export async function getParticipantResult(
  examId: string,
  participantId: number,
  signal?: AbortSignal
): Promise<StudentDetail> {
  const { data, status } = await axiosHttp<StudentDetail>(
    "GET",
    `/resultados/${examId}/${participantId}`,
    { signal, auth: false }
  )
  if (status === 403) throw new ResultadosBlockError()
  if (status < 200 || status >= 300) {
    throw new Error(
      "Não foi possivel carregar as respostas desse participante"
    )
  }
  return data
}

export function useExamRanking(examId: string) {
  return useQuery<RankingResponse, Error>({
    queryKey: examRankingQueryKey(examId),
    queryFn: ({ signal }) => getExamRanking(examId, signal),
    enabled: Boolean(examId),
  })
}
