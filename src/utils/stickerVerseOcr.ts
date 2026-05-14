import { CATALOG, isCatalogTeamCode } from '@/catalog/catalog'
import type { CatalogEntry } from '@/types/catalog'

export type ParsedVerse =
  | { kind: 'team'; code: string; slot: number }
  | { kind: 'fwc'; n: number }
  | { kind: 'panini' }

function verseKey(p: ParsedVerse): string {
  if (p.kind === 'team') return `team:${p.code}:${p.slot}`
  if (p.kind === 'fwc') return `fwc:${p.n}`
  return 'panini'
}

function pushUnique(out: ParsedVerse[], seen: Set<string>, p: ParsedVerse) {
  const k = verseKey(p)
  if (seen.has(k)) return
  seen.add(k)
  out.push(p)
}

/**
 * Extrai candidatos a código do verso a partir do texto bruto do OCR.
 * Aceita padrões tipo BIH 12, FWC 7, 00 / PANINI.
 */
export function extractVerseCandidates(ocrText: string): ParsedVerse[] {
  const u = ocrText
    .toUpperCase()
    .replace(/\bEWC\b/g, 'FWC')
    .replace(/\s+/g, ' ')
    .trim()
  const seen = new Set<string>()
  const out: ParsedVerse[] = []

  for (const m of u.matchAll(/FWC\D{0,4}(\d{1,2})\b/g)) {
    const n = Number.parseInt(m[1], 10)
    if (n >= 1 && n <= 19) pushUnique(out, seen, { kind: 'fwc', n })
  }

  for (const m of u.matchAll(/\b([A-Z]{3})\D{0,4}(\d{1,2})\b/g)) {
    const code = m[1]
    const slot = Number.parseInt(m[2], 10)
    if (code === 'FWC') continue
    if (!isCatalogTeamCode(code)) continue
    if (slot < 1 || slot > 20) continue
    pushUnique(out, seen, { kind: 'team', code, slot })
  }

  for (const m of u.matchAll(/\b(\d{1,2})\D{0,4}([A-Z]{3})\b/g)) {
    const slot = Number.parseInt(m[1], 10)
    const code = m[2]
    if (code === 'FWC') continue
    if (!isCatalogTeamCode(code)) continue
    if (slot < 1 || slot > 20) continue
    pushUnique(out, seen, { kind: 'team', code, slot })
  }

  if (/\b00\b/.test(u) || /\bPANINI\b/.test(u)) {
    pushUnique(out, seen, { kind: 'panini' })
  }

  return out
}

export function catalogEntryFromParsed(p: ParsedVerse): CatalogEntry | null {
  if (p.kind === 'panini') {
    return CATALOG.find((e) => e.segment === 'panini') ?? null
  }
  if (p.kind === 'fwc') {
    return CATALOG.find((e) => e.segment === 'fwc' && e.fwcNumber === p.n) ?? null
  }
  return (
    CATALOG.find(
      (e) => e.segment === 'team' && e.teamCode === p.code && e.slotInTeam === p.slot,
    ) ?? null
  )
}

/** Candidatos únicos com entrada de catálogo resolvida (só entradas válidas). */
export function resolveVerseCandidates(ocrText: string): CatalogEntry[] {
  const parsed = extractVerseCandidates(ocrText)
  const byId = new Map<number, CatalogEntry>()
  for (const p of parsed) {
    const e = catalogEntryFromParsed(p)
    if (e) byId.set(e.id, e)
  }
  return [...byId.values()]
}
