import { useEffect, useRef, type CSSProperties } from 'react'
import type { CatalogEntry } from '@/types/catalog'
import type { TeamVisualTheme } from '@/lib/teamThemes'

function chipAppearance(
  entry: CatalogEntry,
  has: boolean,
  theme?: TeamVisualTheme | null,
): { className: string; style?: CSSProperties } {
  const base =
    'relative touch-manipulation flex min-h-[3.25rem] min-w-[3.25rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-solid px-1.5 py-1.5 text-center font-semibold transition [-webkit-touch-callout:none] active:scale-[0.98] '

  const useNation = Boolean(theme && entry.segment === 'team')

  if (entry.metalizada && !has) {
    return { className: base + 'border-amber-400 bg-amber-50 text-amber-950 ' }
  }
  if (entry.metalizada && has) {
    if (useNation && theme) {
      return {
        className: base + 'text-white shadow ',
        style: {
          borderColor: theme.accent,
          background: `linear-gradient(145deg, ${theme.primary}, ${theme.primaryDark}, #d97706)`,
        },
      }
    }
    return { className: base + 'border-amber-500 bg-gradient-to-br from-teal-600 via-teal-500 to-amber-400 text-white shadow ' }
  }
  if (has) {
    if (useNation && theme) {
      return {
        className: base + 'text-white shadow ',
        style: {
          borderColor: theme.primaryDark,
          background: `linear-gradient(145deg, ${theme.primary}, ${theme.primaryDark})`,
        },
      }
    }
    return { className: base + 'border-teal-700 bg-teal-600 text-white shadow ' }
  }
  if (useNation && theme) {
    return {
      className: base + 'text-slate-900 shadow-sm ',
      style: {
        borderColor: `${theme.accent}77`,
        backgroundColor: `${theme.primary}12`,
      },
    }
  }
  return { className: base + 'border-slate-300 bg-white text-slate-800 shadow-sm ' }
}

const LONG_PRESS_MS = 550

type Props = {
  entry: CatalogEntry
  qty: number
  /** Toque / clique esquerdo: tem pelo menos 1 cópia */
  onMarkHaveOne: () => void
  /** Clique direito (desktop) ou manter (telemóvel): escolher quantidade */
  onOpenEditor: () => void
  /** Quando definido (vista Seleções → país), cromos usam as cores da seleção */
  visualTheme?: TeamVisualTheme | null
}

/** O que aparece impresso atrás/album — não usamos número global ao utilizador. */
function stickerPublicLabel(entry: CatalogEntry): string {
  if (entry.segment === 'panini') return 'Panini 00'
  if (entry.segment === 'fwc') return `FWC ${entry.fwcNumber}`
  return `${entry.teamCode} · ${entry.displayPrinted}`
}

function PrimaryLabel({
  entry,
  has,
  theme,
}: {
  entry: CatalogEntry
  has: boolean
  theme?: TeamVisualTheme | null
}) {
  if (entry.segment === 'team') {
    const codeCls = has
      ? 'text-white/90'
      : theme
        ? 'font-bold opacity-95'
        : 'text-slate-500'
    const codeStyle: CSSProperties | undefined =
      !has && theme ? { color: theme.primary } : undefined
    return (
      <>
        <span className="text-base font-black leading-none tracking-tight">{entry.displayPrinted}</span>
        <span className={`text-[9px] uppercase leading-none ${codeCls}`} style={codeStyle}>
          {entry.teamCode}
        </span>
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

export function StickerChip({ entry, qty, onMarkHaveOne, onOpenEditor, visualTheme }: Props) {
  const has = qty >= 1
  const dup = Math.max(0, qty - 1)
  const { className: chipCls, style: chipStyle } = chipAppearance(entry, has, visualTheme)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressNextClickRef = useRef(false)

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    }
  }, [])

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleTouchStart = () => {
    clearLongPressTimer()
    suppressNextClickRef.current = false
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null
      suppressNextClickRef.current = true
      onOpenEditor()
    }, LONG_PRESS_MS)
  }

  const handleTouchEndOrCancel = () => {
    clearLongPressTimer()
  }

  const handleTouchMove = () => {
    clearLongPressTimer()
  }

  const handleClick = () => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }
    onMarkHaveOne()
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onOpenEditor()
  }

  const label = stickerPublicLabel(entry)
  const ariaHint = has
    ? ', registada como tendo pelo menos uma'
    : ', falta'

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEndOrCancel}
      onTouchCancel={handleTouchEndOrCancel}
      onTouchMove={handleTouchMove}
      title="Toque: tenho 1 · Manter / clique direito: quantidade"
      className={chipCls}
      style={chipStyle}
      aria-label={`Figurinha ${label}${ariaHint}. Toque ou clique para marcar que tem uma cópia. Clique direito ou mantenha pressionado para definir a quantidade.`}
    >
      <PrimaryLabel entry={entry} has={has} theme={visualTheme} />
      {dup > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
          {dup > 99 ? '99+' : dup}
        </span>
      )}
    </button>
  )
}
