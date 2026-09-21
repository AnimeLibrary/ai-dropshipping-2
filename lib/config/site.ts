const DEFAULT_SITE_URL = 'https://vexsen.store'

function normalizeSiteUrl(value?: string) {
  try {
    const url = new URL(value || DEFAULT_SITE_URL)
    url.hostname = url.hostname.toLowerCase()
    return url.toString().replace(/\/$/, '')
  } catch {
    return DEFAULT_SITE_URL
  }
}

export const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_URL)

export const siteConfig = {
  name: 'Vexsen',
  url: siteUrl,
  description:
    'Functional design. Uncompromising quality. Vexsen curates verified solutions for everyday frustrations.',
}

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}
