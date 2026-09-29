import { useQuery } from "@tanstack/react-query"
import { publicAxiosRequest } from "@/lib/api"

export type InProgressExam = {
  id: number
  nome: string
  status: string
}

export const inProgressExamsQueryKey = ["exams", "in_progress"] as const

async function getInProgressExams(signal?: AbortSignal): Promise<InProgressExam[]> {
  const data = await publicAxiosRequest<InProgressExam[]>(
    "GET",
    "/exams?status=in_progress",
    { signal }
  )
  return Array.isArray(data) ? data : []
}

export function useInProgressExams() {
  return useQuery<InProgressExam[], Error>({
    queryKey: inProgressExamsQueryKey,
    queryFn: ({ signal }) => getInProgressExams(signal),
  })
}
