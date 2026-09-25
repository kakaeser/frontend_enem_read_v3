import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authAxiosRequest } from "@/lib/api"
import { examsQueryKey } from "@/hooks/use-exams"
import type { CreateExamFormValues } from "@/lib/exam-schema"
import type { Exam } from "@/app/manage/columns"

export async function createExam(payload: CreateExamFormValues): Promise<Exam> {
  return authAxiosRequest<Exam>("POST", "/exams", { data: payload })
}

export function useCreateExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examsQueryKey })
    },
  })
}
