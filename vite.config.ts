import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // three.js (tocadiscos 3D) va en su propio chunk diferido de ~540 kB; solo se baja en Los vinilos de Big.
  build: { chunkSizeWarningLimit: 600 },
  plugins: [
    react(),
    VitePWA({
      // Service worker propio en src/sw.ts para poder recibir Web Push.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      // Íconos definitivos se producen con la dirección visual del periódico.
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'The MVP Post',
        short_name: 'MVP Post',
        description: 'El periódico de María Victoria.',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        background_color: '#f4f1ea',
        theme_color: '#1c1c1c',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2,ttf,mp3}'],
        // el motor del quitafondos solo se baja al hacer el primer recorte
        globIgnores: ['**/ort*.js'],
      },
    }),
  ],
})
