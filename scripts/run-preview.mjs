/**
 * Corre sempre a partir da raiz deste projeto (pai de /scripts),
 * mesmo que `npm run` seja iniciado por engano doutro cwd.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import killPort from 'kill-port'

function getPreviewPort() {
  const n = Number(process.env.ALBUM_PREVIEW_PORT)
  return Number.isFinite(n) && n > 0 && n <= 65535 ? Math.floor(n) : 4173
}

const __scripts = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__scripts, '..')
const pkg = join(repoRoot, 'package.json')
const node = process.execPath
const viteCli = join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js')

if (!existsSync(pkg)) {
  console.error('[album-copa-2026] run-preview: falta package.json em', repoRoot)
  process.exit(1)
}

if (!existsSync(viteCli)) {
  console.error('[album-copa-2026] vite não encontrado. Executa primeiro: npm install')
  process.exit(1)
}

async function main() {
  const previewPort = getPreviewPort()
  /** Vite já usou N+1, N+2 quando N estava ocupada; esses procesos ficam à escuta até os matarem — daí localhost:4174 “sempre antigo”. */
  const skipChain = process.env.ALBUM_PREVIEW_KEEP_FALLBACK_PORTS === '1'
  const portsToFree = [...new Set([previewPort, previewPort + 1, previewPort + 2])]

  console.warn(`
[album-copa-2026] Preview principal na porta ${previewPort}.
• Outra porta: ALBUM_PREVIEW_PORT=5175 npm run preview
• Antes do build libertamos esta porta (+ as duas seguintes, ${previewPort}+1/+2),
  onde costumam ficar previews antigos quando o Cursor mostra forwarding em 4174.
• Para só matar uma porta (não mexer nos “vizinhos”): ALBUM_PREVIEW_KEEP_FALLBACK_PORTS=1
`)
  console.warn(`[album-copa-2026] A libertar portas ${portsToFree.join(', ')}…`)

  for (const port of portsToFree) {
    if (skipChain && port !== previewPort) continue
    await killPort(port).catch(() => {})
  }

  console.warn(`
[album-copa-2026]
· Abre sempre o URL que o Vite imprime no terminal. Se Cursor abrir só :4174, pode ser só rótulo de forwarding —
  desde que mates os servidores antigos (isto acima), deve apontar ao preview novo junto ao :${previewPort}.
· localhost vs 127.0.0.1 = caches do browser diferentes.
`)

  run('Limpando dist/', [join(repoRoot, 'scripts', 'clean-dist.mjs')])
  run('vite build --mode preview (sem PWA; bundle fresco)', [
    viteCli,
    'build',
    '--mode',
    'preview',
  ])
  run('vite preview (porta em vite.config + env ALBUM_PREVIEW_PORT)', [viteCli, 'preview'])
}

function run(description, argv) {
  console.warn(`\n[album-copa-2026] ${description}\n`)
  const r = spawnSync(node, argv, { cwd: repoRoot, stdio: 'inherit', env: process.env })
  const code = typeof r.status === 'number' ? r.status : 1
  if (code !== 0) process.exit(code)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
