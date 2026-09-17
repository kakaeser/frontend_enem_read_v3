"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { cn } from "cn"

export function AplicarTabs() {
  const { examId } = useParams<{ examId: string }>()
  const pathname = usePathname()
  const base = `/manage/aplicar/${examId}`
  const tabs = [
    { label: "Questões", href: base },
    { label: "Redação", href: `${base}/redacao` },
  ]
  return (
    <div className="flex gap-1 rounded-lg border border-read-ink bg-read-ink-dark p-1">
      {tabs.map((t) => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition-colors",
              active
                ? "bg-read-green text-read-logo-dark"
                : "text-read-gray hover:text-read-white"
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
