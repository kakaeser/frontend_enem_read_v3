import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import axios from "axios"
import type { RankingResponse } from "@/lib/ranking-types"
import type { StudentDetail } from "@/lib/student-detail"

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"

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
        const { data, status } = await axios.get<RankingResponse>(`${base}/resultados/${examId}`, 
            { signal, validateStatus: (s) => s < 500})
        if (status === 403) throw new ResultadosBlockError()
        if (status < 200 || status >= 300) throw new Error("Não foi possivel carregar o ranking")
        return data
    } 
export async function getParticipantResult(
    examId: string,
    participantId: number,
    signal?: AbortSignal
): Promise<StudentDetail> {
        const { data, status } = await axios.get<StudentDetail>(`${base}/resultados/${examId}/${participantId}`, 
            { signal, validateStatus: (s) => s < 500})
        if (status === 403) throw new ResultadosBlockError()
        if (status < 200 || status >= 300) throw new Error("Não foi possivel carregar as respostas desse participante")
        return data
}

export function useExamRanking(examId: string){
    return useQuery<RankingResponse, Error>({
        queryKey: examRankingQueryKey(examId),
        queryFn: ({ signal }) => getExamRanking(examId, signal),
        enabled: Boolean(examId),
    })
}