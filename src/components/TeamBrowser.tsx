import { useMemo, useState } from 'react'
import type { CatalogEntry } from '@/types/catalog'
import { getTeamsUnique } from '@/catalog/catalog'
import { StickerGrid } from '@/components/StickerGrid'
import { useCollection } from '@/context/CollectionContext'

export function TeamBrowser({ onPick }: { onPick: (entry: CatalogEntry) => void }) {
  const { catalog, state } = useCollection()
  const teams = useMemo(() => getTeamsUnique(), [])
  const [code, setCode] = useState<string | null>(null)

  const entries = useMemo(() => {
    if (!code) return []
    return catalog.filter((e) => e.teamCode === code)
  }, [catalog, code])

  if (!code) {
    return (
      <div className="grid gap-2 pb-36 sm:grid-cols-2">
        {teams.map((t) => (
          <button
            key={t.code}
            type="button"
            onClick={() => setCode(t.code)}
            className="flex min-h-[3.75rem] items-center rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
          >
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Grupo {t.group}</span>
              <span className="text-base font-semibold text-slate-900">{t.name}</span>
            </div>
          </button>
        ))}
      </div>
    )
  }

  const team = teams.find((t) => t.code === code)!

  return (
    <div className="space-y-3 pb-36">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCode(null)}
          className="rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
        >
          Voltar às seleções
        </button>
        <div className="text-sm font-bold text-slate-900">{team.group} · {team.name}</div>
      </div>
      <StickerGrid entries={entries} qtyOf={(id) => state[id] ?? 0} onPick={onPick} />
    </div>
  )
}
