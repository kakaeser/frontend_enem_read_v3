import { useMutation } from "@tanstack/react-query"
import { setAdmAccessToken } from "@/lib/adm-session"
import { clearAplicadorAccessToken } from "@/lib/bearer-token"
import { publicAxiosRequest } from "@/lib/api"
import type { AdmLoginFormValues } from "@/lib/login-schema"

type LoginResponse = {
  access_token: string
  adm?: { id: number; email: string }
}

async function admLogin(values: AdmLoginFormValues): Promise<LoginResponse> {
  return publicAxiosRequest<LoginResponse>("POST", "/auth/login", {
    data: { email: values.email, senha: values.senha },
  })
}

export function useAdmLogin() {
  return useMutation({
    mutationFn: admLogin,
    onSuccess: (data) => {
      clearAplicadorAccessToken()
      setAdmAccessToken(data.access_token)
    },
  })
}
