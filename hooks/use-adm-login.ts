import { useMutation } from "@tanstack/react-query"
import { publicAxiosRequest } from "@/lib/api"
import type { AdmLoginFormValues } from "@/lib/login-schema"

type LoginResponse = {
  access_token: string
  refresh_token?: string
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
      localStorage.setItem("access_token", data.access_token)
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token)
      }
    },
  })
}
