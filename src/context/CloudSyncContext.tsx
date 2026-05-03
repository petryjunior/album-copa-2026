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
import { LAST_REMOTE_APPLIED_AT_KEY } from '@/sync/constants'

const POLL_REMOTE_MS = 45_000

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
  const { state, exportPersistedShape, hydrateFromCloud, alignSavedAtFromServer } = useCollection()
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
      const remote = await fetchAlbumRow(supabase, uid)
      const lastRm = parseSavedAtMs(localStorage.getItem(LAST_REMOTE_APPLIED_AT_KEY))
      if (remote && Date.parse(remote.updated_at) > lastRm) {
        hydrateFromCloud(remote.data, remote.updated_at)
        return
      }
      const serverAt = await upsertAlbumRow(supabase, uid, exportRef.current())
      alignSavedAtFromServer(serverAt)
      setLastCloudPushAt(serverAt)
    } catch (e) {
      setLastCloudError(e instanceof Error ? e.message : 'Falha na sincronização automática.')
      throw e
    }
  }, [uid, alignSavedAtFromServer, hydrateFromCloud])

  const pushToCloudNow = useCallback(async (): Promise<boolean> => {
    const supabase = getSupabase()
    if (!supabase || !uid) {
      setLastCloudError('Faça login e confirme se o Supabase está configurado.')
      return false
    }
    setIsPushing(true)
    setLastCloudError(null)
    try {
      const remote = await fetchAlbumRow(supabase, uid)
      const lastRm = parseSavedAtMs(localStorage.getItem(LAST_REMOTE_APPLIED_AT_KEY))
      if (remote && Date.parse(remote.updated_at) > lastRm) {
        hydrateFromCloud(remote.data, remote.updated_at)
        return true
      }
      const serverAt = await upsertAlbumRow(supabase, uid, exportRef.current())
      alignSavedAtFromServer(serverAt)
      setLastCloudPushAt(serverAt)
      return true
    } catch (e) {
      setLastCloudError(e instanceof Error ? e.message : 'Não foi possível salvar na nuvem.')
      return false
    } finally {
      setIsPushing(false)
    }
  }, [uid, alignSavedAtFromServer, hydrateFromCloud])

  /**
   * Busca a nuvem e aplica se o `updated_at` do servidor for mais recente do que
   * o último que já incorporámos (não basta o “save local”, que sobe a cada toque no ecrã).
   */
  const pullRemoteIfNewer = useCallback(async () => {
    if (!uid) return
    const supabase = getSupabase()
    if (!supabase) return
    try {
      const remote = await fetchAlbumRow(supabase, uid)
      if (!remote) return
      const lastRm = parseSavedAtMs(localStorage.getItem(LAST_REMOTE_APPLIED_AT_KEY))
      const remoteMs = Date.parse(remote.updated_at)
      if (remoteMs > lastRm) {
        hydrateFromCloud(remote.data, remote.updated_at)
      }
    } catch (e) {
      console.error('[album cloud pullRemoteIfNewer]', e)
    }
  }, [uid, hydrateFromCloud])

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
        const lastRm = parseSavedAtMs(localStorage.getItem(LAST_REMOTE_APPLIED_AT_KEY))

        if (!remote) {
          const serverAt = await upsertAlbumRow(supabase, uid, exportRef.current())
          if (!cancelled) {
            alignSavedAtFromServer(serverAt)
            setLastCloudPushAt(serverAt)
            setPullDone(true)
          }
          return
        }

        const remoteMs = Date.parse(remote.updated_at)
        if (remoteMs > lastRm) {
          hydrateFromCloud(remote.data, remote.updated_at)
        } else if (lastRm > remoteMs) {
          const serverAt = await upsertAlbumRow(supabase, uid, exportRef.current())
          if (!cancelled) {
            alignSavedAtFromServer(serverAt)
            setLastCloudPushAt(serverAt)
          }
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
  }, [loading, uid, hydrateFromCloud, alignSavedAtFromServer])

  /** Voltar ao separador / foco / rede: puxar alterações de outros dispositivos. */
  useEffect(() => {
    if (!pullDone || loading || !uid) return
    const refresh = () => {
      if (document.visibilityState === 'visible') void pullRemoteIfNewer()
    }
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('online', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('online', refresh)
    }
  }, [pullDone, loading, uid, pullRemoteIfNewer])

  /** Consulta periódica enquanto a página está aberta (fallback se Realtime não estiver ativo). */
  useEffect(() => {
    if (!pullDone || loading || !uid) return
    const id = window.setInterval(() => void pullRemoteIfNewer(), POLL_REMOTE_MS)
    return () => clearInterval(id)
  }, [pullDone, loading, uid, pullRemoteIfNewer])

  /**
   * Atualização em tempo quase real quando o projeto Supabase tem Realtime ativo para `album_sync`.
   * (Database → Replication → `album_sync`; caso contrário, o intervalo acima cobre.)
   */
  useEffect(() => {
    if (!pullDone || loading || !uid) return
    const supabase = getSupabase()
    if (!supabase) return

    const channel = supabase
      .channel(`album_sync:${uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'album_sync',
          filter: `user_id=eq.${uid}`,
        },
        () => void pullRemoteIfNewer(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [pullDone, loading, uid, pullRemoteIfNewer])

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
