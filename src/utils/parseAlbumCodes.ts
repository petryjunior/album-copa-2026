import type { CatalogEntry } from '@/types/catalog'
import { getTeamsUnique } from '@/catalog/catalog'

/** Apelidos PT-BR / curto → código FIFA de 3 letras (extras além dos nomes oficiais do catálogo). */
const EXTRA_NAME_TO_CODE_MAP: Record<string, string> = {
  mexico: 'MEX',
  africa: 'RSA',
  bosnia: 'BIH',
  catar: 'QAT',
  qatar: 'QAT',
  suica: 'SUI',
  brasil: 'BRA',
  eua: 'USA',
  holanda: 'NED',
  'paises baixos': 'NED',
  'países baixos': 'NED',
  curacao: 'CUW',
  'curaçao': 'CUW',
  'costa do marfim': 'CIV',
  ivory: 'CIV',
  argelia: 'ALG',
  cabo: 'CPV',
  'cabo verde': 'CPV',
  arabia: 'KSA',
  croacia: 'CRO',
  inglaterra: 'ENG',
  'nova zelandia': 'NZL',
  'repescagem grupo i': 'IRQ',
  'vencedor repescagem': 'IRQ',
  repescagem: 'IRQ',
  iraque: 'IRQ',
  iraq: 'IRQ',
  poi: 'IRQ',
  'rep dem congo': 'COD',
}

function stripMarks(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function nf(s: string) {
  return stripMarks(s).toLowerCase().trim().replace(/\s+/g, ' ')
}

function buildNameAliases(): Map<string, string> {
  const map = new Map<string, string>()
  for (const t of getTeamsUnique()) {
    map.set(nf(t.name), t.code)
    map.set(nf(t.code), t.code.toUpperCase())
  }
  for (const [alias, code] of Object.entries(EXTRA_NAME_TO_CODE_MAP)) {
    map.set(nf(alias), code)
  }
  return map
}

const ALIASES = buildNameAliases()

function findPanini(catalog: CatalogEntry[]): CatalogEntry | undefined {
  return catalog.find((e) => e.segment === 'panini')
}

function findFwc(catalog: CatalogEntry[], n: number): CatalogEntry | undefined {
  return catalog.find((e) => e.segment === 'fwc' && e.fwcNumber === n)
}

function findTeamSlot(
  catalog: CatalogEntry[],
  code: string,
  slot: number,
): CatalogEntry | undefined {
  const c = code.toUpperCase()
  return catalog.find(
    (e) => e.segment === 'team' && e.teamCode === c && e.slotInTeam === slot,
  )
}

function clampInt(a: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, a))
}

/** Resolve texto colado pelo usuário para IDs internos (dados no celular). */
export function resolveAlbumStickerList(
  raw: string,
  catalog: CatalogEntry[],
): { ids: number[]; errors: string[] } {
  const out = new Set<number>()
  const errors: string[] = []
  const tokens = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  if (!tokens.length) {
    const msg = raw.trim().length
      ? 'Use vírgula entre cada figurinha (ex.: BRA 1, BRA 2). Espaços sozinhos não separam entradas.'
      : 'Nenhum texto para analisar.'
    return { ids: [], errors: [msg] }
  }

  for (const tok of tokens) {
    const u = tok.toUpperCase().replace(/\s+/g, ' ')

    let m = u.match(/^#(\d{1,4})$/)
    if (m) {
      const id = Number(m[1])
      if (catalog.some((e) => e.id === id)) out.add(id)
      else errors.push(`"${tok}": número interno (#) fora do álbum.`)
      continue
    }
    m = u.match(/^INTERNO\s*[:\-]?\s*(\d{1,4})$/i)
    if (m) {
      const id = Number(m[1])
      if (catalog.some((e) => e.id === id)) out.add(id)
      else errors.push(`"${tok}": número interno fora do álbum.`)
      continue
    }

    if (nf(tok) === '00' || nf(tok) === 'panini') {
      const e = findPanini(catalog)
      if (e) out.add(e.id)
      else errors.push(`"${tok}": catálogo sem Panini 00 (erro de dados).`)
      continue
    }

    const fwcWhole = tok.match(/^FWC\D*(\d{1,2})(?:\D+(\d{1,2}))?$/iu)
    if (fwcWhole) {
      const a = clampInt(Number(fwcWhole[1]), 1, 19)
      const b = fwcWhole[2]
        ? clampInt(Number(fwcWhole[2]), 1, 19)
        : a
      const lo = Math.min(a, b)
      const hi = Math.max(a, b)
      for (let n = lo; n <= hi; n++) {
        const e = findFwc(catalog, n)
        if (e) out.add(e.id)
        else errors.push(`FWC ${n}: intervalo válido só 1–19.`)
      }
      continue
    }

    const codeSlot = tok.match(/^([A-Za-z]{3})\D*(\d{1,2})(?:\D*(\d{1,2}))?$/)
    if (codeSlot) {
      const code = codeSlot[1].toUpperCase()
      const a = clampInt(Number(codeSlot[2]), 1, 20)
      const b = codeSlot[3]
        ? clampInt(Number(codeSlot[3]), 1, 20)
        : a
      const lo = Math.min(a, b)
      const hi = Math.max(a, b)
      for (let slot = lo; slot <= hi; slot++) {
        const e = findTeamSlot(catalog, code, slot)
        if (e) out.add(e.id)
        else
          errors.push(
            `"${code} ${slot}": veja código FIFA (3 letras) e figurinha da seleção 1–20.`,
          )
      }
      continue
    }

    const nm = tok.match(/^(.+?)\s+(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?$/)
    if (nm && nm[1].trim().length >= 2 && !/^fwc$/iu.test(nm[1].trim())) {
      const fragment = nf(nm[1])
      let code = ALIASES.get(fragment)
      if (!code) {
        code = [...ALIASES.entries()].find(
          ([k]) => fragment.startsWith(k) || k.startsWith(fragment),
        )?.[1]
      }
      if (!code) {
        errors.push(`"${tok}": seleção não reconhecida. Ex.: Bras 7 ou BRA 7.`)
        continue
      }
      const a = clampInt(Number(nm[2]), 1, 20)
      const b = nm[3] ? clampInt(Number(nm[3]), 1, 20) : a
      const lo = Math.min(a, b)
      const hi = Math.max(a, b)
      for (let slot = lo; slot <= hi; slot++) {
        const e = findTeamSlot(catalog, code, slot)
        if (e) out.add(e.id)
        else errors.push(`"${tok}" (${slot}): combinação inválida.`)
      }
      continue
    }

    const alone = tok.match(/^(\d{1,4})$/)
    if (alone) {
      errors.push(
        `Um número só ("${tok}") não identifica país. Use tipo **Brasil 13** ou **BRA 13** ou **FWC 6**.`,
      )
      continue
    }

    errors.push(`"${tok}" — formato não reconhecido.`)
  }

  const ids = [...out].sort((a, b) => a - b)
  const filteredErrors =
    ids.length === 0
      ? errors.length
        ? errors
        : ['Nada reconhecido. Use Panini/FWC/seleção+número (1–20).']
      : errors

  return { ids, errors: filteredErrors }
}
