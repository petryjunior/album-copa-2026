import type { CatalogEntry } from '@/types/catalog'

/** Quantas figurinhas da seleção estão marcadas como pelo menos 1 no álbum (entre 0 e o nº de cromos da equipa). */
export function countTeamSlotsFilled(
  catalog: CatalogEntry[],
  album: Readonly<Record<number, number>>,
  teamCode: string,
): { filled: number; total: number } {
  const entries = catalog.filter((e) => e.teamCode === teamCode)
  let filled = 0
  for (const e of entries) {
    if ((album[e.id] ?? 0) >= 1) filled++
  }
  return { filled, total: entries.length }
}
