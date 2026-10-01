import type { Metadata } from "next"
import { LegalDocument } from "@/components/legal-document"
import { LegalPageShell } from "@/components/legal-page-shell"
import { LEGAL_LAST_UPDATED } from "@/content/legal/types"
import { termosSections } from "@/content/legal/termos"

export const metadata: Metadata = {
  title: "Termos de Uso | ENEM da Read",
  description:
    "Termos de uso do site oficial do ENEM da Read — Rede de Adolescentes da Oitava Igreja Presbiteriana de Belo Horizonte.",
}

export default function TermosPage() {
  return (
    <LegalPageShell otherPage={{ href: "/privacidade", label: "Ver Política de Privacidade" }}>
      <LegalDocument title="Termos de Uso" lastUpdated={LEGAL_LAST_UPDATED} sections={termosSections} />
    </LegalPageShell>
  )
}
