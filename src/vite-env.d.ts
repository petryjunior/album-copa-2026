/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string | undefined
  /** Legacy JWT anon key (`eyJ…`) — still supported */
  readonly VITE_SUPABASE_ANON_KEY: string | undefined
  /** New dashboard: Settings → API Keys → publishable (`sb_publishable_…`) */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
