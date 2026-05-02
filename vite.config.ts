import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Base relativo permite servir tanto na raíz quanto em user.github.io/repositório/.
const base = process.env.VITE_BASE_PATH ?? './'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg'],
      manifest: {
        name: 'Álbum Copa 2026 — Figurinhas',
        short_name: 'Copa 2026',
        description: 'Controle da coleção Panini FIFA World Cup 2026™',
        theme_color: '#0f4c3a',
        background_color: '#f8fafc',
        display: 'standalone',
        lang: 'pt-BR',
        start_url: base,
        scope: base === './' ? undefined : base,
        icons: [
          {
            src: 'icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
