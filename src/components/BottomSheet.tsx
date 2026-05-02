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
        className="relative z-10 w-full max-w-md rounded-t-3xl rounded-b-none bg-white p-4 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-2xl sm:rounded-3xl sm:rounded-b-3xl"
      >
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-200 sm:hidden" />
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="sheet-title" className="truncate text-lg font-bold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
