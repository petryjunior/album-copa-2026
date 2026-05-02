import { useState } from 'react'
import { parseStickerInput } from '@/utils/ranges'
import { useCollection } from '@/context/CollectionContext'

export function PasteToolbar({ onToast }: { onToast: (msg: string) => void }) {
  const { bulkEnsureMin, bulkAdd, catalog } = useCollection()
  const [raw, setRaw] = useState('')

  function apply(kind: 'min1' | 'add1') {
    const ids = parseStickerInput(raw, catalog[catalog.length - 1]?.id ?? 980)
    if (!ids.length) {
      onToast('Digite pelo menos um número válido.')
      return
    }
    if (kind === 'min1') bulkEnsureMin(ids, 1)
    else bulkAdd(ids, 1)
    onToast(kind === 'min1' ? `Marcadas com ≥1 (${ids.length}).` : `Somado +1 em ${ids.length} figurinhas.`)
    setRaw('')
  }

  return (
    <div className="mb-5 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Registrar várias figurinhas
      </label>
      <textarea
        value={raw}
        placeholder="Ex.: 1, 45, 80-93"
        rows={2}
        onChange={(e) => setRaw(e.target.value)}
        className="mb-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500/30 focus:bg-white focus:ring-4"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => apply('min1')}
          className="flex-1 min-w-[140px] rounded-2xl bg-teal-700 px-3 py-3 text-xs font-semibold text-white hover:bg-teal-800 sm:text-sm"
        >
          Garantir 1 cópia
        </button>
        <button
          type="button"
          onClick={() => apply('add1')}
          className="flex-1 min-w-[140px] rounded-2xl border border-teal-200 bg-teal-50 px-3 py-3 text-xs font-semibold text-teal-900 hover:bg-teal-100 sm:text-sm"
        >
          Somar +1 em cada
        </button>
      </div>
      <p className="mt-3 text-[11px] leading-snug text-slate-500">
        Use os <strong># (1–980)</strong>, iguais à ordem física ({' '}
        <strong>Panini</strong>, <strong>FWC inicial</strong>, <strong>seleções</strong>,{' '}
        <strong>FWC final</strong>). Separe vírgulas, espaços ou quebras — intervalos funcionam (<code className="text-slate-800">10-20</code>,{' '}
        <code className="text-slate-800">960-969</code>).
      </p>
    </div>
  )
}
