import { useMemo } from 'react'
import type { CatalogEntry } from '@/types/catalog'
import { ManualCloudSaveButton } from '@/components/ManualCloudSaveButton'
import { TeamFlag } from '@/components/TeamFlag'
import { useCollection } from '@/context/CollectionContext'
import { stickerShareLabel } from '@/utils/shareTexts'

type Props = {
  onOpenSticker: (entry: CatalogEntry) => void
  notify: (msg: string) => void
}

/** Ordem brochura: 00 → FWC 1–8 → grupos A–L (ordem física do catálogo) → FWC 9–19. */
function limboSortOrder(e: CatalogEntry): { tier: number; a: number; b: number } {
  if (e.segment === 'panini') return { tier: 0, a: 0, b: 0 }
  if (e.segment === 'fwc' && e.fwcNumber != null) {
    if (e.fwcNumber <= 8) return { tier: 1, a: e.fwcNumber, b: 0 }
    return { tier: 3, a: e.fwcNumber, b: 0 }
  }
  if (e.segment === 'team' && e.group) {
    const g = e.group.toUpperCase().charCodeAt(0) - 65
    return { tier: 2, a: g, b: e.id }
  }
  return { tier: 9, a: e.id, b: 0 }
}

function cmpLimboAlbum(a: CatalogEntry, b: CatalogEntry): number {
  const oa = limboSortOrder(a)
  const ob = limboSortOrder(b)
  if (oa.tier !== ob.tier) return oa.tier - ob.tier
  if (oa.a !== ob.a) return oa.a - ob.a
  return oa.b - ob.b
}

export function LimboSection({ onOpenSticker, notify }: Props) {
  const { catalog, limboState } = useCollection()

  const rows = useMemo(() => {
    return catalog.filter((e) => (limboState[e.id] ?? 0) > 0).sort(cmpLimboAlbum)
  }, [catalog, limboState])

  const totalPieces = useMemo(
    () => catalog.reduce((acc, e) => acc + Math.max(0, limboState[e.id] ?? 0), 0),
    [catalog, limboState],
  )

  return (
    <section className="rounded-3xl border border-violet-200 bg-violet-50/40 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-black text-slate-900">Limbo</h2>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-slate-700">
            Figurinhas que você já conseguiu em trocas mas <strong>ainda não colou no álbum</strong>. Ao aumentar a
            quantidade <strong>no álbum</strong> (grade ou editor), o app remove do limbo na mesma medida — não precisa
            zerar o limbo à mão.
          </p>
        </div>
        <ManualCloudSaveButton notify={notify} className="shrink-0" />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-violet-200 bg-white/80 px-3 py-4 text-center text-sm text-slate-600">
          Nada no limbo. Quando receber figurinhas em troca antes de colar, use o contador <strong>No limbo</strong> neste
          editor (toque longo na grade ou em Repetidas). Ao marcar no <strong>álbum</strong> (toque na grade ou + em «No
          álbum»), o app baixa o limbo na mesma quantidade.
        </p>
      ) : (
        <>
          <p className="mb-2 text-xs font-semibold text-violet-950">
            {rows.length} tipo{rows.length === 1 ? '' : 's'} · {totalPieces} figurinha{totalPieces === 1 ? '' : 's'}{' '}
            fora do álbum
          </p>
          <ul className="max-h-[min(22rem,50vh)] space-y-2 overflow-y-auto pr-0.5">
            {rows.map((e) => {
              const n = limboState[e.id] ?? 0
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => onOpenSticker(e)}
                    className="flex w-full min-h-[3rem] touch-manipulation items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm transition hover:bg-violet-50 active:scale-[0.99]"
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2.5">
                      {e.segment === 'team' && e.teamCode ? (
                        <TeamFlag
                          code={e.teamCode}
                          title={e.teamName ?? e.teamCode}
                          className="!h-6 !w-8 shrink-0 rounded-sm shadow-sm ring-1 ring-slate-200/80"
                        />
                      ) : null}
                      <span className="truncate font-semibold text-slate-900">{stickerShareLabel(e)}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-bold text-white tabular-nums">
                      {n > 999 ? '999+' : n} no limbo
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
