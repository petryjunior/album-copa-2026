/**
 * Paletas inspiradas nas cores típicas de cada seleção (bandeira / equipamento).
 * Usadas só na vista detalhada da equipa (Seleções → país).
 */

export type TeamVisualTheme = {
  /** Fundo suave detrás da grelha */
  pageGradient: string
  headerSurface: string
  headerBorder: string
  /** Barra lateral à esquerda do cartão do cabeçalho */
  stripe: string
  primary: string
  primaryDark: string
  accent: string
}

function T(
  primary: string,
  primaryDark: string,
  accent: string,
  /** Cor muito clara para o topo do gradiente (hex com alpha ou tailwind-like mix) */
  washTop: string,
  washBottom?: string,
): TeamVisualTheme {
  const bottom = washBottom ?? `${accent}22`
  return {
    pageGradient: `linear-gradient(165deg, ${washTop} 0%, #ffffff 46%, ${bottom} 100%)`,
    headerSurface: 'rgba(255,255,255,0.94)',
    headerBorder: `${primary}38`,
    stripe: primary,
    primary,
    primaryDark,
    accent,
  }
}

/** Tema neutro (repescagem / desconhecido) */
const NEUTRAL: TeamVisualTheme = {
  pageGradient: 'linear-gradient(165deg, #f1f5f9 0%, #ffffff 50%, #f8fafc 100%)',
  headerSurface: 'rgba(255,255,255,0.94)',
  headerBorder: '#94a3b838',
  stripe: '#64748b',
  primary: '#0d9488',
  primaryDark: '#0f766e',
  accent: '#14b8a6',
}

const TEAM_THEMES: Record<string, TeamVisualTheme> = {
  MEX: T('#006847', '#00452f', '#CE1126', '#d1fae5', '#fecaca44'),
  RSA: T('#007749', '#005c3a', '#ffb81c', '#ecfdf5', '#fde68a33'),
  KOR: T('#0047a0', '#003078', '#cd2e3a', '#dbeafe', '#fecaca33'),
  CZE: T('#11457e', '#0d355f', '#d7141a', '#dbeafe', '#fecaca33'),
  CAN: T('#d52b1e', '#a81e15', '#000000', '#fee2e2', '#f1f5f933'),
  BIH: T('#002395', '#001a6e', '#fecb00', '#dbeafe', '#fef9c333'),
  QAT: T('#8a1538', '#6b0f2b', '#ffffff', '#fce7f3', '#f1f5f944'),
  SUI: T('#d52b1e', '#a81e15', '#ffffff', '#fee2e2', '#f8fafc44'),
  BRA: T('#009c3b', '#007a2f', '#ffdf00', '#ecfccb', '#fef08a55'),
  MAR: T('#c1272d', '#8b1a1f', '#006233', '#fee2e2', '#d1fae544'),
  HAI: T('#00209f', '#001574', '#d21034', '#dbeafe', '#fecaca44'),
  SCO: T('#005eb8', '#004a93', '#ffffff', '#dbeafe', '#f1f5f944'),
  USA: T('#bf0a30', '#8b0723', '#002868', '#ffe4e6', '#dbeafe44'),
  PAR: T('#d52b1e', '#a81e15', '#0038a8', '#fee2e2', '#dbeafe44'),
  AUS: T('#fcd116', '#e6b800', '#00843d', '#fef9c3', '#d1fae544'),
  TUR: T('#e30a17', '#b00812', '#ffffff', '#ffe4e6', '#f1f5f944'),
  GER: T('#000000', '#1a1a1a', '#dd0000', '#e5e5e5', '#fecaca33'),
  CUW: T('#002b7f', '#001f5c', '#f9d616', '#dbeafe', '#fef08a44'),
  CIV: T('#f77f00', '#c46600', '#009e60', '#ffedd5', '#d1fae544'),
  ECU: T('#ffdd00', '#e6c800', '#034ea2', '#fef9c3', '#dbeafe44'),
  NED: T('#ff6600', '#cc5200', '#21468b', '#ffedd5', '#dbeafe44'),
  JPN: T('#bc002d', '#8e0022', '#ffffff', '#ffe4e6', '#f8fafc44'),
  SWE: T('#006aa7', '#004f7d', '#fecc00', '#dbeafe', '#fef9c344'),
  TUN: T('#e70013', '#b8000f', '#ffffff', '#ffe4e6', '#f1f5f944'),
  BEL: T('#000000', '#2d2d2d', '#fae042', '#e5e5e5', '#fef08a44'),
  EGY: T('#c8102e', '#9a0c23', '#ffffff', '#ffe4e6', '#f8fafc44'),
  IRN: T('#239f40', '#1a7a31', '#da0000', '#d1fae5', '#fecaca44'),
  NZL: T('#000000', '#1e293b', '#ffffff', '#e2e8f0', '#f8fafc44'),
  ESP: T('#aa151b', '#7d0f14', '#f1bf00', '#fee2e2', '#fef9c344'),
  CPV: T('#003893', '#002a6e', '#cf2027', '#dbeafe', '#fecaca44'),
  KSA: T('#006c35', '#004824', '#ffffff', '#d1fae5', '#f8fafc44'),
  URU: T('#0038a8', '#002a7d', '#fcd116', '#dbeafe', '#fef9c344'),
  FRA: T('#002395', '#001a6e', '#ed2939', '#dbeafe', '#fecaca44'),
  SEN: T('#00853f', '#006330', '#fdef42', '#d1fae5', '#fef9c344'),
  IRQ: T('#007a3d', '#00582e', '#000000', '#d1fae5', '#fecaca33'),
  NOR: T('#ba0c2f', '#8a0923', '#002868', '#ffe4e6', '#dbeafe44'),
  ARG: T('#75aadb', '#4a8ec4', '#ffffff', '#dbeafe', '#f8fafc55'),
  ALG: T('#006233', '#004824', '#d21034', '#d1fae5', '#fecaca44'),
  AUT: T('#ed2939', '#b81e2b', '#ffffff', '#ffe4e6', '#f8fafc44'),
  JOR: T('#000000', '#1e293b', '#ce1126', '#e2e8f0', '#fecaca44'),
  POR: T('#ff0000', '#cc0000', '#006600', '#ffe4e6', '#d1fae544'),
  COD: T('#007fff', '#0066cc', '#f7d618', '#dbeafe', '#fef9c344'),
  UZB: T('#1eb53a', '#178a2d', '#0099b5', '#d1fae5', '#cffafe44'),
  COL: T('#fcd116', '#e6b800', '#003893', '#fef9c3', '#dbeafe44'),
  ENG: T('#ce1124', '#9e0d1c', '#ffffff', '#ffe4e6', '#f8fafc44'),
  CRO: T('#171796', '#0f0f66', '#ffffff', '#e0e7ff', '#f8fafc44'),
  GHA: T('#006b3f', '#004d2d', '#fcd116', '#d1fae5', '#fef9c344'),
  PAN: T('#da121a', '#a50e14', '#072357', '#fee2e2', '#dbeafe44'),
}

export function getTeamTheme(code: string): TeamVisualTheme {
  return TEAM_THEMES[code] ?? NEUTRAL
}
