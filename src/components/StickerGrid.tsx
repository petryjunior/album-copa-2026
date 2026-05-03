import { StickerChip } from '@/components/StickerChip'
import type { CatalogEntry } from '@/types/catalog'

type Props = {
  entries: CatalogEntry[]
  qtyOf: (id: number) => number
  onPick: (e: CatalogEntry) => void
}

export function StickerGrid({ entries, qtyOf, onPick }: Props) {
  if (!entries.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-600">
        Nada encontrado com os filtros atuais.
      </div>
    )
  }

  return (
    <section className="grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-2 pb-36 sm:gap-2.5">
      {entries.map((entry) => (
        <StickerChip key={entry.id} entry={entry} qty={qtyOf(entry.id)} onOpen={() => onPick(entry)} />
      ))}
    </section>
  )
}
