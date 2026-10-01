import { AplicarLogoutButton } from "@/components/aplicar-logout-button"
import { publicAxiosRequest } from "@/lib/api"

export default async function AplicarLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  let examNome: string | null = null
  try {
    const data = await publicAxiosRequest<{ nome?: string }>(
      "GET",
      `/exams/${examId}`
    )
    examNome = data.nome ?? null
  } catch {
    /* ignore */
  }
  return (
    <div className="min-h-svh bg-read-darkest text-read-white">
      <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-read-ink bg-read-green-dark px-4">
        <span className="truncate text-sm font-medium text-read-white">
          {examNome ?? `Prova #${examId}`}
        </span>
        <AplicarLogoutButton />
      </header>
      <main className="mx-auto w-full max-w-2xl p-4 pb-8">{children}</main>
    </div>
  )
}
