import { useState } from 'react'
import { resolveAlbumStickerList } from '@/utils/parseAlbumCodes'
import { useCollection } from '@/context/CollectionContext'

export function PasteToolbar({ onToast }: { onToast: (msg: string) => void }) {
  const { bulkEnsureMin, bulkAdd, catalog } = useCollection()
  const [raw, setRaw] = useState('')

  function apply(kind: 'min1' | 'add1') {
    const res = resolveAlbumStickerList(raw, catalog)
    if (!res.ids.length) {
      onToast(res.errors.slice(0, 3).join(' ') + (res.errors.length > 3 ? ' …' : ''))
      return
    }

    const warn = res.errors.length ? `\n⚠️ ${res.errors.slice(0, 2).join(' ')}` : ''

    if (kind === 'min1') {
      bulkEnsureMin(res.ids, 1)
      onToast(`Registrei “pelo menos 1” em ${res.ids.length} figurinha(s).${warn}`)
    } else {
      bulkAdd(res.ids, 1)
      onToast(`Somei +1 repetida em ${res.ids.length} figurinha(s).${warn}`)
    }
    setRaw('')
  }

  return (
    <div className="mb-5 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Registrar várias figurinhas
      </label>
      <textarea
        value={raw}
        placeholder="Ex.: 00, FWC 3, FWC 1–5, BRA 12, Brasil 13–14"
        rows={3}
        onChange={(e) => setRaw(e.target.value)}
        className="mb-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500/30 focus:bg-white focus:ring-4"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => apply('min1')}
          title="Para cada figurinha listada abaixo, se você ainda está com quantidade zero, marca como tendo pelo menos uma."
          className="flex-1 min-w-[140px] rounded-2xl bg-teal-700 px-3 py-3 text-xs font-semibold leading-snug text-white hover:bg-teal-800 sm:text-sm"
        >
          Tenho estas (pelo menos 1)
        </button>
        <button
          type="button"
          onClick={() => apply('add1')}
          title="Soma mais 1 repetida em cada figurinha reconhecida (útil quando abrir pacotes)."
          className="flex-1 min-w-[140px] rounded-2xl border border-teal-200 bg-teal-50 px-3 py-3 text-xs font-semibold leading-snug text-teal-950 hover:bg-teal-100 sm:text-sm"
        >
          +1 repetida em cada
        </button>
      </div>
      <p className="mt-3 space-y-1 text-[11px] leading-snug text-slate-600">
        <span className="block">
          Separe <strong className="font-semibold text-slate-700">somente por vírgula</strong> cada entrada (não use
          espaço ou ponto e vírgula entre figurinhas).
          <br />
          • <strong>Panini 00:</strong>{' '}
          <code className="rounded bg-slate-100 px-1 text-slate-900">00</code> ou{' '}
          <code className="rounded bg-slate-100 px-1 text-slate-900">panini</code>
          <br />• <strong>Especiais FWC:</strong>{' '}
          <code className="rounded bg-slate-100 px-1 text-slate-900">FWC 7</code> ou intervalo{' '}
          <code className="rounded bg-slate-100 px-1 text-slate-900">FWC 9–13</code>
          <br />• <strong>Seleção (número 1–20 do país):</strong>{' '}
          <code className="rounded bg-slate-100 px-1 text-slate-900">BRA 12</code>,{' '}
          <code className="rounded bg-slate-100 px-1 text-slate-900">Brasil 12–14</code>,
          mesmo com <code className="rounded bg-slate-100 px-1 text-slate-900">Mex 3–5</code>
        </span>
      </p>
    </div>
  )
}
