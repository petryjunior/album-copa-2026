import type { SupabaseClient } from '@supabase/supabase-js'
import type { PersistedShape } from '@/types/catalog'

export async function fetchAlbumRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: PersistedShape; updated_at: string } | null> {
  const { data, error } = await supabase
    .from('album_sync')
    .select('payload, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data?.payload) return null

  const payload = data.payload as PersistedShape
  if (payload.version !== 3 || typeof payload.quantities !== 'object') return null

  return { data: payload, updated_at: data.updated_at as string }
}

/** Devolve o `updated_at` do servidor (para alinhar o LWW com o `localStorage`). */
export async function upsertAlbumRow(
  supabase: SupabaseClient,
  userId: string,
  shape: PersistedShape,
): Promise<string> {
  const { data, error } = await supabase
    .from('album_sync')
    .upsert(
      {
        user_id: userId,
        payload: shape,
      },
      { onConflict: 'user_id' },
    )
    .select('updated_at')
    .single()

  if (error) throw error
  const at = data?.updated_at
  if (typeof at !== 'string') throw new Error('album_sync: resposta sem updated_at')
  return at
}
