/**
 * Map catalog team codes (FIFA-style) to flag representation.
 * - Primary UI uses PNG from flagcdn (works on Windows; emoji regional indicators often render as "MX", "ZA").
 * - Emoji strings kept for offline/fallback when images fail to load.
 */

/** Lowercase slug for https://flagcdn.com — see supported codes on flagcdn. */
const CODE_TO_FLAGCDN_SLUG: Record<string, string | null> = {
  MEX: 'mx',
  RSA: 'za',
  KOR: 'kr',
  CZE: 'cz',
  CAN: 'ca',
  BIH: 'ba',
  QAT: 'qa',
  SUI: 'ch',
  BRA: 'br',
  MAR: 'ma',
  HAI: 'ht',
  SCO: 'gb-sct',
  USA: 'us',
  PAR: 'py',
  AUS: 'au',
  TUR: 'tr',
  GER: 'de',
  CUW: 'cw',
  CIV: 'ci',
  ECU: 'ec',
  NED: 'nl',
  JPN: 'jp',
  SWE: 'se',
  TUN: 'tn',
  BEL: 'be',
  EGY: 'eg',
  IRN: 'ir',
  NZL: 'nz',
  ESP: 'es',
  CPV: 'cv',
  KSA: 'sa',
  URU: 'uy',
  FRA: 'fr',
  SEN: 'sn',
  POI: null,
  NOR: 'no',
  ARG: 'ar',
  ALG: 'dz',
  AUT: 'at',
  JOR: 'jo',
  POR: 'pt',
  COD: 'cd',
  UZB: 'uz',
  COL: 'co',
  ENG: 'gb-eng',
  CRO: 'hr',
  GHA: 'gh',
  PAN: 'pa',
}

export function teamCodeToFlagSlug(code: string): string | null {
  if (code in CODE_TO_FLAGCDN_SLUG) return CODE_TO_FLAGCDN_SLUG[code] ?? null
  return null
}

function regionalPair(iso2: string): string {
  const u = iso2.toUpperCase()
  if (u.length !== 2) return '\u{1F3F3}\u{FE0F}'
  const A = 0x1f1e6
  const cp = [u.charCodeAt(0), u.charCodeAt(1)].map((c) => A + (c - 65))
  return String.fromCodePoint(...cp)
}

/** Scotland 🏴󠁧󠁢󠁳󠁣󠁴󠁿 */
const FLAG_SCO = String.fromCodePoint(
  0x1f3f4,
  0xe0067,
  0xe0062,
  0xe0073,
  0xe0063,
  0xe0074,
  0xe007f,
)

/** England 🏴󠁧󠁢󠁥󠁮󠁧󠁿 */
const FLAG_ENG = String.fromCodePoint(
  0x1f3f4,
  0xe0067,
  0xe0062,
  0xe0065,
  0xe006e,
  0xe0067,
  0xe007f,
)

/** Placeholder when the participant is not yet known (repescagem). */
const FLAG_TBD = '\u{1F3F3}\u{FE0F}'

const CODE_TO_FLAG: Record<string, string> = {
  MEX: regionalPair('MX'),
  RSA: regionalPair('ZA'),
  KOR: regionalPair('KR'),
  CZE: regionalPair('CZ'),
  CAN: regionalPair('CA'),
  BIH: regionalPair('BA'),
  QAT: regionalPair('QA'),
  SUI: regionalPair('CH'),
  BRA: regionalPair('BR'),
  MAR: regionalPair('MA'),
  HAI: regionalPair('HT'),
  SCO: FLAG_SCO,
  USA: regionalPair('US'),
  PAR: regionalPair('PY'),
  AUS: regionalPair('AU'),
  TUR: regionalPair('TR'),
  GER: regionalPair('DE'),
  CUW: regionalPair('CW'),
  CIV: regionalPair('CI'),
  ECU: regionalPair('EC'),
  NED: regionalPair('NL'),
  JPN: regionalPair('JP'),
  SWE: regionalPair('SE'),
  TUN: regionalPair('TN'),
  BEL: regionalPair('BE'),
  EGY: regionalPair('EG'),
  IRN: regionalPair('IR'),
  NZL: regionalPair('NZ'),
  ESP: regionalPair('ES'),
  CPV: regionalPair('CV'),
  KSA: regionalPair('SA'),
  URU: regionalPair('UY'),
  FRA: regionalPair('FR'),
  SEN: regionalPair('SN'),
  POI: FLAG_TBD,
  NOR: regionalPair('NO'),
  ARG: regionalPair('AR'),
  ALG: regionalPair('DZ'),
  AUT: regionalPair('AT'),
  JOR: regionalPair('JO'),
  POR: regionalPair('PT'),
  COD: regionalPair('CD'),
  UZB: regionalPair('UZ'),
  COL: regionalPair('CO'),
  ENG: FLAG_ENG,
  CRO: regionalPair('HR'),
  GHA: regionalPair('GH'),
  PAN: regionalPair('PA'),
}

export function teamCodeToFlagEmoji(code: string): string {
  return CODE_TO_FLAG[code] ?? '\u{1F3F3}\u{FE0F}'
}
