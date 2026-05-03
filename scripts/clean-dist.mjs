import { existsSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = join(__dirname, '..', 'dist')

if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true })
  console.warn('[album-copa-2026] dist/ removed before preview build.')
}
