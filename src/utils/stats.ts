import type { CatalogEntry } from '@/types/catalog'

export function collectionStats(
  catalog: CatalogEntry[],
  quantities: Readonly<Record<number, number>>,
) {
  let withAlbum = 0
  let duplicateTotal = 0
  const missing: number[] = []
  const duplicateById: Array<{ id: number; extra: number }> = []
  for (const e of catalog) {
    const q = quantities[e.id] ?? 0
    if (q >= 1) withAlbum++
    else missing.push(e.id)
    const dup = Math.max(0, q - 1)
    duplicateTotal += dup
    if (dup > 0) duplicateById.push({ id: e.id, extra: dup })
  }
  const total = catalog.length
  const pct = total ? Math.round((1000 * withAlbum) / total) / 10 : 0
  return {
    total,
    withAlbum,
    missingCount: missing.length,
    missing,
    duplicateTotal,
    duplicateById,
    pct,
  }
}
