import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null | undefined

function resolveSupabaseKey(): string | undefined {
  return (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
}

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = resolveSupabaseKey()
  if (!url || !key) {
    client = null
    return null
  }
  client = createClient(url, key)
  return client
}

export function isCloudConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && resolveSupabaseKey())
}
