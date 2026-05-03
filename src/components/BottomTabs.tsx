const tabs = [
  { id: 'todas' as const, label: 'Todas' },
  { id: 'faltando' as const, label: 'Faltando' },
  { id: 'repetidas' as const, label: 'Repetidas' },
  { id: 'times' as const, label: 'Seleções' },
  { id: 'extras' as const, label: 'Especiais' },
  { id: 'mais' as const, label: 'Mais' },
]

export type TabId = (typeof tabs)[number]['id']

type Props = {
  tab: TabId
  setTab: (t: TabId) => void
}

export function BottomTabs({ tab, setTab }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-between gap-0.5 border-t border-slate-200 bg-white px-1 pb-[max(env(safe-area-inset-bottom),0.65rem)] pt-2 shadow-[0_-10px_30px_-15px_rgb(15_23_42/0.35)] sm:gap-1 sm:px-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={tab === t.id}
          aria-current={tab === t.id ? 'page' : undefined}
          className={`min-h-11 min-w-0 flex-1 shrink rounded-2xl px-0.5 py-1.5 text-[10px] font-semibold leading-tight sm:min-w-[3.25rem] sm:px-1 sm:py-2 sm:text-[11px] sm:leading-none md:text-xs ${
            tab === t.id ? 'bg-teal-700 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}
