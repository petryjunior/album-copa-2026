import { useCallback, useRef, useState } from 'react'
import type { CatalogEntry } from '@/types/catalog'
import { useCollection } from '@/context/CollectionContext'
import { resolveVerseCandidates } from '@/utils/stickerVerseOcr'
import { stickerShareLabel } from '@/utils/shareTexts'

type Phase = 'idle' | 'busy' | 'pick' | 'result' | 'error'

async function ocrImageFile(file: File, onProgress: (p: number) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng', 1, {
    logger: (m: { status?: string; progress?: number }) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })
  try {
    onProgress(0)
    const {
      data: { text },
    } = await worker.recognize(file)
    return text ?? ''
  } finally {
    await worker.terminate()
  }
}

export function StickerVerseCameraSection({
  notify,
  onOpenSticker,
}: {
  notify: (msg: string) => void
  onOpenSticker: (entry: CatalogEntry) => void
}) {
  const { state, limboState, incLimbo } = useCollection()
  const inputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [busyPct, setBusyPct] = useState(0)
  const [ocrRaw, setOcrRaw] = useState('')
  const [candidates, setCandidates] = useState<CatalogEntry[]>([])
  const [selected, setSelected] = useState<CatalogEntry | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const closeOverlay = useCallback(() => {
    setPhase('idle')
    setCandidates([])
    setSelected(null)
    setOcrRaw('')
    setErrorMsg('')
    setBusyPct(0)
  }, [])

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !file.type.startsWith('image/')) {
        notify('Escolhe uma imagem (foto do verso).')
        return
      }
      setPhase('busy')
      setBusyPct(0)
      setErrorMsg('')
      try {
        const text = await ocrImageFile(file, setBusyPct)
        setOcrRaw(text)
        const resolved = resolveVerseCandidates(text)
        if (resolved.length === 0) {
          setErrorMsg(
            'Não encontrámos um código válido (ex.: BIH 12 ou FWC 7). Tenta foto mais nítida, com boa luz, focando o canto do verso.',
          )
          setPhase('error')
          return
        }
        if (resolved.length === 1) {
          setSelected(resolved[0])
          setPhase('result')
          return
        }
        setCandidates(resolved)
        setPhase('pick')
      } catch {
        setErrorMsg('Não foi possível ler a imagem. Verifica permissões da câmera ou tenta outra foto.')
        setPhase('error')
      }
    },
    [notify],
  )

  const albumQty = selected ? state[selected.id] ?? 0 : 0
  const limboQty = selected ? limboState[selected.id] ?? 0 : 0

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-black text-slate-900">Câmera — verso da figurinha</h2>
      <p className="mb-3 mt-1 text-xs text-slate-600">
        Tira uma foto do verso (código de 3 letras + número, ou FWC, ou 00). O reconhecimento é automático e pode
        falhar; confirma sempre no menu que abre.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden
        onChange={onFileChange}
      />
      <button
        type="button"
        className="w-full rounded-2xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        onClick={() => inputRef.current?.click()}
      >
        Abrir câmera / galeria
      </button>

      {(phase === 'busy' || phase === 'pick' || phase === 'result' || phase === 'error') && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="verse-scan-title"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) closeOverlay()
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-xl"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h3 id="verse-scan-title" className="text-base font-black text-slate-900">
              {phase === 'busy' && 'A ler o verso…'}
              {phase === 'pick' && 'Várias figurinhas possíveis'}
              {phase === 'result' && 'Resultado'}
              {phase === 'error' && 'Não deu para identificar'}
            </h3>

            {phase === 'busy' && (
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p>OCR em curso… {busyPct}%</p>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-teal-600 transition-[width] duration-200"
                    style={{ width: `${busyPct}%` }}
                  />
                </div>
              </div>
            )}

            {phase === 'error' && (
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <p>{errorMsg}</p>
                {ocrRaw.trim().length > 0 && (
                  <details className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <summary className="cursor-pointer font-medium text-slate-800">Texto bruto do OCR</summary>
                    <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono">{ocrRaw}</pre>
                  </details>
                )}
                <button
                  type="button"
                  className="w-full rounded-2xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={closeOverlay}
                >
                  Fechar
                </button>
              </div>
            )}

            {phase === 'pick' && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-600">Escolhe a que corresponde ao verso:</p>
                <ul className="space-y-2">
                  {candidates.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full rounded-2xl border border-teal-200 bg-teal-50 px-3 py-3 text-left text-sm font-semibold text-teal-950 hover:bg-teal-100"
                        onClick={() => {
                          setSelected(c)
                          setPhase('result')
                        }}
                      >
                        {stickerShareLabel(c)}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-2 w-full rounded-2xl border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={closeOverlay}
                >
                  Cancelar
                </button>
              </div>
            )}

            {phase === 'result' && selected && (
              <div className="mt-3 space-y-3 text-sm text-slate-800">
                <p className="text-lg font-black text-slate-900">{stickerShareLabel(selected)}</p>
                <ul className="list-none space-y-1 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                  <li>
                    <span className="text-slate-600">No álbum: </span>
                    <span className="font-semibold">{albumQty}</span>
                  </li>
                  <li>
                    <span className="text-slate-600">No limbo (trocas): </span>
                    <span className="font-semibold">{limboQty}</span>
                  </li>
                </ul>

                {albumQty >= 1 ? (
                  <p className="text-xs text-slate-600">Já tens esta figurinha colada no álbum (pelo menos uma).</p>
                ) : (
                  <p className="text-xs text-slate-600">
                    Ainda não tens quantidade no álbum. Queres registar <strong>1 unidade no limbo</strong> (troca
                    disponível para colar depois)?
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  {albumQty < 1 && (
                    <button
                      type="button"
                      className="rounded-2xl bg-teal-700 px-3 py-3 text-sm font-semibold text-white hover:bg-teal-800"
                      onClick={() => {
                        incLimbo(selected.id, 1)
                        notify('Adicionado 1 ao limbo.')
                        closeOverlay()
                      }}
                    >
                      Sim — adicionar 1 ao limbo
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    onClick={() => {
                      onOpenSticker(selected)
                      closeOverlay()
                    }}
                  >
                    Abrir no editor
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                    onClick={closeOverlay}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
