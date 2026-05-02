/** Parse "1, 5, 10-12, 980" em lista de ids únicos dentro de [1, maxId] */
export function parseStickerInput(input: string, maxId = 980): number[] {
  const parts = input
    .split(/[\s,;\n]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const out = new Set<number>()
  for (const p of parts) {
    const range = p.match(/^(\d+)\s*-\s*(\d+)$/)
    if (range) {
      let a = Number(range[1])
      let b = Number(range[2])
      if (Number.isNaN(a) || Number.isNaN(b)) continue
      if (a > b) [a, b] = [b, a]
      for (let i = a; i <= b; i++) {
        if (i >= 1 && i <= maxId) out.add(i)
      }
      continue
    }
    const n = Number(p)
    if (!Number.isNaN(n) && n >= 1 && n <= maxId) out.add(n)
  }
  return [...out].sort((a, b) => a - b)
}

export function formatCompactRanges(ids: number[]): string {
  if (!ids.length) return ''
  let s = ''
  let i = 0
  while (i < ids.length) {
    const start = ids[i]
    let end = start
    while (i + 1 < ids.length && ids[i + 1] === end + 1) {
      i++
      end = ids[i]
    }
    const piece = start === end ? `${start}` : `${start}-${end}`
    s += (s ? ',' : '') + piece
    i++
  }
  return s
}
