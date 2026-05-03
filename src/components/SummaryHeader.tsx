import { collectionStats } from '@/utils/stats'
import { useCollection } from '@/context/CollectionContext'
import { DEV_SOURCE_MARK } from '@/workspaceMark'

const pctFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

export function SummaryHeader() {
  const { catalog, state } = useCollection()
  const s = collectionStats(catalog, state)

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/95 px-4 pb-4 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="text-xl font-black tracking-tight text-slate-900">Copa 2026</h1>
            {import.meta.env.DEV ? (
              <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-amber-950 ring-2 ring-amber-500/40">
                Dev
              </span>
            ) : null}
          </div>
          {import.meta.env.DEV ? (
            <p className="mt-1 select-all rounded bg-orange-50 px-1 py-0.5 font-mono text-[10px] leading-tight text-orange-900 ring-1 ring-orange-300/60">
              {DEV_SOURCE_MARK} — se não vê isto, o dev server não é esta pasta
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-right">
          <div className="text-lg font-black leading-none text-teal-900">{pctFormat.format(s.pct)}%</div>
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
          <div className="text-[11px] text-slate-600">Repetidas</div>
        </div>
      </div>
    </header>
  )
}
