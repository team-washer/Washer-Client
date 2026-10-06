import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Washer',
    short_name: 'Washer',
    description: '기숙사 세탁기, 건조기 예약 시스템',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFF',
    theme_color: '#86A9FF',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
