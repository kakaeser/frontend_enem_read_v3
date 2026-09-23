import axios, { type Method } from "axios"
import { tryRefresh } from "@/lib/auth-fetch"

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"

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

export async function authAxiosRequest<T>(
  method: Method,
  path: string,
  options?: { data?: unknown; signal?: AbortSignal }
): Promise<T> {
  const url = path.startsWith("http") ? path : `${base}${path}`

  const request = () =>
    axios.request<T>({
      method,
      url,
      data: options?.data,
      signal: options?.signal,
      headers: authHeaders(),
      validateStatus: (s) => s < 500,
    })

  let res = await request()
  if (res.status === 401) {
    const newToken = await tryRefresh(base)
    if (newToken) res = await request()
  }

  if (res.status < 200 || res.status >= 300) {
    throw new Error(messageFromResponseData(res.data, res.status))
  }

  return res.data
}
