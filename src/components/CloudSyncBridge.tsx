import { useEffect, useRef, useState } from 'react'
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

/** Sincroniza coleção com Supabase quando há sessão (Google). */
export function CloudSyncBridge() {
  const { session, loading } = useAuth()
  const { state, exportPersistedShape, hydrateFromCloud } = useCollection()
  const exportRef = useRef(exportPersistedShape)
  exportRef.current = exportPersistedShape
  const [pullDone, setPullDone] = useState(false)
  const uid = session?.user?.id ?? null

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
          if (!cancelled) setPullDone(true)
          return
        }

        const remoteMs = Date.parse(remote.updated_at)
        if (remoteMs > localMs) {
          hydrateFromCloud(remote.data, remote.updated_at)
        } else if (localMs > remoteMs) {
          await upsertAlbumRow(supabase, uid, exportRef.current())
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
          await upsertAlbumRow(supabase, uid, exportRef.current())
        } catch (e) {
          console.error('[album cloud push]', e)
        }
      })()
    }, 1800)

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [state, pullDone, loading, uid])

  return null
}
