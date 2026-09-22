import type { LegalSection } from "@/content/legal/types"

type LegalDocumentProps = {
  title: string
  lastUpdated: string
  sections: LegalSection[]
  disclaimer?: string
}

export function LegalDocument({
  title,
  lastUpdated,
  sections,
  disclaimer = "Este texto é informativo da organização do evento e não substitui assessoria jurídica.",
}: LegalDocumentProps) {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-read-ink pb-6">
        <h1 className="text-2xl font-bold text-read-white md:text-3xl">{title}</h1>
        <p className="text-sm text-read-gray">Última atualização: {lastUpdated}</p>
      </header>
      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="flex flex-col gap-3 scroll-mt-24">
            <h2 className="text-lg font-semibold text-read-white">{section.title}</h2>
            {section.paragraphs.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-read-gray md:text-base">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
      <p className="border-t border-read-ink pt-6 text-xs text-read-gray">{disclaimer}</p>
    </article>
  )
}
