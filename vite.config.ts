import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Sincronizar com scripts/run-preview.mjs (variável opcional ao correr mesmo preview). */
function getPreviewPort(): number {
  const n = Number(process.env.ALBUM_PREVIEW_PORT)
  return Number.isFinite(n) && n > 0 && n <= 65535 ? Math.floor(n) : 4173
}

// Base relativo permite servir tanto na raíz quanto em user.github.io/repositório/.
const base = process.env.VITE_BASE_PATH ?? './'

/** Inserido em cada HTML gerado para confirmar no navegador (Ctrl+U) qual build está a correr. */
function albumBuildStampPlugin(): Plugin {
  const utc = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const gh = process.env.GITHUB_SHA?.slice(0, 7)
  const raw = gh ? `${utc} UTC · ${gh}` : `${utc} UTC`
  const content = raw.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  return {
    name: 'album-build-stamp',
    enforce: 'post',
    transformIndexHtml(html) {
      if (html.includes('album-build-stamp')) return html
      return html.replace(/<\/title>/i, `</title>\n    <meta name="album-build-stamp" content="${content}" />`)
    },
  }
}

function albumDevServeBannerPlugin(): Plugin {
  return {
    name: 'album-dev-serve-banner',
    apply: 'serve',
    configResolved(cfg) {
      console.warn('')
      console.warn('[album-copa-2026] Vite serves THIS folder — use Cursor File → Open Folder on the same path:')
      console.warn('   ', path.resolve(cfg.root))
      console.warn('')
    },
  }
}

export default defineConfig(({ mode, command }) => {
  const isPreviewLike = mode === 'preview'
  /** Só gerar manifest/SW nos builds (`vite build`). No `vite` dev evita caches que sabotam «hot reload». */
  const usePwaPlugin = command === 'build' && !isPreviewLike
  /** WSL sobre `/mnt/c/...`: o watcher normal muitas vezes não deteta gravações vindas do Windows. */
  const watchPollFs =
    process.env.CHOKIDAR_USEPOLLING === 'true' ||
    process.env.VITE_WATCH_POLL === '1' ||
    /[/\\]mnt[/\\][a-z][/\\]/i.test(__dirname.replace(/\\/g, '/'))

  return {
    /** Prevents vite from wiping the banner printed by albumDevServeBannerPlugin. */
    clearScreen: false,
    base,
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      ...(watchPollFs ? { watch: { usePolling: true, interval: 200 } as const } : {}),
    },
    // `host: true` → escuta em 0.0.0.0. Com WSL, só `localhost` por vezes faz o forwarding do Cursor (Simple Browser
    // noutra porta, ex.: 4174→4173) bater à sessão errada/antiga.
    preview: {
      host: true,
      port: getPreviewPort(),
      strictPort: true,
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    },
    plugins: [
      ...(command === 'serve' ? [albumDevServeBannerPlugin()] : []),
      albumBuildStampPlugin(),
      react(),
      tailwindcss(),
      ...(usePwaPlugin
        ? [
            VitePWA({
              injectRegister: 'auto',
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
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
