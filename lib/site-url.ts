const DEFAULT_SITE_URL = "https://enemread.com.br"

/** URL canônica do front (OG, metadataBase). */
export function getSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL
  return new URL(raw.endsWith("/") ? raw.slice(0, -1) : raw)
}
