import { useMutation } from "@tanstack/react-query"
import { axiosHttp } from "@/lib/api"
import { normalizeConsultaCode } from "@/lib/consulta-code"
import type { StudentDetail } from "@/lib/student-detail"
import { ResultadosBlockError } from "@/hooks/use-exam-ranking"

export async function postResultadosConsulta(
  examId: string,
  codigo: string
): Promise<StudentDetail> {
  const normalized = normalizeConsultaCode(codigo)
  const { data, status } = await axiosHttp<StudentDetail>(
    "POST",
    `/resultados/${examId}/consulta`,
    { data: { codigo: normalized }, auth: false }
  )
  if (status === 403) throw new ResultadosBlockError()
  if (status === 404) {
    throw new Error("Código inválido")
  }
  if (status === 429) {
    throw new Error("Muitas tentativas. Aguarde um minuto.")
  }
  if (status < 200 || status >= 300) {
    throw new Error("Não foi possível consultar o resultado")
  }
  return data
}

export function useResultadosConsulta(examId: string) {
  return useMutation({
    mutationFn: (codigo: string) => postResultadosConsulta(examId, codigo),
  })
}
