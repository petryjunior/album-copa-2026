import { formatCompactRanges } from '@/utils/ranges'
import type { CatalogEntry } from '@/types/catalog'
import { collectionStats } from '@/utils/stats'

export function buildShareMissingText(
  catalog: CatalogEntry[],
  quantities: Readonly<Record<number, number>>,
): string {
  const { missing } = collectionStats(catalog, quantities)
  const line = formatCompactRanges(missing)
  return `Faltam (${missing.length}/${catalog.length}): ${line}`
}

export function buildShareDuplicatesText(
  catalog: CatalogEntry[],
  quantities: Readonly<Record<number, number>>,
): string {
  const entries = catalog
    .map((e) => {
      const q = quantities[e.id] ?? 0
      const dup = Math.max(0, q - 1)
      return dup > 0 ? `${e.id}x${dup}` : null
    })
    .filter((x): x is string => x !== null)
  const totalDup = catalog.reduce((acc, e) => acc + Math.max(0, (quantities[e.id] ?? 0) - 1), 0)
  return `Figurinhas repetidas (total cópias extras: ${totalDup}): ${entries.join(', ') || '—'}`
}
