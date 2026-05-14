import { useCallback, useEffect, useRef, useState } from 'react'
import type { CatalogEntry } from '@/types/catalog'
import { useCollection } from '@/context/CollectionContext'
import { resolveVerseCandidates } from '@/utils/stickerVerseOcr'
import { stickerShareLabel } from '@/utils/shareTexts'

type Phase = 'idle' | 'preparing' | 'scanning' | 'busy' | 'pick' | 'result' | 'error'

const SCAN_INTERVAL_MS = 850
const MAX_FRAME_SIDE = 960
/** Leituras consecutivas com um único candidato igual antes de aceitar (como “lock” em leitor de código). */
const STABLE_HITS_REQUIRED = 2

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
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const workerRef = useRef<{ recognize: (img: HTMLCanvasElement) => Promise<{ data: { text: string } }>; terminate: () => Promise<void> } | null>(null)
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inFlightRef = useRef(false)
  const scanGenRef = useRef(0)
  const stableIdRef = useRef<number | null>(null)
  const stableCountRef = useRef(0)
  const scanPassRef = useRef(0)

  const [phase, setPhase] = useState<Phase>('idle')
  const [busyPct, setBusyPct] = useState(0)
  const [ocrRaw, setOcrRaw] = useState('')
  const [candidates, setCandidates] = useState<CatalogEntry[]>([])
  const [selected, setSelected] = useState<CatalogEntry | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [scanHint, setScanHint] = useState('')
  const [scanPass, setScanPass] = useState(0)
  const [scanBusy, setScanBusy] = useState(false)

  const stopLiveCapture = useCallback(async () => {
    scanGenRef.current += 1
    if (scanTimerRef.current != null) {
      clearInterval(scanTimerRef.current)
      scanTimerRef.current = null
    }
    const stream = streamRef.current
    if (stream) {
      for (const t of stream.getTracks()) t.stop()
      streamRef.current = null
    }
    const v = videoRef.current
    if (v) {
      v.srcObject = null
    }
    const w = workerRef.current
    if (w) {
      try {
        await w.terminate()
      } catch {
        /* ignore */
      }
      workerRef.current = null
    }
    inFlightRef.current = false
    stableIdRef.current = null
    stableCountRef.current = 0
    scanPassRef.current = 0
    setScanPass(0)
    setScanBusy(false)
    setScanHint('')
  }, [])

  const closeOverlay = useCallback(async () => {
    await stopLiveCapture()
    setPhase('idle')
    setCandidates([])
    setSelected(null)
    setOcrRaw('')
    setErrorMsg('')
    setBusyPct(0)
  }, [stopLiveCapture])

  const tickOcrFrame = useCallback(async () => {
    const genAtStart = scanGenRef.current
    if (inFlightRef.current) return
    const worker = workerRef.current
    const video = videoRef.current
    if (!worker || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return

    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return

    inFlightRef.current = true
    setScanBusy(true)
    setScanHint('A ler texto na imagem…')

    try {
      let canvas = canvasRef.current
      if (!canvas) {
        canvas = document.createElement('canvas')
        canvasRef.current = canvas
      }
      const scale = Math.min(1, MAX_FRAME_SIDE / Math.max(vw, vh))
      const cw = Math.max(1, Math.floor(vw * scale))
      const ch = Math.max(1, Math.floor(vh * scale))
      canvas.width = cw
      canvas.height = ch
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(video, 0, 0, cw, ch)

      const {
        data: { text },
      } = await worker.recognize(canvas)

      if (genAtStart !== scanGenRef.current) return

      scanPassRef.current += 1
      setScanPass(scanPassRef.current)

      const resolved = resolveVerseCandidates(text ?? '')

      if (resolved.length === 1) {
        const entry = resolved[0]
        if (stableIdRef.current === entry.id) {
          stableCountRef.current += 1
        } else {
          stableIdRef.current = entry.id
          stableCountRef.current = 1
        }
        setScanHint(
          stableCountRef.current >= STABLE_HITS_REQUIRED
            ? `Confirmado: ${stickerShareLabel(entry)}`
            : `Detetado ${stickerShareLabel(entry)} — a confirmar (${stableCountRef.current}/${STABLE_HITS_REQUIRED})…`,
        )
        if (stableCountRef.current >= STABLE_HITS_REQUIRED) {
          if (scanTimerRef.current != null) {
            clearInterval(scanTimerRef.current)
            scanTimerRef.current = null
          }
          await stopLiveCapture()
          setOcrRaw(text ?? '')
          setSelected(entry)
          setPhase('result')
        }
      } else if (resolved.length > 1) {
        stableIdRef.current = null
        stableCountRef.current = 0
        if (scanTimerRef.current != null) {
          clearInterval(scanTimerRef.current)
          scanTimerRef.current = null
        }
        await stopLiveCapture()
        setCandidates(resolved)
        setOcrRaw(text ?? '')
        setPhase('pick')
        setScanHint('')
      } else {
        stableIdRef.current = null
        stableCountRef.current = 0
        setScanHint('À procura de código no verso (ex.: BIH 12, FWC 7)…')
      }
    } catch {
      if (genAtStart === scanGenRef.current) {
        setScanHint('Leitura falhou — mantém firme, foco e boa luz.')
      }
    } finally {
      inFlightRef.current = false
      if (genAtStart === scanGenRef.current) {
        setScanBusy(false)
      }
    }
  }, [stopLiveCapture])

  const startLiveCamera = useCallback(async () => {
    setErrorMsg('')
    setScanHint('A pedir acesso à câmera…')
    setPhase('preparing')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      if (!videoRef.current) {
        for (const t of stream.getTracks()) t.stop()
        throw new Error('no video element')
      }
      streamRef.current = stream
      const v = videoRef.current
      v.srcObject = stream
      await v.play()
      setScanHint('A preparar reconhecimento de texto…')
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng', 1, { logger: () => {} })
      workerRef.current = worker
      setPhase('scanning')
      setScanHint('À procura de código no verso…')
      void tickOcrFrame()
      scanTimerRef.current = window.setInterval(() => {
        void tickOcrFrame()
      }, SCAN_INTERVAL_MS)
    } catch {
      await stopLiveCapture()
      setErrorMsg(
        'Não foi possível usar a câmera. Confirma permissões no browser ou HTTPS. Podes tentar «Carregar imagem» abaixo.',
      )
      setPhase('error')
    }
  }, [stopLiveCapture, tickOcrFrame])

  useEffect(() => {
    return () => {
      void stopLiveCapture()
    }
  }, [stopLiveCapture])

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
            'Não encontrámos um código válido (ex.: BIH 12 ou FWC 7). Tenta imagem mais nítida, com boa luz, focando o canto do verso.',
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
        setErrorMsg('Não foi possível ler a imagem.')
        setPhase('error')
      }
    },
    [notify],
  )

  const albumQty = selected ? state[selected.id] ?? 0 : 0
  const limboQty = selected ? limboState[selected.id] ?? 0 : 0

  const overlayOpen = phase !== 'idle'

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-black text-slate-900">Câmera — verso da figurinha</h2>
      <p className="mb-3 mt-1 text-xs text-slate-600">
        Modo ao vivo: aponta a câmera ao verso; o app lê o vídeo em intervalos (como um leitor de códigos). Mantém firme
        até aparecer confirmação. Também podes carregar uma imagem se a câmera não estiver disponível.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        onChange={onFileChange}
      />
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="w-full rounded-2xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          onClick={() => void startLiveCamera()}
        >
          Câmera ao vivo
        </button>
        <button
          type="button"
          className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          onClick={() => inputRef.current?.click()}
        >
          Carregar imagem (alternativa)
        </button>
      </div>

      {overlayOpen && (
        <div
          className="fixed inset-0 z-50 bg-black"
          role="dialog"
          aria-modal="true"
          aria-labelledby="verse-scan-title"
        >
          <h2 id="verse-scan-title" className="sr-only">
            {phase === 'preparing' || phase === 'scanning'
              ? 'Câmera ao vivo — leitura do verso'
              : phase === 'busy'
                ? 'A processar imagem'
                : 'Resultado da leitura do verso'}
          </h2>
          {(phase === 'preparing' || phase === 'scanning') && (
            <div className="relative h-full w-full">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
                muted
                autoPlay
                aria-hidden
              />
              <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-white/10" />
              {phase === 'preparing' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 px-6">
                  <div
                    className="h-12 w-12 rounded-full border-4 border-teal-300/30 border-t-teal-300 animate-spin"
                    aria-hidden
                  />
                  <p className="mt-4 text-center text-sm font-semibold text-white">{scanHint}</p>
                </div>
              )}
              {phase === 'scanning' && (
                <>
                  <div className="pointer-events-none absolute inset-x-5 top-16 bottom-36 rounded-2xl border-2 border-dashed border-teal-400/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
                  <div className="pointer-events-none absolute left-0 right-0 top-14 flex justify-center">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-200">
                      Ao vivo · OCR
                    </span>
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pb-10 pt-20">
                    <p className="text-center text-sm font-semibold text-white drop-shadow">{scanHint}</p>
                    <p className="mt-1 text-center text-xs text-white/85">
                      Leitura #{scanPass}
                      {scanBusy ? ' · a processar quadro…' : ' · pronto para o próximo'}
                    </p>
                  </div>
                </>
              )}
              <button
                type="button"
                className="absolute left-3 top-3 z-20 rounded-full bg-black/55 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-black/70"
                onClick={() => void closeOverlay()}
              >
                Fechar
              </button>
            </div>
          )}

          {(phase === 'busy' || phase === 'pick' || phase === 'result' || phase === 'error') && (
            <div
              className="flex h-full items-end justify-center bg-black/55 p-3 sm:items-center"
              onClick={(ev) => {
                if (ev.target === ev.currentTarget) void closeOverlay()
              }}
            >
              <div
                className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-xl"
                onClick={(ev) => ev.stopPropagation()}
              >
                <h3 className="text-base font-black text-slate-900">
                  {phase === 'busy' && 'A ler imagem…'}
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
                        <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono">
                          {ocrRaw}
                        </pre>
                      </details>
                    )}
                    <button
                      type="button"
                      className="w-full rounded-2xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                      onClick={() => void closeOverlay()}
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
                      onClick={() => void closeOverlay()}
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
                            void closeOverlay()
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
                          void closeOverlay()
                        }}
                      >
                        Abrir no editor
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                        onClick={() => void closeOverlay()}
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
