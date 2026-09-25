import { type Divulgada } from "@/app/resultados/columns"
import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import { publicAxiosRequest } from "@/lib/api"

export const examResultsQueryKey = ["exam-results"] as const

async function getExamResults(signal?: AbortSignal): Promise<Divulgada[]> {
  const data = await publicAxiosRequest<Divulgada[]>("GET", "/resultados", {
    signal,
  })
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
