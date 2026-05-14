/**
 * Converte coordenadas do ecrã (clientX/Y) para [0,1] no quadro de vídeo,
 * tendo em conta object-fit: cover e object-position: center (default).
 */
export function normalizedPointInVideoFrame(
  video: HTMLVideoElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = video.getBoundingClientRect()
  const ex = clientX - rect.left
  const ey = clientY - rect.top
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh || rect.width <= 0 || rect.height <= 0) {
    return { x: 0.5, y: 0.5 }
  }
  const scale = Math.max(rect.width / vw, rect.height / vh)
  const dispW = vw * scale
  const dispH = vh * scale
  const offX = (rect.width - dispW) / 2
  const offY = (rect.height - dispH) / 2
  const vx = (ex - offX) / scale
  const vy = (ey - offY) / scale
  const x = Math.min(1, Math.max(0, vx / vw))
  const y = Math.min(1, Math.max(0, vy / vh))
  return { x, y }
}

function supportsMode(modes: string | string[] | undefined, v: string): boolean {
  if (!modes) return false
  return (Array.isArray(modes) ? modes : [modes]).includes(v)
}

type CapLike = MediaTrackCapabilities & {
  focusMode?: string | string[]
  exposureMode?: string | string[]
  whiteBalanceMode?: string | string[]
  pointsOfInterest?: boolean
}

/** Activa AF / exposição contínua quando o dispositivo e o browser expõem estas capacidades. */
export async function applyVideoAutofocusPreferences(track: MediaStreamTrack): Promise<void> {
  if (track.kind !== 'video' || !track.getCapabilities) return
  const caps = track.getCapabilities() as CapLike
  const next: Record<string, string> = {}
  if (supportsMode(caps.focusMode, 'continuous')) next.focusMode = 'continuous'
  else if (supportsMode(caps.focusMode, 'single-shot')) next.focusMode = 'single-shot'
  if (supportsMode(caps.exposureMode, 'continuous')) next.exposureMode = 'continuous'
  if (supportsMode(caps.whiteBalanceMode, 'continuous')) next.whiteBalanceMode = 'continuous'
  if (Object.keys(next).length === 0) return
  try {
    await track.applyConstraints(next as MediaTrackConstraints)
  } catch {
    /* ignorar — muitos browsers não aplicam foco ao stream web */
  }
}

/**
 * Força um ciclo de AF (quando suportado). Opcionalmente define ponto de interesse normalizado.
 */
export async function refocusVideoTrack(
  track: MediaStreamTrack,
  interest?: { x: number; y: number },
): Promise<boolean> {
  if (track.kind !== 'video' || !track.getCapabilities) return false
  const caps = track.getCapabilities() as CapLike

  if (interest && caps.pointsOfInterest) {
    try {
      await track.applyConstraints({ pointsOfInterest: [interest] } as MediaTrackConstraints)
      return true
    } catch {
      try {
        await track.applyConstraints({
          advanced: [{ pointsOfInterest: [interest] } as MediaTrackConstraintSet],
        } as MediaTrackConstraints)
        return true
      } catch {
        /* continuar para single-shot */
      }
    }
  }

  const modes = caps.focusMode
  const list = !modes ? [] : Array.isArray(modes) ? modes : [modes]
  try {
    if (list.includes('single-shot')) {
      await track.applyConstraints({ focusMode: 'single-shot' } as MediaTrackConstraints)
      await new Promise((r) => setTimeout(r, 350))
    }
    if (list.includes('continuous')) {
      await track.applyConstraints({ focusMode: 'continuous' } as MediaTrackConstraints)
      return true
    }
    if (list.includes('single-shot')) {
      await track.applyConstraints({ focusMode: 'single-shot' } as MediaTrackConstraints)
      return true
    }
  } catch {
    return false
  }
  return false
}
