import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCollection } from '@/context/CollectionContext'
import { getSupabase } from '@/lib/supabaseClient'
import { fetchAlbumRow, upsertAlbumRow } from '@/sync/albumCloud'
import { LOCAL_SAVED_AT_KEY } from '@/sync/constants'

function parseSavedAtMs(raw: string | null): number {
  if (!raw) return 0
  const n = Date.parse(raw)
  return Number.isNaN(n) ? 0 : n
}

type CloudSyncCtx = {
  /** Última vez em que este cliente concluiu um envio (upsert) à tabela `album_sync` */
  lastCloudPushAt: string | null
  lastCloudError: string | null
  isPushing: boolean
  /** Sincronização inicial (pull / primeiro contacto) terminou — o push automático depende disto */
  pullDone: boolean
  /** `true` se o envio ao Supabase foi concluído com sucesso */
  pushToCloudNow: () => Promise<boolean>
}

const CloudSyncContext = createContext<CloudSyncCtx | null>(null)

/**
 * Sincroniza a coleção com o Supabase com login Google, com push em debounce
 * e opção de envio imediato (`pushToCloudNow`).
 */
export function CloudSyncProvider({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const { state, exportPersistedShape, hydrateFromCloud } = useCollection()
  const exportRef = useRef(exportPersistedShape)
  exportRef.current = exportPersistedShape

  const [pullDone, setPullDone] = useState(false)
  const [lastCloudPushAt, setLastCloudPushAt] = useState<string | null>(null)
  const [lastCloudError, setLastCloudError] = useState<string | null>(null)
  const [isPushing, setIsPushing] = useState(false)

  const uid = session?.user?.id ?? null

  const runPush = useCallback(async () => {
    if (!uid) return
    const supabase = getSupabase()
    if (!supabase) return
    setLastCloudError(null)
    try {
      await upsertAlbumRow(supabase, uid, exportRef.current())
      setLastCloudPushAt(new Date().toISOString())
    } catch (e) {
      setLastCloudError(e instanceof Error ? e.message : 'Falha na sincronização automática.')
      throw e
    }
  }, [uid])

  const pushToCloudNow = useCallback(async (): Promise<boolean> => {
    const supabase = getSupabase()
    if (!supabase || !uid) {
      setLastCloudError('Faça login e confirme se o Supabase está configurado.')
      return false
    }
    setIsPushing(true)
    setLastCloudError(null)
    try {
      await upsertAlbumRow(supabase, uid, exportRef.current())
      setLastCloudPushAt(new Date().toISOString())
      return true
    } catch (e) {
      setLastCloudError(e instanceof Error ? e.message : 'Não foi possível salvar na nuvem.')
      return false
    } finally {
      setIsPushing(false)
    }
  }, [uid])

  /** Pull ao entrar na conta — compara timestamps antes de sobrescrever. */
  useEffect(() => {
    if (loading || !uid) {
      setPullDone(false)
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      setPullDone(true)
      return
    }

    let cancelled = false
    setPullDone(false)

    ;(async () => {
      try {
        const remote = await fetchAlbumRow(supabase, uid)
        const localMs = parseSavedAtMs(localStorage.getItem(LOCAL_SAVED_AT_KEY))

        if (!remote) {
          await upsertAlbumRow(supabase, uid, exportRef.current())
          if (!cancelled) {
            setLastCloudPushAt(new Date().toISOString())
            setPullDone(true)
          }
          return
        }

        const remoteMs = Date.parse(remote.updated_at)
        if (remoteMs > localMs) {
          hydrateFromCloud(remote.data, remote.updated_at)
        } else if (localMs > remoteMs) {
          await upsertAlbumRow(supabase, uid, exportRef.current())
          if (!cancelled) setLastCloudPushAt(new Date().toISOString())
        }
        if (!cancelled) setPullDone(true)
      } catch (e) {
        console.error('[album cloud]', e)
        if (!cancelled) setPullDone(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loading, uid, hydrateFromCloud])

  /** Push com debounce após edições locais. */
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!pullDone || loading || !uid) return
    const supabase = getSupabase()
    if (!supabase) return

    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      ;(async () => {
        try {
          await runPush()
        } catch (e) {
          console.error('[album cloud push]', e)
        }
      })()
    }, 1800)

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [state, pullDone, loading, uid, runPush])

  const value: CloudSyncCtx = {
    lastCloudPushAt,
    lastCloudError,
    isPushing,
    pullDone,
    pushToCloudNow,
  }

  return <CloudSyncContext.Provider value={value}>{children}</CloudSyncContext.Provider>
}

export function useCloudSync(): CloudSyncCtx {
  const ctx = useContext(CloudSyncContext)
  if (!ctx) throw new Error('useCloudSync fora do CloudSyncProvider')
  return ctx
}
