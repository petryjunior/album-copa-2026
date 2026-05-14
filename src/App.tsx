import { useDeferredValue, useMemo, useState } from 'react'
import type { CatalogEntry } from '@/types/catalog'
import { AuthProvider } from '@/context/AuthContext'
import { CollectionProvider, useCollection } from '@/context/CollectionContext'
import { CloudSyncProvider } from '@/context/CloudSyncContext'
import { BottomTabs, type TabId } from '@/components/BottomTabs'
import { PasteToolbar } from '@/components/PasteToolbar'
import { StickerEditorSheet } from '@/components/StickerEditorSheet'
import { StickerGrid } from '@/components/StickerGrid'
import { SummaryHeader } from '@/components/SummaryHeader'
import { TeamBrowser } from '@/components/TeamBrowser'
import { MorePage } from '@/components/MorePage'
import { DuplicatesBottomSection } from '@/components/DuplicatesBottomSection'
import { ManualCloudSaveButton } from '@/components/ManualCloudSaveButton'
function searchableBlob(entry: CatalogEntry): string {
  const parts = [
    String(entry.id),
    entry.displayPrinted,
    entry.teamName ?? '',
    entry.teamCode ?? '',
    entry.extraLabel ?? '',
    entry.group ? `grupo ${entry.group}` : '',
    entry.fwcNumber != null ? `fwc ${entry.fwcNumber} fwc${entry.fwcNumber}` : '',
    entry.segment,
    entry.segment === 'panini' ? 'panini 00 zero' : '',
  ]
  return parts.join(' ').toLowerCase()
}

function matchesQuery(entry: CatalogEntry, qRaw: string) {
  const q = qRaw.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!q) return true
  return searchableBlob(entry).includes(q)
}

function AppShell() {
  const { catalog, state, setQty } = useCollection()
  const [tab, setTab] = useState<TabId>('todas')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [toast, setToast] = useState<string | null>(null)
  const [activeEntry, setActiveEntry] = useState<CatalogEntry | null>(null)

  const notify = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3200)
  }

  const extras = useMemo(() => catalog.filter((e) => e.segment !== 'team'), [catalog])

  const filtered = useMemo(() => {
    if (tab === 'times' || tab === 'mais' || tab === 'repetidas') return []
    let list: CatalogEntry[] = catalog
    if (tab === 'faltando') {
      list = list.filter((e) => (state[e.id] ?? 0) < 1)
    }
    if (tab === 'extras') {
      list = extras
    }
    return list.filter((e) => matchesQuery(e, deferredQuery))
  }, [catalog, deferredQuery, extras, state, tab])

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col">
      {toast && (
        <div className="fixed inset-x-4 top-[max(env(safe-area-inset-top),0.75rem)] z-50 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-950 shadow-lg sm:left-1/2 sm:w-auto sm:-translate-x-1/2">
          {toast}
        </div>
      )}

      <SummaryHeader />

      <main className="flex-1 px-4 pt-4">
        {(tab === 'todas' || tab === 'faltando' || tab === 'extras') && (
          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Buscar
            </label>
            <input
              value={query}
              placeholder="Posição 1–980, 00, FWC, país, grupo…"
              aria-label="Buscar figurinha"
              type="search"
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm ring-teal-500/30 transition focus:border-teal-600 focus:ring-4 min-h-[3rem]"
            />
          </div>
        )}

        {tab === 'extras' && (
          <p className="mb-4 text-sm leading-relaxed text-slate-700">
            Aqui aparecem a figurinha <strong>00</strong> da Panini, os cromos <strong>FWC 1 a 8</strong> (antes das seleções) e os <strong>FWC 9 a 19</strong> (fechamento do álbum).
          </p>
        )}

        {(tab === 'todas' || tab === 'faltando' || tab === 'extras') && (
          <>
            <div className="mb-3 flex justify-end">
              <ManualCloudSaveButton notify={notify} />
            </div>
            <StickerGrid
              entries={filtered}
              qtyOf={(id) => state[id] ?? 0}
              onMarkHaveOne={(e) => {
                const q = state[e.id] ?? 0
                setQty(e.id, q >= 1 ? 0 : 1)
              }}
              onOpenEditor={(e) => setActiveEntry(e)}
            />

            {(tab === 'todas' || tab === 'faltando') && (
              <div className="mt-8">
                <PasteToolbar onToast={notify} />
              </div>
            )}
          </>
        )}

        {tab === 'repetidas' && <DuplicatesBottomSection onOpenSticker={setActiveEntry} notify={notify} />}

        {tab === 'times' && <TeamBrowser onPick={setActiveEntry} notify={notify} />}
        {tab === 'mais' && <MorePage notify={notify} onOpenSticker={setActiveEntry} />}
      </main>

      {activeEntry ? (
        <StickerEditorSheet entry={activeEntry} notify={notify} onClose={() => setActiveEntry(null)} />
      ) : null}

      <BottomTabs tab={tab} setTab={setTab} />

      {/* Spacer só para layout desktop onde o usuário faz scroll até o rodapé visual */}
      <div className="h-4 shrink-0" aria-hidden />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CollectionProvider>
        <CloudSyncProvider>
          <AppShell />
        </CloudSyncProvider>
      </CollectionProvider>
    </AuthProvider>
  )
}
