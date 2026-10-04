import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/config/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vexsen Official Store',
    short_name: 'Vexsen',
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#07060a',
    theme_color: '#a855f7',
    icons: [
      {
        src: '/favicon-48x48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
