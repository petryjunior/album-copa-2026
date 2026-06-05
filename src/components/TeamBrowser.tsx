import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CatalogEntry } from '@/types/catalog'
import { getTeamsUnique } from '@/catalog/catalog'
import { StickerGrid } from '@/components/StickerGrid'
import { useCollection } from '@/context/CollectionContext'
import { TeamFlag } from '@/components/TeamFlag'
import { getTeamTheme } from '@/lib/teamThemes'
import { ManualCloudSaveButton } from '@/components/ManualCloudSaveButton'
import { countTeamSlotsFilled } from '@/utils/teamCounts'

function TeamNameWithFlag({
  code,
  name,
  countLabel,
}: {
  code: string
  name: string
  /** ex. "(5/20)" */
  countLabel?: string
}) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <TeamFlag code={code} title={name} />
      <span className="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-base font-semibold text-slate-900">{name}</span>
        {countLabel ? (
          <span className="text-sm font-bold tabular-nums text-teal-800">{countLabel}</span>
        ) : null}
      </span>
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
type SlotFilter = 'all' | 'missing'

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
  const [slotFilter, setSlotFilter] = useState<SlotFilter>('all')

  const prevDetailCodeRef = useRef<string | null>(null)
  const detailHistoryPushedRef = useRef(false)
  const activeCodeRef = useRef<string | null>(null)

  useEffect(() => {
    activeCodeRef.current = code
  }, [code])

  useEffect(() => {
    const onPopState = () => {
      if (activeCodeRef.current !== null) {
        detailHistoryPushedRef.current = false
        setCode(null)
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (code === null) {
      prevDetailCodeRef.current = null
      return
    }
    if (prevDetailCodeRef.current === null) {
      history.pushState({ __albumTeamBrowser: 1 }, '', window.location.href)
      detailHistoryPushedRef.current = true
    }
    prevDetailCodeRef.current = code
  }, [code])

  const goBackToList = useCallback(() => {
    if (detailHistoryPushedRef.current) {
      history.back()
    } else {
      setCode(null)
    }
  }, [])

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

  const displayEntries = useMemo(() => {
    if (slotFilter === 'missing') {
      return entries.filter((e) => (state[e.id] ?? 0) < 1)
    }
    return entries
  }, [entries, slotFilter, state])

  useEffect(() => {
    setSlotFilter('all')
  }, [code])

  const selectedTeam = useMemo(
    () => (code ? (teams.find((t) => t.code === code) ?? null) : null),
    [code, teams],
  )

  const teamSlots = useMemo(() => {
    if (!selectedTeam) return { filled: 0, total: 0 }
    return countTeamSlotsFilled(catalog, state, selectedTeam.code)
  }, [catalog, state, selectedTeam])

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
                    {list.map((t) => {
                      const { filled, total } = countTeamSlotsFilled(catalog, state, t.code)
                      return (
                        <button
                          key={t.code}
                          type="button"
                          onClick={() => setCode(t.code)}
                          className="flex min-h-[3.75rem] items-center rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
                        >
                          <TeamNameWithFlag
                            code={t.code}
                            name={t.name}
                            countLabel={`(${filled}/${total})`}
                          />
                        </button>
                      )
                    })}
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
                {alphaList.map((t) => {
                  const { filled, total } = countTeamSlotsFilled(catalog, state, t.code)
                  return (
                    <button
                      key={t.code}
                      type="button"
                      onClick={() => setCode(t.code)}
                      className="flex min-h-[3.75rem] flex-col justify-center gap-1 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
                    >
                      <TeamNameWithFlag
                        code={t.code}
                        name={t.name}
                        countLabel={`(${filled}/${total})`}
                      />
                      <span className="pl-11 text-xs uppercase tracking-[0.15em] text-slate-500">
                        Grupo {t.group}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const team = selectedTeam
  if (!team) {
    return (
      <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-900">
        <p>Não foi possível carregar esta seleção.</p>
        <button
          type="button"
          onClick={goBackToList}
          className="rounded-2xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Voltar à lista
        </button>
      </div>
    )
  }

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
          onClick={goBackToList}
          className="rounded-2xl border-2 bg-white/95 px-3 py-2 text-sm font-semibold shadow-sm transition hover:bg-white"
          style={{ borderColor: theme.accent, color: theme.primaryDark }}
        >
          Voltar
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <TeamFlag
            code={team.code}
            title={`${team.group} · ${team.name}`}
            className="!h-8 !w-11 shrink-0 shadow-sm ring-2 ring-white"
          />
          <div className="min-w-0 flex-1">
            <div className="hidden min-w-0 sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-70" style={{ color: theme.primary }}>
                Grupo {team.group}
              </p>
              <p className="truncate text-lg font-black leading-tight" style={{ color: theme.primaryDark }}>
                <span>{team.name}</span>{' '}
                <span className="text-sm font-bold tabular-nums" style={{ color: theme.primary }}>
                  ({teamSlots.filled}/{teamSlots.total})
                </span>
              </p>
            </div>
            <div
              className="flex min-w-0 items-baseline gap-2 sm:hidden"
              title={`${team.name} · Grupo ${team.group}`}
            >
              <span className="shrink-0 text-xl font-black tracking-tight" style={{ color: theme.primaryDark }}>
                {team.code}
              </span>
              <span className="text-sm font-bold tabular-nums" style={{ color: theme.primary }}>
                ({teamSlots.filled}/{teamSlots.total})
              </span>
            </div>
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
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar figurinhas da seleção">
        <button
          type="button"
          onClick={() => setSlotFilter('all')}
          className={`min-h-[2.75rem] rounded-full px-4 py-2 text-sm font-semibold transition ${
            slotFilter === 'all'
              ? 'text-white shadow-sm'
              : 'border-2 bg-white/90 backdrop-blur-sm hover:bg-white'
          }`}
          style={
            slotFilter === 'all'
              ? { backgroundColor: theme.primary }
              : { borderColor: theme.accent, color: theme.primaryDark }
          }
        >
          Todas ({entries.length})
        </button>
        <button
          type="button"
          onClick={() => setSlotFilter('missing')}
          className={`min-h-[2.75rem] rounded-full px-4 py-2 text-sm font-semibold transition ${
            slotFilter === 'missing'
              ? 'text-white shadow-sm'
              : 'border-2 bg-white/90 backdrop-blur-sm hover:bg-white'
          }`}
          style={
            slotFilter === 'missing'
              ? { backgroundColor: theme.primary }
              : { borderColor: theme.accent, color: theme.primaryDark }
          }
        >
          Faltando ({entries.length - teamSlots.filled})
        </button>
      </div>
      <StickerGrid
        entries={displayEntries}
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
