import type { CatalogEntry } from '@/types/catalog'
import { collectionStats } from '@/utils/stats'

/** Rótulo para texto/WhatsApp: país + número da figurinha, FWC n, ou 00 — não usa ID global. */
export function stickerShareLabel(e: CatalogEntry): string {
  if (e.segment === 'panini') return e.displayPrinted
  if (e.segment === 'fwc') {
    if (e.fwcNumber != null) return `FWC ${e.fwcNumber}`
    return e.displayPrinted
  }
  const code = e.teamCode ?? '?'
  const slot = e.slotInTeam ?? Number.parseInt(e.displayPrinted, 10)
  return Number.isFinite(slot) ? `${code} ${slot}` : `${code} ${e.displayPrinted}`
}

function formatMissingShareLines(entries: CatalogEntry[]): string[] {
  const sorted = [...entries].sort((a, b) => a.id - b.id)
  const lines: string[] = []

  if (sorted.some((e) => e.segment === 'panini')) {
    lines.push('00')
  }

  const fwcNums = sorted
    .filter((e) => e.segment === 'fwc' && e.fwcNumber != null)
    .map((e) => e.fwcNumber as number)
  if (fwcNums.length > 0) {
    lines.push(`FWC ${fwcNums.join(', ')}`)
  }

  const teamOrder: string[] = []
  const slotsByTeam = new Map<string, number[]>()
  for (const e of sorted) {
    if (e.segment !== 'team' || !e.teamCode || e.slotInTeam == null) continue
    if (!slotsByTeam.has(e.teamCode)) {
      teamOrder.push(e.teamCode)
      slotsByTeam.set(e.teamCode, [])
    }
    slotsByTeam.get(e.teamCode)!.push(e.slotInTeam)
  }
  for (const code of teamOrder) {
    lines.push(`${code} ${slotsByTeam.get(code)!.join(', ')}`)
  }

  return lines
}

export function buildShareMissingText(
  catalog: CatalogEntry[],
  quantities: Readonly<Record<number, number>>,
): string {
  const { missing } = collectionStats(catalog, quantities)
  const idToEntry = new Map(catalog.map((e) => [e.id, e]))
  const missingEntries = missing.map((id) => idToEntry.get(id)).filter((e): e is CatalogEntry => e != null)
  const lines = formatMissingShareLines(missingEntries)
  const header = 'Faltam:'
  if (!lines.length) return `${header}\n—`
  return `${header}\n${lines.join('\n')}`
}

export function buildShareDuplicatesText(
  catalog: CatalogEntry[],
  quantities: Readonly<Record<number, number>>,
): string {
  const pairs: { e: CatalogEntry; dup: number }[] = []
  for (const e of catalog) {
    const q = quantities[e.id] ?? 0
    const dup = Math.max(0, q - 1)
    if (dup > 0) pairs.push({ e, dup })
  }
  pairs.sort((a, b) => a.e.id - b.e.id)
  const lines = pairs.map(({ e, dup }) => `${stickerShareLabel(e)} (${dup})`)
  const header = 'Figurinhas repetidas:'
  if (!lines.length) return `${header}\n—`
  return `${header}\n${lines.join('\n')}`
}
