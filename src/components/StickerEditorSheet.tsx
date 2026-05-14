import { BottomSheet } from '@/components/BottomSheet'
import { ManualCloudSaveButton } from '@/components/ManualCloudSaveButton'
import { useCollection } from '@/context/CollectionContext'
import type { CatalogEntry } from '@/types/catalog'

type Props = {
  entry: CatalogEntry
  notify: (msg: string) => void
  onClose: () => void
}

export function StickerEditorSheet({ entry, notify, onClose }: Props) {
  const { state, limboState, setQty, inc, incLimbo } = useCollection()
  const qty = state[entry.id] ?? 0
  const limboQty = limboState[entry.id] ?? 0

  const title =
    entry.segment === 'team'
      ? `${entry.teamCode} · ${entry.displayPrinted}`
      : entry.segment === 'panini'
        ? 'Panini · 00'
        : entry.displayPrinted

  const subtitle =
    entry.segment === 'team'
      ? `Grupo ${entry.group} · ${entry.teamName} · número impresso ${entry.displayPrinted} da seleção`
      : entry.extraLabel ?? 'Especial do álbum'

  return (
    <BottomSheet open title={title} onClose={onClose}>
      <p className="mb-0.5 text-[11px] leading-snug text-slate-600 sm:mb-1 sm:text-sm">{subtitle}</p>
      <details className="mb-2 text-[10px] leading-snug text-slate-500 sm:mb-4 sm:text-xs [&_summary]:cursor-pointer [&_summary]:text-slate-600">
        <summary className="font-medium text-slate-600">Migrar coleção via número interno (opcional)</summary>
        <p className="mt-1.5 text-[10px] leading-snug text-slate-500 sm:mt-2 sm:text-xs">
          Só aparece aos que importaram backups gerados antes desta página: na colagem use{' '}
          <kbd className="rounded border border-slate-200 px-0.5 text-[9px] sm:px-1 sm:text-[11px]">#{entry.id}</kbd> ou{' '}
          <kbd className="rounded border border-slate-200 px-0.5 text-[9px] sm:px-1 sm:text-[11px]">
            INTERNO {entry.id}
          </kbd>{' '}
          — são ordem física técnica não impresso na figurinha seleção/FWC/Panini.
        </p>
      </details>
      {entry.metalizada && (
        <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] leading-snug text-amber-950 sm:mb-3 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
          Cromo com acabamento especial (metalizado) segundo a coleção oficial.
        </p>
      )}
      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:mb-1 sm:text-xs">
        No álbum
      </p>
      <div className="flex items-center justify-center gap-4 py-1 sm:gap-6 sm:py-2">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-lg font-bold text-slate-800 hover:bg-slate-100 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl"
          aria-label="Diminuir uma cópia no álbum"
          onClick={() => inc(entry.id, -1)}
        >
          −
        </button>
        <div className="min-w-10 text-center text-lg font-extrabold tabular-nums text-slate-900 sm:min-w-16 sm:text-3xl">
          {qty}
        </div>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-700 bg-teal-600 text-lg font-bold text-white hover:bg-teal-700 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl"
          aria-label="Aumentar uma cópia no álbum"
          onClick={() => inc(entry.id, 1)}
        >
          +
        </button>
      </div>
      <p className="mb-0.5 mt-3 text-[10px] font-semibold uppercase tracking-wide text-violet-700 sm:mb-1 sm:mt-5 sm:text-xs">
        No limbo
      </p>
      <div className="flex items-center justify-center gap-4 py-1 sm:gap-6 sm:py-2">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300 bg-violet-50 text-lg font-bold text-violet-900 hover:bg-violet-100 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl"
          aria-label="Diminuir uma no limbo"
          onClick={() => incLimbo(entry.id, -1)}
        >
          −
        </button>
        <div className="min-w-10 text-center text-lg font-extrabold tabular-nums text-violet-950 sm:min-w-16 sm:text-3xl">
          {limboQty}
        </div>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-600 bg-violet-600 text-lg font-bold text-white hover:bg-violet-700 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl"
          aria-label="Aumentar uma no limbo"
          onClick={() => incLimbo(entry.id, 1)}
        >
          +
        </button>
      </div>
      <div className="mt-3 grid gap-1.5 sm:mt-6 sm:gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setQty(entry.id, 1)}
          className="rounded-xl border border-slate-200 bg-white py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 sm:rounded-2xl sm:py-3 sm:text-sm"
        >
          Só uma no álbum
        </button>
        <button
          type="button"
          onClick={() => setQty(entry.id, 0)}
          className="rounded-xl border border-rose-200 bg-rose-50 py-2 text-[11px] font-semibold text-rose-900 hover:bg-rose-100 sm:rounded-2xl sm:py-3 sm:text-sm"
        >
          Remover todas do álbum
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-snug text-slate-500 sm:mt-4 sm:text-xs sm:leading-normal">
        <strong>No álbum:</strong> quantas iguais você já colou ou conta como no álbum. O que passa da primeira vira
        repetida (marcador rosado na grade). <strong>No limbo:</strong> só trocas ainda não coladas — ao subir o número
        no álbum (grade ou + aqui), o limbo desce na mesma medida. Lista em Mais → Limbo.
      </p>
      <div className="mt-3 flex justify-center sm:mt-6">
        <ManualCloudSaveButton
          notify={notify}
          className="!min-h-9 !px-2.5 !py-1.5 !text-xs sm:!min-h-11 sm:!px-3 sm:!py-2 sm:!text-sm w-full max-w-xs sm:w-auto"
        />
      </div>
    </BottomSheet>
  )
}
