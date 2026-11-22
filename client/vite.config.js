import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'offline.html'],
      manifest: {
        name: 'Rescue the Surplus',
        short_name: 'RescueSurplus',
        display: 'standalone',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
})
