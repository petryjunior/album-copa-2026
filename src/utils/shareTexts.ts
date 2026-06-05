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

function canMergeConsecutive(a: CatalogEntry, b: CatalogEntry): boolean {
  if (b.id !== a.id + 1) return false
  if (a.segment === 'panini') return false
  if (a.segment === 'fwc' && b.segment === 'fwc') {
    return a.fwcNumber != null && b.fwcNumber === a.fwcNumber + 1
  }
  if (a.segment === 'team' && b.segment === 'team') {
    return (
      a.teamCode === b.teamCode &&
      a.slotInTeam != null &&
      b.slotInTeam === a.slotInTeam + 1
    )
  }
  return false
}

function rangeLabel(start: CatalogEntry, end: CatalogEntry): string {
  if (start.id === end.id) return stickerShareLabel(start)
  if (start.segment === 'team' && end.segment === 'team' && start.teamCode === end.teamCode) {
    const a = start.slotInTeam
    const b = end.slotInTeam
    if (a != null && b != null && a !== b) return `${start.teamCode} ${a}-${b}`
  }
  if (start.segment === 'fwc' && end.segment === 'fwc') {
    const a = start.fwcNumber
    const b = end.fwcNumber
    if (a != null && b != null && a !== b) return `FWC ${a}-${b}`
  }
  return `${stickerShareLabel(start)}–${stickerShareLabel(end)}`
}

/** Junta figurinhas em ordem do álbum; intervalos só quando forem IDs consecutivos e mesmo país / FWC consecutivo. */
export function formatShareLabelsCompact(entries: CatalogEntry[]): string {
  if (!entries.length) return ''
  const sorted = [...entries].sort((a, b) => a.id - b.id)
  const parts: string[] = []
  let i = 0
  while (i < sorted.length) {
    const start = sorted[i]
    let end = start
    let j = i
    while (j + 1 < sorted.length && canMergeConsecutive(sorted[j], sorted[j + 1])) {
      j++
      end = sorted[j]
    }
    parts.push(rangeLabel(start, end))
    i = j + 1
  }
  return parts.join(', ')
}

export function buildShareMissingText(
  catalog: CatalogEntry[],
  quantities: Readonly<Record<number, number>>,
): string {
  const { missing } = collectionStats(catalog, quantities)
  const idToEntry = new Map(catalog.map((e) => [e.id, e]))
  const missingEntries = missing.map((id) => idToEntry.get(id)).filter((e): e is CatalogEntry => e != null)
  const line = formatShareLabelsCompact(missingEntries)
  return `Faltam (${missing.length}/${catalog.length}): ${line}`
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
