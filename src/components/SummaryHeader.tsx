import { collectionStats } from '@/utils/stats'
import { useCollection } from '@/context/CollectionContext'

export function SummaryHeader({ query }: { query: string }) {
  const { catalog, state } = useCollection()
  const s = collectionStats(catalog, state)

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/95 px-4 pb-4 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">Copa 2026</h1>
          <p className="text-xs text-slate-600">
            Panini FIFA WC 2026 · 980 posições (00 · FWC · seleções)
            {query.trim() ? ' · filtro ligado' : ''}
          </p>
        </div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-right">
          <div className="text-lg font-black leading-none text-teal-900">{s.pct}%</div>
          <div className="text-[11px] font-medium leading-tight text-teal-800">Completo</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium text-slate-700">
        <div className="rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm">
          <div className="text-base font-bold text-slate-900">{s.withAlbum}</div>
          <div className="text-[11px] text-slate-600">No álbum</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm">
          <div className="text-base font-bold text-amber-700">{s.missingCount}</div>
          <div className="text-[11px] text-slate-600">Faltam</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm">
          <div className="text-base font-bold text-rose-700">{s.duplicateTotal}</div>
          <div className="text-[11px] text-slate-600">Extras / troca</div>
        </div>
      </div>
    </header>
  )
}
