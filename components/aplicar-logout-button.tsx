"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AplicarLogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3030"
    const refresh = localStorage.getItem("refresh_token")
    try {
      if (refresh) {
        await fetch(`${base}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refresh }),
        })
      }
    } catch {}
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
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
