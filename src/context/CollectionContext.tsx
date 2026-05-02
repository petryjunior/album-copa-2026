import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type { PersistedShape } from '@/types/catalog'
import { CATALOG } from '@/catalog/catalog'

export const STORAGE_KEY = 'album-copa-2026-collection-v2026-physical-order'

type State = Record<number, number>

type Action =
  | { type: 'hydrate'; data: State }
  | { type: 'setQty'; id: number; qty: number }
  | { type: 'inc'; id: number; delta: number }
  | { type: 'bulkEnsureMin'; ids: number[]; min: number }
  | { type: 'bulkAdd'; ids: number[]; add: number }
  | { type: 'clearAll' }

function clampQty(q: number) {
  if (!Number.isFinite(q)) return 0
  const n = Math.floor(q)
  return Math.min(999, Math.max(0, n))
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...action.data }
    case 'setQty':
      return { ...state, [action.id]: clampQty(action.qty) }
    case 'inc': {
      const cur = state[action.id] ?? 0
      return { ...state, [action.id]: clampQty(cur + action.delta) }
    }
    case 'bulkEnsureMin': {
      const next = { ...state }
      for (const id of action.ids) {
        const cur = next[id] ?? 0
        next[id] = Math.max(cur, clampQty(action.min))
      }
      return next
    }
    case 'bulkAdd': {
      const next = { ...state }
      for (const id of action.ids) {
        const cur = next[id] ?? 0
        next[id] = clampQty(cur + action.add)
      }
      return next
    }
    case 'clearAll':
      return {}
    default:
      return state
  }
}

function loadFromStorage(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as PersistedShape
    if (parsed.version !== 3 || !parsed.quantities) return {}
    const out: State = {}
    for (const [k, v] of Object.entries(parsed.quantities)) {
      const id = Number(k)
      if (!Number.isNaN(id)) out[id] = clampQty(v)
    }
    return out
  } catch {
    return {}
  }
}

function saveToStorage(state: State) {
  const shape: PersistedShape = {
    version: 3,
    quantities: Object.fromEntries(
      Object.entries(state).map(([k, v]) => [k, v]),
    ),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shape))
}

type Ctx = {
  catalog: typeof CATALOG
  state: State
  setQty: (id: number, qty: number) => void
  inc: (id: number, delta: number) => void
  bulkEnsureMin: (ids: number[], min: number) => void
  bulkAdd: (ids: number[], add: number) => void
  clearAll: () => void
  exportJson: () => string
  importJson: (raw: string) => { ok: true } | { ok: false; error: string }
}

const CollectionContext = createContext<Ctx | null>(null)

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {}, () => loadFromStorage())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveToStorage(state), 250)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [state])

  const setQty = useCallback((id: number, qty: number) => {
    dispatch({ type: 'setQty', id, qty })
  }, [])

  const inc = useCallback((id: number, delta: number) => {
    dispatch({ type: 'inc', id, delta })
  }, [])

  const bulkEnsureMin = useCallback((ids: number[], min: number) => {
    dispatch({ type: 'bulkEnsureMin', ids, min })
  }, [])

  const bulkAdd = useCallback((ids: number[], add: number) => {
    dispatch({ type: 'bulkAdd', ids, add })
  }, [])

  const clearAll = useCallback(() => {
    dispatch({ type: 'clearAll' })
  }, [])

  const exportJson = useCallback(() => {
    const shape: PersistedShape = { version: 3, quantities: {} }
    for (const [k, v] of Object.entries(state)) {
      if (v > 0) shape.quantities[k] = v
    }
    return JSON.stringify(shape, null, 2)
  }, [state])

  const importJson = useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(raw) as Partial<PersistedShape>
      if (parsed.version === 1 || parsed.version === 2) {
        return {
          ok: false as const,
          error:
            'Backup de versão antiga (a ordem dos IDs mudou para seguir o álbum físico: 00, FWC 1–8, seleções, FWC 9–19). Gere um backup novo após re-marcar.',
        }
      }
      if (parsed.version !== 3 || typeof parsed.quantities !== 'object' || !parsed.quantities) {
        return { ok: false as const, error: 'Formato inválido (version 3 esperada).' }
      }
      const next: State = {}
      for (const [k, v] of Object.entries(parsed.quantities)) {
        const id = Number(k)
        if (!Number.isNaN(id)) next[id] = clampQty(Number(v))
      }
      dispatch({ type: 'hydrate', data: next })
      return { ok: true as const }
    } catch {
      return { ok: false as const, error: 'JSON inválido.' }
    }
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      catalog: CATALOG,
      state,
      setQty,
      inc,
      bulkEnsureMin,
      bulkAdd,
      clearAll,
      exportJson,
      importJson,
    }),
    [state, setQty, inc, bulkEnsureMin, bulkAdd, clearAll, exportJson, importJson],
  )

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>
}

export function useCollection() {
  const ctx = useContext(CollectionContext)
  if (!ctx) throw new Error('useCollection fora do provider')
  return ctx
}
