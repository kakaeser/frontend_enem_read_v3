import axios, { type Method } from "axios"
import {
  clearAdmAccessToken,
  setAdmAccessToken,
} from "@/lib/adm-session"
import {
  clearAplicadorAccessToken,
  getAplicadorAccessToken,
  getBearerToken,
  isAplicadorBearer,
} from "@/lib/bearer-token"

export const apiBase =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"

const appApiKey = process.env.NEXT_PUBLIC_APP_API_KEY?.trim()

function resolveUrl(path: string): string {
  return path.startsWith("http") ? path : `${apiBase}${path}`
}

function baseHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(appApiKey ? { "X-App-Api-Key": appApiKey } : {}),
    ...extra,
  }
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? getBearerToken() : null
  return baseHeaders(token ? { Authorization: `Bearer ${token}` } : undefined)
}

function messageFromResponseData(data: unknown, status: number): string {
  if (typeof data === "object" && data !== null && "message" in data) {
    const msg = (data as { message: unknown }).message
    if (typeof msg === "string") return msg
    if (Array.isArray(msg)) return msg.join(", ")
  }
  return `HTTP ${status}`
}

const axiosDefaults = { withCredentials: true }

/** Renova access ADM via cookie HttpOnly (`POST /auth/refresh`, sem body). */
export async function tryRefreshAdmSession(): Promise<string | null> {
  if (typeof window === "undefined") return null
  try {
    const res = await axios.post<{ access_token?: string }>(
      `${apiBase}/auth/refresh`,
      undefined,
      {
        ...axiosDefaults,
        headers: baseHeaders(),
        validateStatus: (s) => s < 500,
      }
    )
    if (res.status < 200 || res.status >= 300) return null
    const access = res.data.access_token
    if (access) {
      setAdmAccessToken(access)
      return access
    }
  } catch {
    /* ignore */
  }
  return null
}

/** @deprecated Use tryRefreshAdmSession */
export const tryRefresh = tryRefreshAdmSession

export type AxiosHttpResult<T> = { data: T; status: number }

export type RequestParams = Record<
  string,
  string | number | boolean | undefined
>

type RequestOptions = {
  data?: unknown
  signal?: AbortSignal
  auth?: boolean
  params?: RequestParams
}

/** Low-level HTTP: returns status + body; does not throw on 4xx. Optional auth + 401 refresh retry. */
export async function axiosHttp<T>(
  method: Method,
  path: string,
  options?: RequestOptions
): Promise<AxiosHttpResult<T>> {
  const url = resolveUrl(path)
  const useAuth = options?.auth !== false

  const run = () => {
    const bearer = useAuth ? getBearerToken() : null
    return axios.request<T>({
      method,
      url,
      data: options?.data,
      params: options?.params,
      signal: options?.signal,
      ...axiosDefaults,
      headers: useAuth ? authHeaders() : baseHeaders(),
      validateStatus: (s) => s < 500,
    }).then((res) => ({ res, bearer }))
  }

  let { res, bearer } = await run()
  if (useAuth && res.status === 401 && !isAplicadorBearer(bearer)) {
    const newToken = await tryRefreshAdmSession()
    if (newToken) {
      const retry = await run()
      res = retry.res
    }
  }

  return { data: res.data, status: res.status }
}

/** Public request; throws on non-2xx. */
export async function publicAxiosRequest<T>(
  method: Method,
  path: string,
  options?: Omit<RequestOptions, "auth">
): Promise<T> {
  const { data, status } = await axiosHttp<T>(method, path, {
    ...options,
    auth: false,
  })
  if (status < 200 || status >= 300) {
    throw new Error(messageFromResponseData(data, status))
  }
  return data
}

/** Authenticated request; throws on non-2xx. */
export async function authAxiosRequest<T>(
  method: Method,
  path: string,
  options?: Omit<RequestOptions, "auth">
): Promise<T> {
  const { data, status } = await axiosHttp<T>(method, path, {
    ...options,
    auth: true,
  })
  if (status < 200 || status >= 300) {
    throw new Error(messageFromResponseData(data, status))
  }
  return data
}

export async function logoutSession(): Promise<void> {
  if (typeof window === "undefined") return

  const aplicador = getAplicadorAccessToken()
  if (aplicador) {
    clearAplicadorAccessToken()
    return
  }

  try {
    await axios.post(
      `${apiBase}/auth/logout`,
      undefined,
      {
        ...axiosDefaults,
        headers: baseHeaders(),
        validateStatus: (s) => s < 500,
      }
    )
  } catch {
    /* ignore */
  }
  clearAdmAccessToken()
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}
