const tabs = [
  { id: 'todas' as const, label: 'Todas' },
  { id: 'faltando' as const, label: 'Faltando' },
  { id: 'times' as const, label: 'Seleções' },
  { id: 'extras' as const, label: 'Extras' },
  { id: 'mais' as const, label: 'Mais' },
]

export type TabId = (typeof tabs)[number]['id']

type Props = {
  tab: TabId
  setTab: (t: TabId) => void
}

export function BottomTabs({ tab, setTab }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-between gap-1 border-t border-slate-200 bg-white px-2 pb-[max(env(safe-area-inset-bottom),0.65rem)] pt-2 shadow-[0_-10px_30px_-15px_rgb(15_23_42/0.35)]">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={tab === t.id}
          aria-current={tab === t.id ? 'page' : undefined}
          className={`min-h-11 min-w-[3.75rem] flex-1 shrink-0 rounded-2xl py-2 text-[11px] font-semibold sm:text-xs ${
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
