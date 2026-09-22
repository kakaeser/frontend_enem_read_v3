import { type Divulgada } from "@/app/resultados/columns"
import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import axios from "axios"

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"

export const examResultsQueryKey = ["exam-results"] as const

async function getExamResults(signal?: AbortSignal): Promise<Divulgada[]> {
  const { data, status } = await axios.get<Divulgada[]>(`${base}/resultados`, {
    signal,
    validateStatus: (s) => s < 500,
  })
  if (status < 200 || status >= 300) {
    throw new Error("Não foi possível carregar os resultados.")
  }
  return Array.isArray(data) ? data : []
}

export function useExamResults(): Omit<
  UseQueryResult<Divulgada[], Error>,
  "data"
> & { data: Divulgada[] } {
  const query = useQuery<Divulgada[], Error>({
    queryKey: examResultsQueryKey,
    queryFn: ({ signal }) => getExamResults(signal),
  })

  return {
    ...query,
    data: query.data ?? [],
  }
}
