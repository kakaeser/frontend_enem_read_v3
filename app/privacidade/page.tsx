import type { Metadata } from "next"
import { LegalDocument } from "@/components/legal-document"
import { LegalPageShell } from "@/components/legal-page-shell"
import { LEGAL_LAST_UPDATED } from "@/content/legal/types"
import { privacidadeSections } from "@/content/legal/privacidade"

export const metadata: Metadata = {
  title: "Política de Privacidade | ENEM da Read",
  description:
    "Como o ENEM da Read trata dados pessoais — LGPD, participantes, organizadores e divulgação de resultados.",
}

export default function PrivacidadePage() {
  return (
    <LegalPageShell otherPage={{ href: "/termos", label: "Ver Termos de Uso" }}>
      <LegalDocument
        title="Política de Privacidade"
        lastUpdated={LEGAL_LAST_UPDATED}
        sections={privacidadeSections}
      />
    </LegalPageShell>
  )
}
