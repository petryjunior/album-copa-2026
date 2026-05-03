import type { CatalogEntry } from '@/types/catalog'

function chipClass(entry: CatalogEntry, has: boolean) {
  const base =
    'relative flex min-h-[3.25rem] min-w-[3.25rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-1.5 text-center font-semibold transition active:scale-[0.98] '
  if (entry.metalizada && !has) {
    return base + 'border-amber-400 bg-amber-50 text-amber-950 '
  }
  if (entry.metalizada && has) {
    return base + 'border-amber-500 bg-gradient-to-br from-teal-600 via-teal-500 to-amber-400 text-white shadow '
  }
  if (has) return base + 'border-teal-700 bg-teal-600 text-white shadow '
  return base + 'border-slate-300 bg-white text-slate-800 shadow-sm '
}

type Props = {
  entry: CatalogEntry
  qty: number
  onOpen: () => void
}

/** O que aparece impresso atrás/album — não usamos número global ao utilizador. */
function stickerPublicLabel(entry: CatalogEntry): string {
  if (entry.segment === 'panini') return 'Panini 00'
  if (entry.segment === 'fwc') return `FWC ${entry.fwcNumber}`
  return `${entry.teamCode} · ${entry.displayPrinted}`
}

function PrimaryLabel({ entry, has }: { entry: CatalogEntry; has: boolean }) {
  if (entry.segment === 'team') {
    const codeClr = has ? 'text-teal-50' : 'text-slate-500'
    return (
      <>
        <span className="text-base font-black leading-none tracking-tight">{entry.displayPrinted}</span>
        <span className={`text-[9px] font-bold uppercase leading-none ${codeClr}`}>{entry.teamCode}</span>
      </>
    )
  }
  if (entry.segment === 'panini') {
    return <span className="text-lg font-black leading-none">00</span>
  }
  const n = entry.fwcNumber ?? ''
  return (
    <span className="flex flex-col items-center leading-none">
      <span className={`text-[8px] font-bold uppercase tracking-wider ${has ? 'text-white/90' : 'text-slate-600'}`}>
        FWC
      </span>
      <span className="text-sm font-black">{n}</span>
    </span>
  )
}

export function StickerChip({ entry, qty, onOpen }: Props) {
  const has = qty >= 1
  const dup = Math.max(0, qty - 1)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={chipClass(entry, has)}
      aria-label={`Figurinha ${stickerPublicLabel(entry)}${has ? ', registada como tendo pelo menos uma' : ', falta'}`}
    >
      <PrimaryLabel entry={entry} has={has} />
      {dup > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
          {dup > 99 ? '99+' : dup}
        </span>
      )}
    </button>
  )
}
