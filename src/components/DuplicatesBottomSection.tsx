import { useMemo } from 'react'
import type { CatalogEntry } from '@/types/catalog'
import { ManualCloudSaveButton } from '@/components/ManualCloudSaveButton'
import { useCollection } from '@/context/CollectionContext'
import { stickerShareLabel } from '@/utils/shareTexts'
import { collectionStats } from '@/utils/stats'

type Props = {
  onOpenSticker?: (entry: CatalogEntry) => void
  notify: (msg: string) => void
}

export function DuplicatesBottomSection({ onOpenSticker, notify }: Props) {
  const { catalog, state } = useCollection()
  const s = collectionStats(catalog, state)

  const rows = useMemo(() => {
    const byId = new Map(catalog.map((e) => [e.id, e]))
    return s.duplicateById
      .map(({ id, extra }) => {
        const entry = byId.get(id)
        return entry ? { entry, extra } : null
      })
      .filter((x): x is { entry: CatalogEntry; extra: number } => x !== null)
      .sort((a, b) => b.extra - a.extra || a.entry.id - b.entry.id)
  }, [catalog, s.duplicateById])

  return (
    <section
      className="pt-1 pb-36"
      aria-labelledby="repetidas-secao-titulo"
    >
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <h2
            id="repetidas-secao-titulo"
            className="text-sm font-black uppercase tracking-wide text-slate-500"
          >
            Repetidas
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Cópias além da primeira no álbum. Toque em uma figurinha para abrir o editor de quantidade.
          </p>
          <div className="mt-3 sm:hidden">
            <ManualCloudSaveButton notify={notify} className="w-full min-h-11" />
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="hidden sm:block">
            <ManualCloudSaveButton notify={notify} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center text-xs font-medium text-slate-700 shadow-sm sm:justify-self-end">
          <div className="text-base font-bold text-rose-700">{s.duplicateTotal}</div>
          <div className="text-[11px] text-slate-600">Repetidas</div>
          </div>
        </div>
      </div>

      {s.duplicateTotal === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center shadow-sm">
          <p className="text-sm text-slate-600">Sem figurinhas repetidas registradas.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ entry, extra }) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onOpenSticker?.(entry)}
                className="flex w-full min-h-[3rem] touch-manipulation items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm transition [-webkit-touch-callout:none] hover:bg-slate-50 active:scale-[0.99]"
              >
                <span className="font-semibold text-slate-900">{stickerShareLabel(entry)}</span>
                <span className="shrink-0 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  {extra > 99 ? '99+' : extra}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
