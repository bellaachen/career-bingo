import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Lang, RoleMeta } from '../types'
import type { Strings } from '../i18n/translations'
import type { Level, SurvivalCopy } from '../data/levels'
import { RESULT_WIDTH, ResultCard } from './ResultCard'

type ExportState = 'idle' | 'busy' | 'done' | 'error'

interface Props {
  open: boolean
  lang: Lang
  t: Strings
  role: RoleMeta
  level: Level
  copy: SurvivalCopy
  lines: number
  count: number
  cells: boolean[]
  board: string[]
  onClose: () => void
  onPlayAgain: () => void
  /** Export handlers live in App: the board node is owned there. */
  onDownloadResult: (node: HTMLElement) => Promise<void>
  /** Sharing is hidden when the API isn't configured. */
  share?: { shared: boolean; onShare: () => void; onOpenWall: () => void }
}

/**
 * Full-screen result sheet. It overlays the game (instead of replacing it) so the
 * bingo board stays mounted and can still be exported from here.
 */
export function ResultView(p: Props) {
  const { open, t, onClose } = p
  const panelRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.35)
  const [cardHeight, setCardHeight] = useState(1600)
  const [result, setResult] = useState<ExportState>('idle')

  // Scale the fixed-width card to the frame; its height follows its content.
  useLayoutEffect(() => {
    if (!open) return
    const frame = frameRef.current
    const card = cardRef.current
    if (!frame || !card) return
    const fit = () => {
      setScale(frame.clientWidth / RESULT_WIDTH)
      setCardHeight(card.offsetHeight)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(frame)
    ro.observe(card)
    return () => ro.disconnect()
  }, [open])

  // Esc closes; focus moves into the sheet; page behind doesn't scroll.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !document.querySelector('dialog[open]') && onClose()
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const run = async (set: (s: ExportState) => void, fn: () => Promise<void>) => {
    set('busy')
    try {
      await fn()
      set('done')
      window.setTimeout(() => set('idle'), 2000)
    } catch (err) {
      console.error(err)
      set('error')
    }
  }

  const label = (s: ExportState, base: string) => (s === 'busy' ? t.exporting : s === 'done' ? t.exported : base)

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-heading"
      className="fixed inset-0 z-40 overflow-y-auto bg-paper/95 backdrop-blur-sm outline-none"
    >
      <div className="mx-auto flex w-full max-w-[560px] flex-col px-4 pb-6 pt-4 sm:pt-6">
        <div className="flex items-center justify-between">
          <h1 id="result-heading" className="font-display text-xl font-extrabold sm:text-2xl">{t.resultHeading}</h1>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft hover:text-ink">
            ← {t.backToBingo}
          </button>
        </div>

        <div ref={frameRef} className="mx-auto mt-4 w-full max-w-[520px]" style={{ height: cardHeight * scale }}>
          <div style={{ width: RESULT_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <ResultCard ref={cardRef} {...p} />
          </div>
        </div>
      </div>

      {/* Actions stay on screen while the (tall) card scrolls */}
      <div className="sticky bottom-0 border-t border-line/70 bg-paper/90 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className={`mx-auto grid w-full max-w-[520px] gap-2.5 ${p.share ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button
            type="button"
            onClick={() => cardRef.current && run(setResult, () => p.onDownloadResult(cardRef.current!))}
            disabled={result === 'busy'}
            aria-busy={result === 'busy'}
            className="whitespace-nowrap rounded-full px-3 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_-8px_rgba(47,43,40,0.5)] disabled:opacity-70 sm:text-base"
            style={{ background: p.role.accent }}
          >
            ↓ {label(result, t.downloadResult)}
          </button>
          {p.share && (
            <button
              type="button"
              onClick={p.share.shared ? p.share.onOpenWall : p.share.onShare}
              className="whitespace-nowrap rounded-full border-2 bg-white px-3 py-3 text-sm font-semibold sm:text-base"
              style={{ borderColor: p.role.accent, color: p.role.accent }}
            >
              {p.share.shared ? `✓ ${t.sharedShort}` : `↗ ${t.shareCta}`}
            </button>
          )}
        </div>
        <div className="mx-auto mt-2 flex w-full max-w-[520px] justify-center gap-6 text-sm font-medium text-ink-soft">
          <button type="button" onClick={onClose} className="py-1 hover:text-ink">← {t.backToBingo}</button>
          <button type="button" onClick={p.onPlayAgain} className="py-1 hover:text-ink">↻ {t.playAgain}</button>
        </div>
        {result === 'error' && (
          <p role="alert" className="mt-3 text-center text-sm text-[#B4473A]">{t.exportFailed}</p>
        )}
      </div>
    </div>
  )
}
