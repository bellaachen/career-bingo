import { toPng } from 'html-to-image'

/**
 * Render a DOM node to a high-resolution PNG and trigger a download.
 * Everything is local (no external hosts), so it works offline once loaded.
 */
export async function exportNodeAsPng(node: HTMLElement, filename: string, opts: { pixelRatio?: number } = {}): Promise<void> {
  // Make sure web fonts are ready so Chinese glyphs don't render as fallbacks.
  if (document.fonts?.ready) await document.fonts.ready
  const options = {
    // Board: 3x for crisp text. Result card is authored at its final 1080×1350 size, so 1x.
    pixelRatio: opts.pixelRatio ?? Math.max(3, window.devicePixelRatio || 1),
    cacheBust: true,
  }
  // First pass warms the image/font cache in some browsers (notably Safari).
  await toPng(node, options).catch(() => undefined)
  const dataUrl = await toPng(node, options)
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export function exportFilename(role: string, lang: string, kind: 'card' | 'result' = 'card', date = new Date()): string {
  const d = date.toISOString().slice(0, 10)
  return `career-bingo_${kind}_${role}_${lang}_${d}.png`
}
