export async function tryRefresh(base: string): Promise<string | null> {
  const refresh = localStorage.getItem("refresh_token")
  if (!refresh) return null
  try {
    const res = await fetch(`${base}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token)
      if (data.refresh_token)
        localStorage.setItem("refresh_token", data.refresh_token)
      return data.access_token
    }
  } catch {}
  return null
}

export async function authFetch(
  base: string,
  url: string,
  init: RequestInit
): Promise<Response> {
  let token = localStorage.getItem("access_token")
  let res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (res.status === 401) {
    const newToken = await tryRefresh(base)
    if (newToken) {
      token = newToken
      res = await fetch(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
    }
  }
  return res
}
