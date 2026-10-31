import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Lang, RoleMeta } from '../types'
import type { Strings } from '../i18n/translations'
import type { Level, SurvivalCopy } from '../data/levels'
import { RESULT_HEIGHT, RESULT_WIDTH, ResultCard } from './ResultCard'

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
  onClose: () => void
  onPlayAgain: () => void
  /** Export handlers live in App: the board node is owned there. */
  onDownloadResult: (node: HTMLElement) => Promise<void>
  onDownloadBoard: () => Promise<void>
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
  const [result, setResult] = useState<ExportState>('idle')
  const [board, setBoard] = useState<ExportState>('idle')

  // Scale the fixed-size card to the frame width.
  useLayoutEffect(() => {
    if (!open) return
    const el = frameRef.current
    if (!el) return
    const fit = () => setScale(el.clientWidth / RESULT_WIDTH)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [open])

  // Esc closes; focus moves into the sheet; page behind doesn't scroll.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
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
      <div className="mx-auto flex w-full max-w-[560px] flex-col px-4 pb-8 pt-4 sm:pt-6">
        <div className="flex items-center justify-between">
          <h1 id="result-heading" className="font-display text-xl font-extrabold sm:text-2xl">{t.resultHeading}</h1>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft hover:text-ink">
            ← {t.backToBingo}
          </button>
        </div>

        {/* Card frame: width capped by viewport height so buttons stay visible on desktop */}
        <div
          ref={frameRef}
          className="mx-auto mt-4 w-full"
          style={{ maxWidth: `min(100%, max(320px, calc((100dvh - 250px) * ${RESULT_WIDTH / RESULT_HEIGHT})))`, height: RESULT_HEIGHT * scale }}
        >
          <div style={{ width: RESULT_WIDTH, height: RESULT_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <ResultCard ref={cardRef} {...p} />
          </div>
        </div>

        <div className="mx-auto mt-5 grid w-full grid-cols-2 gap-2.5" style={{ maxWidth: `min(100%, max(320px, calc((100dvh - 250px) * ${RESULT_WIDTH / RESULT_HEIGHT})))` }}>
          <button
            type="button"
            onClick={() => cardRef.current && run(setResult, () => p.onDownloadResult(cardRef.current!))}
            disabled={result === 'busy'}
            aria-busy={result === 'busy'}
            className="rounded-full px-4 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_-8px_rgba(47,43,40,0.5)] disabled:opacity-70 sm:text-base"
            style={{ background: p.role.accent }}
          >
            ↓ {label(result, t.downloadResult)}
          </button>
          <button
            type="button"
            onClick={() => run(setBoard, p.onDownloadBoard)}
            disabled={board === 'busy'}
            aria-busy={board === 'busy'}
            className="rounded-full border-2 bg-white px-4 py-3 text-sm font-semibold disabled:opacity-70 sm:text-base"
            style={{ borderColor: p.role.accent, color: p.role.accent }}
          >
            ↓ {label(board, t.downloadBoard)}
          </button>
          <button type="button" onClick={onClose} className="rounded-full border border-line bg-white/80 px-4 py-2.5 text-sm font-medium">
            {t.backToBingo}
          </button>
          <button type="button" onClick={p.onPlayAgain} className="rounded-full border border-line bg-white/80 px-4 py-2.5 text-sm font-medium">
            ↻ {t.playAgain}
          </button>
        </div>
        {(result === 'error' || board === 'error') && (
          <p role="alert" className="mt-3 text-center text-sm text-[#B4473A]">{t.exportFailed}</p>
        )}
      </div>
    </div>
  )
}
