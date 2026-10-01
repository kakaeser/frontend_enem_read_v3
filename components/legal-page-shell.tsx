import Link from "next/link"
import type { ReactNode } from "react"
import Header_menu from "@/components/header_landing"

type LegalPageShellProps = {
  children: ReactNode
  otherPage: { href: string; label: string }
}

export function LegalPageShell({ children, otherPage }: LegalPageShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-read-darkest font-sans text-read-white">
      <Header_menu />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10 md:py-12">
        {children}
        <nav className="flex flex-col gap-3 border-t border-read-ink pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-read-blue-light hover:text-read-green hover:underline">
            Voltar ao início
          </Link>
          <Link href={otherPage.href} className="text-read-blue-light hover:text-read-green hover:underline">
            {otherPage.label}
          </Link>
        </nav>
      </main>
    </div>
  )
}
