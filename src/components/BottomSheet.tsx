import { useEffect } from 'react'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function BottomSheet({ open, title, children, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 sm:items-center sm:p-8">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default touch-manipulation border-0 bg-transparent"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="sheet-title"
        className="relative z-10 flex max-h-[min(92dvh,calc(100dvh-0.75rem))] w-full max-w-md flex-col overflow-hidden rounded-t-3xl rounded-b-none bg-white shadow-2xl sm:max-h-[min(90vh,720px)] sm:rounded-3xl sm:rounded-b-3xl"
      >
        <div className="shrink-0 px-3 pb-2 pt-2 sm:px-4 sm:pb-0 sm:pt-4">
          <div className="mx-auto mb-2 h-1 w-12 shrink-0 rounded-full bg-slate-200 sm:hidden" />
          <div className="flex items-start justify-between gap-2 sm:mb-1 sm:items-center">
            <h2 id="sheet-title" className="min-w-0 flex-1 truncate text-sm font-bold leading-snug text-slate-900 sm:text-lg">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 sm:rounded-xl sm:px-3 sm:py-1 sm:text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-0 sm:px-4 sm:pb-4">
          {children}
        </div>
      </div>
    </div>
  )
}
