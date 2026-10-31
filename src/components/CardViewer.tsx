import { useEffect, useRef } from 'react'
import type { Lang } from '../types'
import type { Strings } from '../i18n/translations'
import type { ShareCard } from '../lib/share'
import { getRole } from '../data/roles'
import { completedLines, markedCount } from '../lib/bingo'
import { getSurvivalCopy, getSurvivalLevel } from '../data/levels'
import { BingoBoard } from './BingoBoard'

interface Props {
  lang: Lang
  t: Strings
  cards: ShareCard[]
  /** Index of the open card, or null when closed */
  index: number | null
  onIndex: (i: number | null) => void
}

/**
 * Read-only view of someone else's shared card, with previous/next.
 * Native <dialog>: focus trap, Esc and backdrop come for free.
 */
export function CardViewer({ lang, t, cards, index, onIndex }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const card = index === null ? null : cards[index]
  const open = card != null

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal?.()
    if (!open && d.open) d.close()
  }, [open])

  // ← / → browse while open
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (index === null) return
      if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1)
      if (e.key === 'ArrowRight' && index < cards.length - 1) onIndex(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, cards.length, onIndex])

  const role = card ? getRole(card.role) : null
  const lines = card ? completedLines(card.cells) : []
  const level = getSurvivalLevel(lines.length)
  const copy = card ? getSurvivalCopy(card.role, level) : null
  const nav = 'rounded-full border border-line bg-white px-4 py-2 text-sm font-medium disabled:opacity-35'

  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); onIndex(null) }}
      onClick={(e) => { if (e.target === e.currentTarget) onIndex(null) }}
      aria-label={card ? t.viewCard(card.nickname ?? t.anonymous) : undefined}
      className="m-auto max-h-[96dvh] w-[min(94vw,520px)] overflow-y-auto rounded-3xl border border-line bg-paper p-0 text-ink shadow-2xl"
    >
      {card && role && copy && (
        <div className="p-3 sm:p-5" style={{ '--accent': role.accent, '--tint': role.tint } as React.CSSProperties}>
          <div className="mb-3 flex items-start justify-between gap-3 px-1">
            <div className="min-w-0">
              <p className="text-base font-bold leading-snug [overflow-wrap:anywhere]">{card.nickname ?? t.anonymous}</p>
              <p className="mt-0.5 text-xs text-ink-soft">{copy.description[lang]}</p>
            </div>
            <button type="button" autoFocus onClick={() => onIndex(null)} aria-label={t.close} className="shrink-0 rounded-full px-2.5 py-1 text-lg leading-none text-ink-soft hover:bg-white hover:text-ink">
              ✕
            </button>
          </div>

          {/* container for the board's cqw-based sizing */}
          <div className="[container-type:inline-size]">
            <BingoBoard
              lang={lang}
              t={t}
              role={role}
              board={card.board}
              cells={card.cells}
              lines={lines}
              count={markedCount(card.cells)}
              celebrateLines={[]}
              readOnly
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 px-1">
            <button type="button" className={nav} disabled={index === 0} onClick={() => index !== null && onIndex(index - 1)}>
              ← {t.prevCard}
            </button>
            <span className="text-xs tabular-nums text-ink-soft">{(index ?? 0) + 1} / {cards.length}</span>
            <button type="button" className={nav} disabled={index === cards.length - 1} onClick={() => index !== null && onIndex(index + 1)}>
              {t.nextCard} →
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
