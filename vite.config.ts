import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Íconos definitivos se producen en la Fase 2 (dirección visual).
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'MVP OS',
        short_name: 'MVP OS',
        description: 'El sistema operativo de María Victoria.',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        background_color: '#1a0a10',
        theme_color: '#5c0f24',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2,mp3}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
})
