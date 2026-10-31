import { toBlob } from 'html-to-image'

/** Render a DOM node to a PNG blob. Everything is local, so it works offline once loaded. */
export async function renderNodeToBlob(node: HTMLElement, opts: { pixelRatio?: number } = {}): Promise<Blob> {
  // Make sure web fonts are ready so Chinese glyphs don't render as fallbacks.
  if (document.fonts?.ready) await document.fonts.ready
  const options = { pixelRatio: opts.pixelRatio ?? Math.max(3, window.devicePixelRatio || 1), cacheBust: true }
  // First pass warms the image/font cache in some browsers (notably Safari).
  await toBlob(node, options).catch(() => undefined)
  const blob = await toBlob(node, options)
  if (!blob) throw new Error('render failed')
  return blob
}

/** Desktop: save via a normal file download. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Phones and tablets: there the system share sheet is how an image reaches the photo album. */
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true
}

export type ShareResult = 'shared' | 'cancelled' | 'unsupported'

/**
 * Open the system share sheet with the image (iOS: 儲存影像 / Save Image; Android: Photos,
 * LINE, IG…). Must run close to the tap: browsers drop the user gesture after async work,
 * so callers should have the blob ready before the tap.
 */
export async function shareImage(blob: Blob, filename: string, title: string): Promise<ShareResult> {
  const file = new File([blob], filename, { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (!nav.share || !nav.canShare?.({ files: [file] })) return 'unsupported'
  try {
    await nav.share({ files: [file], title })
    return 'shared'
  } catch (err) {
    // AbortError = the person closed the sheet. NotAllowedError = gesture expired, etc.
    return (err as DOMException)?.name === 'AbortError' ? 'cancelled' : 'unsupported'
  }
}

export function exportFilename(role: string, lang: string, kind: 'card' | 'result' = 'card', date = new Date()): string {
  const d = date.toISOString().slice(0, 10)
  return `career-bingo_${kind}_${role}_${lang}_${d}.png`
}
