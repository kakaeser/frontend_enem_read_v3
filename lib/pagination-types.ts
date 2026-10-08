import { authAxiosRequest, publicAxiosRequest } from "@/lib/api"

export type PaginatedMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: PaginatedMeta
}

export const DEFAULT_LIST_LIMIT = 10
export const MAX_LIST_LIMIT = 100

export type ListQueryParams = {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export function buildListParams(
  params: ListQueryParams
): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (params.page != null) out.page = params.page
  if (params.limit != null) out.limit = params.limit
  const search = params.search?.trim()
  if (search) out.search = search
  if (params.status) out.status = params.status
  return out
}

type PageFetcher<T> = (
  page: number,
  limit: number,
  signal?: AbortSignal
) => Promise<PaginatedResponse<T>>

export async function fetchAllPaginated<T>(
  fetchPage: PageFetcher<T>,
  signal?: AbortSignal,
  limit = MAX_LIST_LIMIT
): Promise<T[]> {
  const all: T[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const res = await fetchPage(page, limit, signal)
    all.push(...res.data)
    totalPages = res.meta.totalPages
    page += 1
  }

  return all
}

export async function fetchAllPaginatedAuth<T>(
  path: string,
  baseParams: Omit<ListQueryParams, "page" | "limit">,
  signal?: AbortSignal
): Promise<T[]> {
  return fetchAllPaginated<T>(
    (page, limit, sig) =>
      authAxiosRequest<PaginatedResponse<T>>("GET", path, {
        signal: sig,
        params: buildListParams({ ...baseParams, page, limit }),
      }),
    signal
  )
}

export async function fetchAllPaginatedPublic<T>(
  path: string,
  baseParams: Omit<ListQueryParams, "page" | "limit">,
  signal?: AbortSignal
): Promise<T[]> {
  return fetchAllPaginated<T>(
    (page, limit, sig) =>
      publicAxiosRequest<PaginatedResponse<T>>("GET", path, {
        signal: sig,
        params: buildListParams({ ...baseParams, page, limit }),
      }),
    signal
  )
}
