import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { PersistedShape } from '@/types/catalog'

/** Fragment prefix — keep stable so bookmarks keep working. */
export const SYNC_HASH_PREFIX = 'album='

export function encodeCollectionHashPayload(shape: PersistedShape): string {
  return SYNC_HASH_PREFIX + compressToEncodedURIComponent(JSON.stringify(shape))
}

export function decodeCollectionFromHash(hash: string): PersistedShape | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw.startsWith(SYNC_HASH_PREFIX)) return null
  const compressed = raw.slice(SYNC_HASH_PREFIX.length)
  const json = decompressFromEncodedURIComponent(compressed)
  if (!json) return null
  try {
    const parsed = JSON.parse(json) as PersistedShape
    if (parsed.version !== 3 || typeof parsed.quantities !== 'object' || !parsed.quantities) return null
    return parsed
  } catch {
    return null
  }
}

/** Full URL with hash so opening it on another device restores the collection after confirmation. */
export function buildCollectionShareUrl(shape: PersistedShape): string {
  const u = new URL(window.location.href)
  u.hash = encodeCollectionHashPayload(shape)
  return u.toString()
}
