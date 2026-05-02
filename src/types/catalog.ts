/** Trecho físico do álbum (estrutura informada oficialmente/colagem). */
export type CatalogSegment = 'panini' | 'fwc' | 'team'

/** Metadados de cada figurinha (980 no total). IDs 1–980 = ordem do álbum físico ao longo das páginas. */
export type CatalogEntry = {
  id: number
  segment: CatalogSegment
  /** Texto principal como aparece nos cromos: “00”, “FWC 3”, “15” dentro da seleção etc. */
  displayPrinted: string
  /** 1–19 quando `segment === 'fwc'`; caso contrário `null`. */
  fwcNumber: number | null
  teamCode: string | null
  teamName: string | null
  group: string | null
  /** Nº 1–20 impresso dentro de cada país; `null` em Panini e FWC. */
  slotInTeam: number | null
  extraLabel: string | null
  /** Metalizada — marque quando tiver checklist oficial número a número */
  metalizada: boolean
}

export type PersistedShape = {
  /** Ordem física atual: Panini 00 → FWC1–8 → seleções → FWC9–19. */
  version: 3
  /** Quantidade total por id (1–980); ≥1 conta como “tem no álbum”. */
  quantities: Record<string, number>
}
