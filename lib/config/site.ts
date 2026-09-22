const DEFAULT_SITE_URL = 'https://vexsen.com'

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
  name: 'Vexsen® Official Store',
  url: siteUrl,
  description:
    'Shop the official Vexsen store. Discover 24H waterproof peel-off lip stains, hydrating juicy lip oils, and transfer-proof beauty care. Fast insured shipping & 30-day guarantee.',
}

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}
