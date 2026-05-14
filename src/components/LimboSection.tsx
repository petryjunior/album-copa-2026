import { useMemo } from 'react'
import type { CatalogEntry } from '@/types/catalog'
import { ManualCloudSaveButton } from '@/components/ManualCloudSaveButton'
import { useCollection } from '@/context/CollectionContext'
import { stickerShareLabel } from '@/utils/shareTexts'

type Props = {
  onOpenSticker: (entry: CatalogEntry) => void
  notify: (msg: string) => void
}

export function LimboSection({ onOpenSticker, notify }: Props) {
  const { catalog, limboState } = useCollection()

  const rows = useMemo(() => {
    return catalog
      .filter((e) => (limboState[e.id] ?? 0) > 0)
      .sort((a, b) => a.id - b.id)
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
                    <span className="font-semibold text-slate-900">{stickerShareLabel(e)}</span>
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
