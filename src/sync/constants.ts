/** Última escrita local (UI / export) — não usar sozinho para LWW vs nuvem (sube a cada toque). */
export const LOCAL_SAVED_AT_KEY = 'album-copa-2026-local-saved-at'

/** Último `updated_at` do Supabase já incorporado aqui (pull LWW; o push compara isto, não só o save local). */
export const LAST_REMOTE_APPLIED_AT_KEY = 'album-copa-2026-last-remote-applied-at'
