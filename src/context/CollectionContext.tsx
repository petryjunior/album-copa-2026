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
import { LAST_REMOTE_APPLIED_AT_KEY, LOCAL_SAVED_AT_KEY } from '@/sync/constants'
import { buildCollectionShareUrl, decodeCollectionFromHash } from '@/utils/collectionSyncLink'

export const STORAGE_KEY = 'album-copa-2026-collection-v2026-physical-order'

type QtyMap = Record<number, number>

type Combined = { album: QtyMap; limbo: QtyMap }

type Action =
  | { type: 'hydrate'; album: QtyMap; limbo: QtyMap }
  | { type: 'setQty'; id: number; qty: number }
  | { type: 'setLimboQty'; id: number; qty: number }
  | { type: 'inc'; id: number; delta: number }
  | { type: 'incLimbo'; id: number; delta: number }
  | { type: 'bulkEnsureMin'; ids: number[]; min: number }
  | { type: 'bulkAdd'; ids: number[]; add: number }
  | { type: 'clearAll' }

function clampQty(q: number) {
  if (!Number.isFinite(q)) return 0
  const n = Math.floor(q)
  return Math.min(999, Math.max(0, n))
}

function stripZeroKey(map: QtyMap, id: number): QtyMap {
  const { [id]: _, ...rest } = map
  return rest
}

function combinedReducer(s: Combined, action: Action): Combined {
  switch (action.type) {
    case 'hydrate':
      return { album: { ...action.album }, limbo: { ...action.limbo } }
    case 'setQty':
      return { ...s, album: { ...s.album, [action.id]: clampQty(action.qty) } }
    case 'setLimboQty': {
      const q = clampQty(action.qty)
      if (q === 0) return { ...s, limbo: stripZeroKey(s.limbo, action.id) }
      return { ...s, limbo: { ...s.limbo, [action.id]: q } }
    }
    case 'inc': {
      const cur = s.album[action.id] ?? 0
      return { ...s, album: { ...s.album, [action.id]: clampQty(cur + action.delta) } }
    }
    case 'incLimbo': {
      const cur = s.limbo[action.id] ?? 0
      const nq = clampQty(cur + action.delta)
      if (nq === 0) return { ...s, limbo: stripZeroKey(s.limbo, action.id) }
      return { ...s, limbo: { ...s.limbo, [action.id]: nq } }
    }
    case 'bulkEnsureMin': {
      const next = { ...s.album }
      for (const id of action.ids) {
        const cur = next[id] ?? 0
        next[id] = Math.max(cur, clampQty(action.min))
      }
      return { ...s, album: next }
    }
    case 'bulkAdd': {
      const next = { ...s.album }
      for (const id of action.ids) {
        const cur = next[id] ?? 0
        next[id] = clampQty(cur + action.add)
      }
      return { ...s, album: next }
    }
    case 'clearAll':
      return { album: {}, limbo: {} }
    default:
      return s
  }
}

function quantitiesFromRecord(rec: Record<string, number>): QtyMap {
  const out: QtyMap = {}
  for (const [k, v] of Object.entries(rec)) {
    const id = Number(k)
    if (!Number.isNaN(id)) out[id] = clampQty(Number(v))
  }
  return out
}

function limboFromShape(shape: PersistedShape): QtyMap {
  if (!shape.limboQuantities || typeof shape.limboQuantities !== 'object') return {}
  return quantitiesFromRecord(shape.limboQuantities)
}

function loadCombined(): Combined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { album: {}, limbo: {} }
    if (!localStorage.getItem(LOCAL_SAVED_AT_KEY)) {
      localStorage.setItem(LOCAL_SAVED_AT_KEY, new Date().toISOString())
    }
    const parsed = JSON.parse(raw) as PersistedShape
    if (parsed.version !== 3 || !parsed.quantities) return { album: {}, limbo: {} }
    return {
      album: quantitiesFromRecord(parsed.quantities),
      limbo: limboFromShape(parsed),
    }
  } catch {
    return { album: {}, limbo: {} }
  }
}

function persistCombined(album: QtyMap, limbo: QtyMap) {
  const shape: PersistedShape = { version: 3, quantities: {} }
  for (const [k, v] of Object.entries(album)) {
    if (v > 0) shape.quantities[k] = v
  }
  const lq: Record<string, number> = {}
  for (const [k, v] of Object.entries(limbo)) {
    if (v > 0) lq[k] = v
  }
  if (Object.keys(lq).length > 0) shape.limboQuantities = lq
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shape))
}

type Ctx = {
  catalog: typeof CATALOG
  /** Quantidades coladas / contadas no álbum (comportamento anterior). */
  state: QtyMap
  /** Trocas ainda não coladas no álbum. */
  limboState: QtyMap
  /** ISO timestamp do último salvamento no armazenamento local deste navegador */
  lastLocalSavedAt: string | null
  setQty: (id: number, qty: number) => void
  setLimboQty: (id: number, qty: number) => void
  inc: (id: number, delta: number) => void
  incLimbo: (id: number, delta: number) => void
  bulkEnsureMin: (ids: number[], min: number) => void
  bulkAdd: (ids: number[], add: number) => void
  clearAll: () => void
  exportJson: () => string
  /** Coleção compacta para link, JSON ou nuvem. */
  exportPersistedShape: () => PersistedShape
  buildShareUrl: () => string
  importJson: (raw: string) => { ok: true } | { ok: false; error: string }
  /** Substituir estado a partir da nuvem sem alterar o critério LWW do próximo save. */
  hydrateFromCloud: (shape: PersistedShape, remoteUpdatedAt: string) => void
  /** Após envio à nuvem: alinhar o registo local de data com o `updated_at` do Supabase. */
  alignSavedAtFromServer: (serverUpdatedAtIso: string) => void
}

const CollectionContext = createContext<Ctx | null>(null)

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [combined, dispatch] = useReducer(combinedReducer, { album: {}, limbo: {} }, () => loadCombined())
  const { album: state, limbo: limboState } = combined

  const [lastLocalSavedAt, setLastLocalSavedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOCAL_SAVED_AT_KEY)
    } catch {
      return null
    }
  })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSavedAtRef = useRef<string | null>(null)

  function saveToStorage(album: QtyMap, limbo: QtyMap) {
    persistCombined(album, limbo)
    const at = pendingSavedAtRef.current ?? new Date().toISOString()
    pendingSavedAtRef.current = null
    localStorage.setItem(LOCAL_SAVED_AT_KEY, at)
    setLastLocalSavedAt(at)
  }

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => saveToStorage(combined.album, combined.limbo), 250)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [combined])

  const setQty = useCallback((id: number, qty: number) => {
    dispatch({ type: 'setQty', id, qty })
  }, [])

  const setLimboQty = useCallback((id: number, qty: number) => {
    dispatch({ type: 'setLimboQty', id, qty })
  }, [])

  const inc = useCallback((id: number, delta: number) => {
    dispatch({ type: 'inc', id, delta })
  }, [])

  const incLimbo = useCallback((id: number, delta: number) => {
    dispatch({ type: 'incLimbo', id, delta })
  }, [])

  const bulkEnsureMin = useCallback((ids: number[], min: number) => {
    dispatch({ type: 'bulkEnsureMin', ids, min })
  }, [])

  const bulkAdd = useCallback((ids: number[], add: number) => {
    dispatch({ type: 'bulkAdd', ids, add })
  }, [])

  const clearAll = useCallback(() => {
    dispatch({ type: 'clearAll' })
    try {
      const now = new Date().toISOString()
      localStorage.setItem(LOCAL_SAVED_AT_KEY, now)
      localStorage.setItem(LAST_REMOTE_APPLIED_AT_KEY, now)
      setLastLocalSavedAt(now)
    } catch {
      /* ignore */
    }
  }, [])

  const exportPersistedShape = useCallback((): PersistedShape => {
    const shape: PersistedShape = { version: 3, quantities: {} }
    for (const [k, v] of Object.entries(state)) {
      if (v > 0) shape.quantities[k] = v
    }
    const lq: Record<string, number> = {}
    for (const [k, v] of Object.entries(limboState)) {
      if (v > 0) lq[k] = v
    }
    if (Object.keys(lq).length > 0) shape.limboQuantities = lq
    return shape
  }, [state, limboState])

  const exportJson = useCallback(() => JSON.stringify(exportPersistedShape(), null, 2), [exportPersistedShape])

  const buildShareUrl = useCallback(() => buildCollectionShareUrl(exportPersistedShape()), [exportPersistedShape])

  const hydrateFromCloud = useCallback((shape: PersistedShape, remoteUpdatedAt: string) => {
    pendingSavedAtRef.current = remoteUpdatedAt
    try {
      localStorage.setItem(LAST_REMOTE_APPLIED_AT_KEY, remoteUpdatedAt)
    } catch {
      /* ignore */
    }
    const album = quantitiesFromRecord(shape.quantities)
    const limbo = limboFromShape(shape)
    dispatch({ type: 'hydrate', album, limbo })
  }, [])

  const alignSavedAtFromServer = useCallback((serverUpdatedAtIso: string) => {
    try {
      localStorage.setItem(LOCAL_SAVED_AT_KEY, serverUpdatedAtIso)
      localStorage.setItem(LAST_REMOTE_APPLIED_AT_KEY, serverUpdatedAtIso)
      setLastLocalSavedAt(serverUpdatedAtIso)
    } catch {
      /* ignore */
    }
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
      const album = quantitiesFromRecord(parsed.quantities)
      const limbo =
        parsed.limboQuantities && typeof parsed.limboQuantities === 'object'
          ? quantitiesFromRecord(parsed.limboQuantities)
          : {}
      dispatch({ type: 'hydrate', album, limbo })
      try {
        localStorage.setItem(LAST_REMOTE_APPLIED_AT_KEY, new Date().toISOString())
      } catch {
        /* ignore */
      }
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
      'Este link contém uma coleção do álbum. Substituir os dados salvos neste dispositivo?',
    )
    const path = `${window.location.pathname}${window.location.search}`
    if (!ok) {
      window.history.replaceState(null, '', path)
      return
    }
    const album = quantitiesFromRecord(parsed.quantities)
    const limbo = limboFromShape(parsed)
    dispatch({ type: 'hydrate', album, limbo })
    try {
      localStorage.setItem(LAST_REMOTE_APPLIED_AT_KEY, new Date().toISOString())
    } catch {
      /* ignore */
    }
    window.history.replaceState(null, '', path)
  }, [])

  /** Outras abas / janelas do mesmo site — mantêm o mesmo armazenamento local alinhado. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue == null) return
      try {
        const parsed = JSON.parse(e.newValue) as PersistedShape
        if (parsed.version !== 3 || typeof parsed.quantities !== 'object' || !parsed.quantities) return
        const album = quantitiesFromRecord(parsed.quantities)
        const limbo = limboFromShape(parsed)
        dispatch({ type: 'hydrate', album, limbo })
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
      limboState,
      lastLocalSavedAt,
      setQty,
      setLimboQty,
      inc,
      incLimbo,
      bulkEnsureMin,
      bulkAdd,
      clearAll,
      exportJson,
      exportPersistedShape,
      buildShareUrl,
      importJson,
      hydrateFromCloud,
      alignSavedAtFromServer,
    }),
    [
      state,
      limboState,
      lastLocalSavedAt,
      setQty,
      setLimboQty,
      inc,
      incLimbo,
      bulkEnsureMin,
      bulkAdd,
      clearAll,
      exportJson,
      exportPersistedShape,
      buildShareUrl,
      importJson,
      hydrateFromCloud,
      alignSavedAtFromServer,
    ],
  )

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>
}

export function useCollection() {
  const ctx = useContext(CollectionContext)
  if (!ctx) throw new Error('useCollection fora do provider')
  return ctx
}
