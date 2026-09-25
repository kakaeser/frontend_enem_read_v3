"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logoutSession } from "@/lib/api"

export function AplicarLogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await logoutSession()
    router.replace("/login")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogout}
      className="h-8 w-8 shrink-0 text-read-gray hover:bg-read-ink hover:text-read-green"
    >
      <LogOut className="h-4 w-4" />
      <span className="sr-only">Sair</span>
    </Button>
  )
}
