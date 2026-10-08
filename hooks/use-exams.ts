import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { authAxiosRequest } from "@/lib/api"
import type { Exam } from "@/app/manage/columns"
import {
  buildListParams,
  DEFAULT_LIST_LIMIT,
  type ListQueryParams,
  type PaginatedMeta,
  type PaginatedResponse,
} from "@/lib/pagination-types"

export const examsQueryKey = ["exams"] as const

export type ExamsListParams = Pick<ListQueryParams, "page" | "limit" | "search">

export async function getExams(
  params: ExamsListParams,
  signal?: AbortSignal
): Promise<PaginatedResponse<Exam>> {
  return authAxiosRequest<PaginatedResponse<Exam>>("GET", "/exams", {
    signal,
    params: buildListParams({
      page: params.page ?? 1,
      limit: params.limit ?? DEFAULT_LIST_LIMIT,
      search: params.search,
    }),
  })
}

const emptyMeta: PaginatedMeta = {
  page: 1,
  limit: DEFAULT_LIST_LIMIT,
  total: 0,
  totalPages: 0,
}

export function useExams(params: ExamsListParams) {
  const page = params.page ?? 1
  const limit = params.limit ?? DEFAULT_LIST_LIMIT
  const search = params.search?.trim() || undefined

  const query = useQuery({
    queryKey: [...examsQueryKey, { page, limit, search }],
    queryFn: ({ signal }) => getExams({ page, limit, search }, signal),
    placeholderData: keepPreviousData,
  })

  return {
    ...query,
    data: query.data?.data ?? [],
    meta: query.data?.meta ?? emptyMeta,
  }
}
