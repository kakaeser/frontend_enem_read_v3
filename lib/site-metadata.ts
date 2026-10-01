import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site-url"

export const SITE_TITLE = "Enem da Read"
export const SITE_DESCRIPTION =
  "Site Oficial do Enem da Rede de Adolescentes da Oitava Igreja Presbiteriana de Belo Horizonte"

export function buildRootMetadata(): Metadata {
  return {
    metadataBase: getSiteUrl(),
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: "/",
      siteName: SITE_TITLE,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
  }
}
