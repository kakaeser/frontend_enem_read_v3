import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { publicAxiosRequest } from "@/lib/api"

export default async function ManageExamLayout({
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
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar examId={examId} examNome={examNome} />
      <SidebarInset className="bg-read-darkest">
        <header className="flex h-12 items-center gap-2 border-b border-read-ink bg-read-green-dark px-4">
          <SidebarTrigger className="text-read-white hover:bg-read-ink hover:text-read-green" />
          <span className="text-sm font-medium text-read-white">{examNome ?? `Prova #${examId}`}</span>
        </header>
        <div className="p-6 bg-read-darkest min-h-[calc(100vh-3rem)]">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
