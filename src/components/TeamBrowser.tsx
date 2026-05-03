import { useMemo, useState } from 'react'
import type { CatalogEntry } from '@/types/catalog'
import { getTeamsUnique } from '@/catalog/catalog'
import { StickerGrid } from '@/components/StickerGrid'
import { useCollection } from '@/context/CollectionContext'
import { TeamFlag } from '@/components/TeamFlag'
import { getTeamTheme } from '@/lib/teamThemes'
import { ManualCloudSaveButton } from '@/components/ManualCloudSaveButton'

function TeamNameWithFlag({ code, name }: { code: string; name: string }) {
  return (
    <span className="flex items-center gap-3">
      <TeamFlag code={code} title={name} />
      <span className="text-base font-semibold text-slate-900">{name}</span>
    </span>
  )
}

type TeamRow = ReturnType<typeof getTeamsUnique>[number]

function normalizeSearch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function teamMatchesFilter(t: TeamRow, qRaw: string): boolean {
  const q = normalizeSearch(qRaw)
  if (!q) return true
  return normalizeSearch(t.name).includes(q) || normalizeSearch(t.code).includes(q)
}

type SortMode = 'group' | 'alpha'

export function TeamBrowser({
  onPick,
  notify,
}: {
  onPick: (entry: CatalogEntry) => void
  notify: (msg: string) => void
}) {
  const { catalog, state, setQty } = useCollection()
  const teams = useMemo(() => getTeamsUnique(), [])
  const [code, setCode] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('group')

  const groupSections = useMemo(() => {
    const order: string[] = []
    const byGroup = new Map<string, TeamRow[]>()
    for (const t of teams) {
      if (!byGroup.has(t.group)) {
        order.push(t.group)
        byGroup.set(t.group, [])
      }
      byGroup.get(t.group)!.push(t)
    }
    return order.map((g) => ({ group: g, teams: byGroup.get(g)! }))
  }, [teams])

  const filteredGroupSections = useMemo(() => {
    return groupSections
      .map(({ group, teams: list }) => ({
        group,
        teams: list.filter((t) => teamMatchesFilter(t, filter)),
      }))
      .filter((s) => s.teams.length > 0)
  }, [groupSections, filter])

  const alphaList = useMemo(() => {
    return teams
      .filter((t) => teamMatchesFilter(t, filter))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [teams, filter])

  const entries = useMemo(() => {
    if (!code) return []
    return catalog.filter((e) => e.teamCode === code)
  }, [catalog, code])

  if (!code) {
    return (
      <div className="space-y-5 pb-36">
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filtrar seleção
          </label>
          <input
            value={filter}
            type="search"
            placeholder="Nome do país ou código (ex. BRA, México)…"
            aria-label="Filtrar lista de seleções"
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm ring-teal-500/30 transition focus:border-teal-600 focus:ring-4 min-h-[3rem]"
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Ordem da lista">
            <button
              type="button"
              onClick={() => setSortMode('group')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                sortMode === 'group'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              Por grupo
            </button>
            <button
              type="button"
              onClick={() => setSortMode('alpha')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                sortMode === 'alpha'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              Ordem A–Z
            </button>
          </div>
        </div>

        {sortMode === 'group' && (
          <div className="space-y-6">
            {filteredGroupSections.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                Nenhuma seleção corresponde ao filtro.
              </p>
            ) : (
              filteredGroupSections.map(({ group, teams: list }) => (
                <section key={group}>
                  <h2 className="mb-2 text-xs font-normal uppercase tracking-[0.2em] text-slate-500">
                    Grupo {group}
                  </h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {list.map((t) => (
                      <button
                        key={t.code}
                        type="button"
                        onClick={() => setCode(t.code)}
                        className="flex min-h-[3.75rem] items-center rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
                      >
                        <TeamNameWithFlag code={t.code} name={t.name} />
                      </button>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        )}

        {sortMode === 'alpha' && (
          <div>
            {alphaList.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                Nenhuma seleção corresponde ao filtro.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {alphaList.map((t) => (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => setCode(t.code)}
                    className="flex min-h-[3.75rem] flex-col justify-center gap-1 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
                  >
                    <TeamNameWithFlag code={t.code} name={t.name} />
                    <span className="pl-11 text-xs uppercase tracking-[0.15em] text-slate-500">
                      Grupo {t.group}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const team = teams.find((t) => t.code === code)!
  const theme = getTeamTheme(team.code)
  const teamIndex = teams.findIndex((t) => t.code === code)
  const prevTeam = teamIndex > 0 ? teams[teamIndex - 1] : null
  const nextTeam = teamIndex >= 0 && teamIndex < teams.length - 1 ? teams[teamIndex + 1] : null

  return (
    <div
      className="-mx-4 space-y-4 rounded-b-3xl px-4 pb-36 pt-1 sm:-mx-0 sm:rounded-3xl sm:px-5 sm:pb-36 sm:pt-2"
      style={{ background: theme.pageGradient }}
    >
      <div
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-l-[6px] px-4 py-3 shadow-md backdrop-blur-sm"
        style={{
          backgroundColor: theme.headerSurface,
          borderColor: theme.headerBorder,
          borderLeftColor: theme.stripe,
        }}
      >
        <button
          type="button"
          onClick={() => setCode(null)}
          className="rounded-2xl border-2 bg-white/95 px-3 py-2 text-sm font-semibold shadow-sm transition hover:bg-white"
          style={{ borderColor: theme.accent, color: theme.primaryDark }}
        >
          Voltar
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <TeamFlag
            code={team.code}
            title={`${team.group} · ${team.name}`}
            className="!h-8 !w-11 shrink-0 shadow-sm ring-2 ring-white"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-70" style={{ color: theme.primary }}>
              Grupo {team.group}
            </p>
            <p className="truncate text-lg font-black leading-tight" style={{ color: theme.primaryDark }}>
              {team.name}
            </p>
          </div>
        </div>
        <ManualCloudSaveButton notify={notify} className="min-h-11 shrink-0 bg-white/95" />
      </div>
      {(prevTeam || nextTeam) && (
        <div className="flex flex-wrap items-stretch justify-between gap-2">
          {prevTeam ? (
            <button
              type="button"
              onClick={() => setCode(prevTeam.code)}
              aria-label={`Seleção anterior na ordem do álbum: ${prevTeam.name}, grupo ${prevTeam.group}`}
              className="min-h-[3rem] max-w-[calc(50%-0.25rem)] flex-1 rounded-2xl border-2 bg-white/90 px-3 py-2 text-left text-xs shadow-sm backdrop-blur-sm transition hover:bg-white"
              style={{ borderColor: theme.accent, color: theme.primaryDark }}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wide opacity-70" style={{ color: theme.primary }}>
                Anterior
              </span>
              <span className="line-clamp-2 font-semibold leading-tight">← {prevTeam.name}</span>
              <span className="mt-0.5 block text-[10px] text-slate-500">Grupo {prevTeam.group}</span>
            </button>
          ) : (
            <span className="min-w-0 flex-1" aria-hidden />
          )}
          {nextTeam ? (
            <button
              type="button"
              onClick={() => setCode(nextTeam.code)}
              aria-label={`Próxima seleção na ordem do álbum: ${nextTeam.name}, grupo ${nextTeam.group}`}
              className="min-h-[3rem] max-w-[calc(50%-0.25rem)] flex-1 rounded-2xl border-2 bg-white/90 px-3 py-2 text-right text-xs shadow-sm backdrop-blur-sm transition hover:bg-white"
              style={{ borderColor: theme.accent, color: theme.primaryDark }}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wide opacity-70" style={{ color: theme.primary }}>
                Próximo
              </span>
              <span className="line-clamp-2 font-semibold leading-tight">{nextTeam.name} →</span>
              <span className="mt-0.5 block text-[10px] text-slate-500">Grupo {nextTeam.group}</span>
            </button>
          ) : (
            <span className="min-w-0 flex-1" aria-hidden />
          )}
        </div>
      )}
      <StickerGrid
        entries={entries}
        qtyOf={(id) => state[id] ?? 0}
        onMarkHaveOne={(e) => {
          const q = state[e.id] ?? 0
          setQty(e.id, q >= 1 ? 0 : 1)
        }}
        onOpenEditor={onPick}
        visualTheme={theme}
      />
    </div>
  )
}
