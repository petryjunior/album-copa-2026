import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Mesma lista que src/catalog/catalog.ts — mantém sincronizado ao editar grupos ou potes */
const TEAMS_ORDER = [
  { group: 'A', code: 'MEX', name: 'México' },
  { group: 'A', code: 'RSA', name: 'África do Sul' },
  { group: 'A', code: 'KOR', name: 'Coreia do Sul' },
  { group: 'A', code: 'CZE', name: 'República Tcheca' },
  { group: 'B', code: 'CAN', name: 'Canadá' },
  { group: 'B', code: 'BIH', name: 'Bósnia e Herzegovina' },
  { group: 'B', code: 'QAT', name: 'Catar' },
  { group: 'B', code: 'SUI', name: 'Suíça' },
  { group: 'C', code: 'BRA', name: 'Brasil' },
  { group: 'C', code: 'MAR', name: 'Marrocos' },
  { group: 'C', code: 'HAI', name: 'Haiti' },
  { group: 'C', code: 'SCO', name: 'Escócia' },
  { group: 'D', code: 'USA', name: 'Estados Unidos' },
  { group: 'D', code: 'PAR', name: 'Paraguai' },
  { group: 'D', code: 'AUS', name: 'Austrália' },
  { group: 'D', code: 'TUR', name: 'Turquia' },
  { group: 'E', code: 'GER', name: 'Alemanha' },
  { group: 'E', code: 'CUW', name: 'Curaçao' },
  { group: 'E', code: 'CIV', name: 'Costa do Marfim' },
  { group: 'E', code: 'ECU', name: 'Equador' },
  { group: 'F', code: 'NED', name: 'Holanda' },
  { group: 'F', code: 'JPN', name: 'Japão' },
  { group: 'F', code: 'SWE', name: 'Suécia' },
  { group: 'F', code: 'TUN', name: 'Tunísia' },
  { group: 'G', code: 'BEL', name: 'Bélgica' },
  { group: 'G', code: 'EGY', name: 'Egito' },
  { group: 'G', code: 'IRN', name: 'Irã' },
  { group: 'G', code: 'NZL', name: 'Nova Zelândia' },
  { group: 'H', code: 'ESP', name: 'Espanha' },
  { group: 'H', code: 'CPV', name: 'Cabo Verde' },
  { group: 'H', code: 'KSA', name: 'Arábia Saudita' },
  { group: 'H', code: 'URU', name: 'Uruguai' },
  { group: 'I', code: 'FRA', name: 'França' },
  { group: 'I', code: 'SEN', name: 'Senegal' },
  { group: 'I', code: 'IRQ', name: 'Iraque' },
  { group: 'I', code: 'NOR', name: 'Noruega' },
  { group: 'J', code: 'ARG', name: 'Argentina' },
  { group: 'J', code: 'ALG', name: 'Argélia' },
  { group: 'J', code: 'AUT', name: 'Áustria' },
  { group: 'J', code: 'JOR', name: 'Jordânia' },
  { group: 'K', code: 'POR', name: 'Portugal' },
  { group: 'K', code: 'COD', name: 'República Democrática do Congo' },
  { group: 'K', code: 'UZB', name: 'Uzbequistão' },
  { group: 'K', code: 'COL', name: 'Colômbia' },
  { group: 'L', code: 'ENG', name: 'Inglaterra' },
  { group: 'L', code: 'CRO', name: 'Croácia' },
  { group: 'L', code: 'GHA', name: 'Gana' },
  { group: 'L', code: 'PAN', name: 'Panamá' },
]

function buildCatalog() {
  if (TEAMS_ORDER.length !== 48) {
    throw new Error(`Esperado 48 seleções, temos ${TEAMS_ORDER.length}`)
  }
  const entries = []
  let id = 1

  entries.push({
    id: id++,
    segment: 'panini',
    displayPrinted: '00',
    fwcNumber: null,
    teamCode: null,
    teamName: null,
    group: null,
    slotInTeam: null,
    extraLabel: 'Figurinha oficial Panini nº 00',
    metalizada: false,
  })

  for (let f = 1; f <= 8; f++) {
    entries.push({
      id: id++,
      segment: 'fwc',
      displayPrinted: `FWC ${f}`,
      fwcNumber: f,
      teamCode: null,
      teamName: null,
      group: null,
      slotInTeam: null,
      extraLabel: `Especial Copa do Mundo (FWC ${f})`,
      metalizada: false,
    })
  }

  for (const t of TEAMS_ORDER) {
    for (let slot = 1; slot <= 20; slot++) {
      entries.push({
        id: id++,
        segment: 'team',
        displayPrinted: String(slot),
        fwcNumber: null,
        teamCode: t.code,
        teamName: t.name,
        group: t.group,
        slotInTeam: slot,
        extraLabel: null,
        metalizada: false,
      })
    }
  }

  for (let f = 9; f <= 19; f++) {
    entries.push({
      id: id++,
      segment: 'fwc',
      displayPrinted: `FWC ${f}`,
      fwcNumber: f,
      teamCode: null,
      teamName: null,
      group: null,
      slotInTeam: null,
      extraLabel: `Especial Copa do Mundo (FWC ${f})`,
      metalizada: false,
    })
  }

  if (entries.length !== 980) {
    throw new Error(`Esperado 980 figurinhas após montagem física; temos ${entries.length}`)
  }
  return entries
}

const outDir = join(__dirname, '..', 'public', 'album')
const outPath = join(outDir, 'catalog.json')
const payload = buildCatalog()

await mkdir(outDir, { recursive: true })
await writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8')
console.log(`Escrito ${outPath} (${payload.length} figurinhas).`)
