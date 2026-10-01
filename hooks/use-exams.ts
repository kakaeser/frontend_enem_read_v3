import {useQuery} from "@tanstack/react-query"
import {authAxiosRequest} from "@/lib/api"
import type { Exam } from "@/app/manage/columns"

export const examsQueryKey = ["exams"] as const

async function getExams(signal?: AbortSignal): Promise<Exam[]>{
    const data = await authAxiosRequest<Exam[]>("GET", "/exams", {signal})
    return Array.isArray(data) ? data : []
}

export function useExams() {
    return useQuery({
        queryKey: examsQueryKey,
        queryFn: ({ signal }) => getExams(signal),
    })
}
