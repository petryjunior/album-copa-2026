import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { PersistedShape } from '@/types/catalog'
import { CATALOG } from '@/catalog/catalog'
import { LOCAL_SAVED_AT_KEY } from '@/sync/constants'
import { buildCollectionShareUrl, decodeCollectionFromHash } from '@/utils/collectionSyncLink'

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
    if (!localStorage.getItem(LOCAL_SAVED_AT_KEY)) {
      localStorage.setItem(LOCAL_SAVED_AT_KEY, new Date().toISOString())
    }
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

type Ctx = {
  catalog: typeof CATALOG
  state: State
  /** ISO timestamp da última gravação no armazenamento local deste navegador */
  lastLocalSavedAt: string | null
  setQty: (id: number, qty: number) => void
  inc: (id: number, delta: number) => void
  bulkEnsureMin: (ids: number[], min: number) => void
  bulkAdd: (ids: number[], add: number) => void
  clearAll: () => void
  exportJson: () => string
  /** Coleção compacta (apenas quantidades positivas) para link ou JSON minimal. */
  exportPersistedShape: () => PersistedShape
  buildShareUrl: () => string
  importJson: (raw: string) => { ok: true } | { ok: false; error: string }
  /** Substituir estado a partir da nuvem sem alterar o critério LWW do próximo save. */
  hydrateFromCloud: (shape: PersistedShape, remoteUpdatedAt: string) => void
}

const CollectionContext = createContext<Ctx | null>(null)

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {}, () => loadFromStorage())
  const [lastLocalSavedAt, setLastLocalSavedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOCAL_SAVED_AT_KEY)
    } catch {
      return null
    }
  })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSavedAtRef = useRef<string | null>(null)

  function saveToStorage(next: State) {
    const shape: PersistedShape = {
      version: 3,
      quantities: Object.fromEntries(Object.entries(next).map(([k, v]) => [k, v])),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shape))
    const at = pendingSavedAtRef.current ?? new Date().toISOString()
    pendingSavedAtRef.current = null
    localStorage.setItem(LOCAL_SAVED_AT_KEY, at)
    setLastLocalSavedAt(at)
  }

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

  const exportPersistedShape = useCallback((): PersistedShape => {
    const shape: PersistedShape = { version: 3, quantities: {} }
    for (const [k, v] of Object.entries(state)) {
      if (v > 0) shape.quantities[k] = v
    }
    return shape
  }, [state])

  const exportJson = useCallback(() => JSON.stringify(exportPersistedShape(), null, 2), [exportPersistedShape])

  const buildShareUrl = useCallback(() => buildCollectionShareUrl(exportPersistedShape()), [exportPersistedShape])

  const hydrateFromCloud = useCallback((shape: PersistedShape, remoteUpdatedAt: string) => {
    pendingSavedAtRef.current = remoteUpdatedAt
    const next: State = {}
    for (const [k, v] of Object.entries(shape.quantities)) {
      const id = Number(k)
      if (!Number.isNaN(id)) next[id] = clampQty(Number(v))
    }
    dispatch({ type: 'hydrate', data: next })
  }, [])

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

  /** Abrir site com `#album=…` — importa coleção após confirmação. */
  useEffect(() => {
    const parsed = decodeCollectionFromHash(window.location.hash)
    if (!parsed) return
    const ok = window.confirm(
      'Este link contém uma coleção do álbum. Substituir os dados salvos neste aparelho?',
    )
    const path = `${window.location.pathname}${window.location.search}`
    if (!ok) {
      window.history.replaceState(null, '', path)
      return
    }
    const next: State = {}
    for (const [k, v] of Object.entries(parsed.quantities)) {
      const id = Number(k)
      if (!Number.isNaN(id)) next[id] = clampQty(Number(v))
    }
    dispatch({ type: 'hydrate', data: next })
    window.history.replaceState(null, '', path)
  }, [])

  /** Outras abas / janelas do mesmo site — mantêm o mesmo armazenamento local alinhado. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue == null) return
      try {
        const parsed = JSON.parse(e.newValue) as PersistedShape
        if (parsed.version !== 3 || typeof parsed.quantities !== 'object' || !parsed.quantities) return
        const next: State = {}
        for (const [k, v] of Object.entries(parsed.quantities)) {
          const id = Number(k)
          if (!Number.isNaN(id)) next[id] = clampQty(Number(v))
        }
        dispatch({ type: 'hydrate', data: next })
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      catalog: CATALOG,
      state,
      lastLocalSavedAt,
      setQty,
      inc,
      bulkEnsureMin,
      bulkAdd,
      clearAll,
      exportJson,
      exportPersistedShape,
      buildShareUrl,
      importJson,
      hydrateFromCloud,
    }),
    [
      state,
      lastLocalSavedAt,
      setQty,
      inc,
      bulkEnsureMin,
      bulkAdd,
      clearAll,
      exportJson,
      exportPersistedShape,
      buildShareUrl,
      importJson,
      hydrateFromCloud,
    ],
  )

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>
}

export function useCollection() {
  const ctx = useContext(CollectionContext)
  if (!ctx) throw new Error('useCollection fora do provider')
  return ctx
}
