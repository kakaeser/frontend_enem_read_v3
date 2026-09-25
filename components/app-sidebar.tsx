"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Trophy, Users, FileQuestion, ShieldCheck, LayoutDashboard, RefreshCw } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { authAxiosRequest, logoutSession } from "@/lib/api"

type Props = { examId: string; examNome?: string | null }

type AplicadorRow = { id: number; nome: string; status: string }

export function AppSidebar({ examId, examNome }: Props) {
  const pathname = usePathname()
  const [openAplicadores, setOpenAplicadores] = useState(false)
  const [aplicadores, setAplicadores] = useState<AplicadorRow[]>([])

  async function fetchAplicadores() {
    try {
      const data = await authAxiosRequest<AplicadorRow[]>(
        "GET",
        `/aplicadores?provaId=${examId}`
      )
      setAplicadores(Array.isArray(data) ? data : [])
    } catch {
      setAplicadores([])
    }
  }

  useEffect(() => {
    if (!openAplicadores) return
    fetchAplicadores()
  }, [openAplicadores, examId])

  async function handleStatus(id: number, status: "APROVADO" | "REJEITADO") {
    try {
      const updated = await authAxiosRequest<AplicadorRow>(
        "PATCH",
        `/aplicadores/${id}/status`,
        { data: { status } }
      )
      setAplicadores((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, ...updated, status: updated.status ?? status }
            : a
        )
      )
    } catch {
      /* ignore */
    }
  }

  const isActive = (href: string) => pathname === href
  const router = useRouter()

  async function handleLogout() {
    await logoutSession()
    router.replace("/login")
  }

  return (
    <>
      <Sidebar className="bg-read-ink-dark text-read-white border-read-ink-dark">
        <SidebarHeader className="border-b border-read-ink bg-read-ink">
          <Link href="/manage" className="flex items-center gap-2 px-2 py-2 hover:opacity-80 transition-opacity">
            <LayoutDashboard className="h-5 w-5 text-read-green" />
            <span className="font-bold text-read-white truncate">{examNome ?? `Prova #${examId}`}</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-read-gray">Navegação</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={isActive(`/manage/${examId}`)} render={<Link href={`/manage/${examId}`} />} className="text-read-white data-[active=true]:bg-read-logo-dark data-[active=true]:text-read-green">
                    <Trophy /> Ranking
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={isActive(`/manage/${examId}/participantes`)} render={<Link href={`/manage/${examId}/participantes`} />} className="text-read-white data-[active=true]:bg-read-logo-dark data-[active=true]:text-read-green">
                    <Users /> Participantes
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={isActive(`/manage/${examId}/questoes`)} render={<Link href={`/manage/${examId}/questoes`} />} className="text-read-white data-[active=true]:bg-read-logo-dark data-[active=true]:text-read-green">
                    <FileQuestion /> Questões
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setOpenAplicadores(true)} className="text-read-white hover:bg-read-ink-dark hover:text-read-green">
                    <ShieldCheck /> Aplicadores
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-read-ink p-2">
          <Button onClick={handleLogout} className="w-full bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </SidebarFooter>
      </Sidebar>

      <Sheet open={openAplicadores} onOpenChange={setOpenAplicadores}>
        <SheetContent side="left" className="bg-read-ink-dark border-read-dark text-read-white overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center">
              <SheetTitle className="text-read-white">{examNome ?? `Prova #${examId}`}</SheetTitle>
              <Button variant="ghost" size="icon" onClick={fetchAplicadores} className="h-8 w-8 text-read-gray hover:bg-read-ink hover:text-read-green">
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Recarregar</span>
              </Button>
            </div>
          </SheetHeader>
          <div className="ml-1 mr-1">
            {aplicadores.length === 0 ? (
              <p className="text-sm text-read-gray px-6">Nenhum aplicador para esta prova.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-read-dark">
                <Table>
                  <TableHeader className="bg-read-dark">
                    <TableRow className="border-read-dark hover:bg-transparent">
                      <TableHead className="text-read-white">Nome</TableHead>
                      <TableHead className="text-read-white">Status</TableHead>
                      <TableHead className="text-right text-read-white">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aplicadores.map((a) => (
                      <TableRow key={a.id} className="border-read-dark/50 hover:bg-read-dark/20">
                        <TableCell className="font-medium text-read-white">{a.nome}</TableCell>
                        <TableCell>
                          <Badge className={a.status === "PENDENTE" ? "bg-read-blue text-white" : a.status === "APROVADO" ? "bg-read-green text-read-logo-dark" : "bg-red-500 text-white"}>{a.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {a.status === "PENDENTE" ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => handleStatus(a.id, "APROVADO")} className="bg-read-green text-read-logo-dark hover:bg-read-green-dark hover:text-white">
                                Aprovar
                              </Button>
                              <Button size="sm" onClick={() => handleStatus(a.id, "REJEITADO")} className="bg-red-500 text-white hover:bg-red-700 border-transparent">
                                Rejeitar
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-read-gray">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
