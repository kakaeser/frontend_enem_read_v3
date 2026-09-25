import axios, { type Method } from "axios"

export const apiBase =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"

function resolveUrl(path: string): string {
  return path.startsWith("http") ? path : `${apiBase}${path}`
}

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function messageFromResponseData(data: unknown, status: number): string {
  if (typeof data === "object" && data !== null && "message" in data) {
    const msg = (data as { message: unknown }).message
    if (typeof msg === "string") return msg
    if (Array.isArray(msg)) return msg.join(", ")
  }
  return `HTTP ${status}`
}

export async function tryRefresh(): Promise<string | null> {
  if (typeof window === "undefined") return null
  const refresh = localStorage.getItem("refresh_token")
  if (!refresh) return null
  try {
    const res = await axios.post<{ access_token?: string; refresh_token?: string }>(
      `${apiBase}/auth/refresh`,
      { refresh_token: refresh },
      { headers: { "Content-Type": "application/json" }, validateStatus: (s) => s < 500 }
    )
    if (res.status < 200 || res.status >= 300) return null
    const data = res.data
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token)
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token)
      }
      return data.access_token
    }
  } catch {
    /* ignore */
  }
  return null
}

export type AxiosHttpResult<T> = { data: T; status: number }

type RequestOptions = {
  data?: unknown
  signal?: AbortSignal
  auth?: boolean
}

/** Low-level HTTP: returns status + body; does not throw on 4xx. Optional auth + 401 refresh retry. */
export async function axiosHttp<T>(
  method: Method,
  path: string,
  options?: RequestOptions
): Promise<AxiosHttpResult<T>> {
  const url = resolveUrl(path)
  const useAuth = options?.auth !== false

  const run = () =>
    axios.request<T>({
      method,
      url,
      data: options?.data,
      signal: options?.signal,
      headers: useAuth ? authHeaders() : { "Content-Type": "application/json" },
      validateStatus: (s) => s < 500,
    })

  let res = await run()
  if (useAuth && res.status === 401) {
    const newToken = await tryRefresh()
    if (newToken) res = await run()
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
  const refresh = localStorage.getItem("refresh_token")
  try {
    if (refresh) {
      await axiosHttp("POST", "/auth/logout", {
        data: { refresh_token: refresh },
        auth: false,
      })
    }
  } catch {
    /* ignore */
  }
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}
