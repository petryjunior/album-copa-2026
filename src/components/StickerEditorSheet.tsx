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
  const { state, limboState, setQty, setLimboQty, inc, incLimbo } = useCollection()
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
      <p className="mb-1 text-sm text-slate-600">{subtitle}</p>
      <p className="mb-3 text-xs text-slate-500">
        Na grade: toque ou clique para alternar entre <strong>sem</strong> cópia e ter <strong>1</strong> cópia (com
        pelo menos uma, toque de novo para limpar); mantenha pressionado (celular) ou clique com o botão direito (mouse)
        para abrir este painel e escolher outra quantidade. O contador <strong>No limbo</strong> é só para figurinhas que
        você já tem em troca mas <strong>ainda não colou no álbum</strong> — não entra em faltantes nem em repetidas do
        álbum.
      </p>
      <details className="mb-4 text-xs text-slate-500 [&_summary]:cursor-pointer [&_summary]:text-slate-600">
        <summary className="font-medium text-slate-600">Migrar coleção via número interno (opcional)</summary>
        <p className="mt-2 text-slate-500">
          Só aparece aos que importaram backups gerados antes desta página: na colagem use{' '}
          <kbd className="rounded border border-slate-200 px-1">#{entry.id}</kbd> ou{' '}
          <kbd className="rounded border border-slate-200 px-1">INTERNO {entry.id}</kbd> — são ordem física técnica não
          impresso na figurinha seleção/FWC/Panini.
        </p>
      </details>
      {entry.metalizada && (
        <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Cromo com acabamento especial (metalizado) segundo a coleção oficial.
        </p>
      )}
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">No álbum</p>
      <div className="flex items-center justify-center gap-6 py-2">
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 text-xl font-bold text-slate-800 hover:bg-slate-100"
          aria-label="Diminuir uma cópia no álbum"
          onClick={() => inc(entry.id, -1)}
        >
          −
        </button>
        <div className="min-w-16 text-center text-4xl font-extrabold text-slate-900">{qty}</div>
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-700 bg-teal-600 text-xl font-bold text-white hover:bg-teal-700"
          aria-label="Aumentar uma cópia no álbum"
          onClick={() => inc(entry.id, 1)}
        >
          +
        </button>
      </div>
      <p className="mb-1 mt-5 text-xs font-semibold uppercase tracking-wide text-violet-700">No limbo</p>
      <div className="flex items-center justify-center gap-6 py-2">
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300 bg-violet-50 text-xl font-bold text-violet-900 hover:bg-violet-100"
          aria-label="Diminuir uma no limbo"
          onClick={() => incLimbo(entry.id, -1)}
        >
          −
        </button>
        <div className="min-w-16 text-center text-4xl font-extrabold text-violet-950">{limboQty}</div>
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-600 bg-violet-600 text-xl font-bold text-white hover:bg-violet-700"
          aria-label="Aumentar uma no limbo"
          onClick={() => incLimbo(entry.id, 1)}
        >
          +
        </button>
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setQty(entry.id, 1)}
          className="rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Só uma no álbum
        </button>
        <button
          type="button"
          onClick={() => setQty(entry.id, 0)}
          className="rounded-2xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-900 hover:bg-rose-100"
        >
          Remover todas do álbum
        </button>
      </div>
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setLimboQty(entry.id, 0)}
          className="w-full rounded-2xl border border-violet-200 bg-white py-3 text-sm font-semibold text-violet-900 hover:bg-violet-50"
        >
          Zerar limbo desta figurinha
        </button>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        <strong>No álbum:</strong> quantas iguais você já colou ou conta como no álbum. O que passa da primeira vira
        repetida (marcador rosado na grade). <strong>No limbo:</strong> só trocas ainda não coladas — use a lista em
        Mais → Limbo para não esquecer antes da próxima troca.
      </p>
      <div className="mt-6 flex justify-center">
        <ManualCloudSaveButton notify={notify} className="min-h-11 w-full max-w-xs sm:w-auto" />
      </div>
    </BottomSheet>
  )
}
