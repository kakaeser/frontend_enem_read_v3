import { useQuery } from "@tanstack/react-query"
import { fetchAllPaginatedPublic } from "@/lib/pagination-types"

export type InProgressExam = {
  id: number
  nome: string
  status: string
}

export const inProgressExamsQueryKey = ["exams", "in_progress"] as const

async function getInProgressExams(signal?: AbortSignal): Promise<InProgressExam[]> {
  return fetchAllPaginatedPublic<InProgressExam>(
    "/exams",
    { status: "in_progress" },
    signal
  )
}

export function useInProgressExams() {
  return useQuery<InProgressExam[], Error>({
    queryKey: inProgressExamsQueryKey,
    queryFn: ({ signal }) => getInProgressExams(signal),
  })
}
