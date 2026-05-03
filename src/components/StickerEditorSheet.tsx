import { BottomSheet } from '@/components/BottomSheet'
import { useCollection } from '@/context/CollectionContext'
import type { CatalogEntry } from '@/types/catalog'

type Props = {
  entry: CatalogEntry
  onClose: () => void
}

export function StickerEditorSheet({ entry, onClose }: Props) {
  const { state, setQty, inc } = useCollection()
  const qty = state[entry.id] ?? 0

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
        para abrir este painel e escolher outra quantidade.
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
      <div className="flex items-center justify-center gap-6 py-2">
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 text-xl font-bold text-slate-800 hover:bg-slate-100"
          aria-label="Diminuir uma cópia"
          onClick={() => inc(entry.id, -1)}
        >
          −
        </button>
        <div className="min-w-16 text-center text-4xl font-extrabold text-slate-900">{qty}</div>
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-700 bg-teal-600 text-xl font-bold text-white hover:bg-teal-700"
          aria-label="Aumentar uma cópia"
          onClick={() => inc(entry.id, 1)}
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
          Remover todas
        </button>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Informe quantas figurinhas iguais você tem no total no bolso/arquivo. Todas que passam da primeira
        viram repetidas: o marcador rosado no canto mostra quantas cópias a mais você tem da mesma figurinha.
      </p>
    </BottomSheet>
  )
}
