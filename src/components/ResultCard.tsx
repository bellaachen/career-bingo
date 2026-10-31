import { forwardRef, memo, useLayoutEffect, useRef } from 'react'
import type { Lang, RoleMeta } from '../types'
import type { Strings } from '../i18n/translations'
import type { Level, SurvivalCopy } from '../data/levels'
import { CELL_COUNT, FREE_INDEX, promptIdAt } from '../lib/bingo'
import { getPrompt } from '../data/questions'

interface Props {
  lang: Lang
  t: Strings
  role: RoleMeta
  level: Level
  copy: SurvivalCopy
  lines: number
  count: number
  cells: boolean[]
  board: string[]
}

/** Export width in px. Height follows the content (≈1080×1600). */
export const RESULT_WIDTH = 1080

const PAD = 72
const GAP = 14
const CELL = (RESULT_WIDTH - PAD * 2 - GAP * 4) / 5

/**
 * Share card = level header (title + one-liner) on top of the full 5×5 board with
 * every prompt, so viewers can see exactly what this player survived.
 * Authored at export size in fixed px; the result sheet scales it down on screen.
 */
export const ResultCard = forwardRef<HTMLDivElement, Props>(function ResultCard({ lang, t, role, level, copy, lines, count, cells, board }, ref) {
  return (
    <div
      ref={ref}
      className="relative flex flex-col overflow-hidden text-ink"
      style={{ width: RESULT_WIDTH, background: role.tint, padding: PAD, borderRadius: 56 }}
    >
      <span aria-hidden className="absolute rounded-full" style={{ width: 520, height: 520, right: -200, top: -230, background: role.accent, opacity: 0.08 }} />

      {/* brand + role */}
      <div className="relative flex items-center justify-between" style={{ fontSize: 28 }}>
        <span className="font-display font-semibold tracking-wide text-ink-soft">Career Bingo{lang === 'zh-TW' ? ' · 職場生存賓果' : ''}</span>
        <span className="flex items-center rounded-full bg-white/85 font-semibold" style={{ gap: 10, padding: '10px 26px' }}>
          <span aria-hidden>{role.emoji}</span>
          {role.name[lang]}
        </span>
      </div>

      {/* level + title */}
      <div className="relative flex items-center" style={{ gap: 32, marginTop: 52 }}>
        <span
          className="flex shrink-0 flex-col items-center justify-center rounded-full font-display font-extrabold text-white"
          style={{ width: 150, height: 150, background: role.accent, boxShadow: '0 16px 40px -18px rgba(47,43,40,0.55)' }}
        >
          <span style={{ fontSize: 26, letterSpacing: 4, opacity: 0.85 }}>LV</span>
          <span style={{ fontSize: 76, lineHeight: 0.9 }}>{level}</span>
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-ink-soft" style={{ fontSize: 28 }}>{t.levelOf(level)}</p>
          <h2 className="font-display font-extrabold [text-wrap:balance]" style={{ fontSize: lang === 'en' ? 74 : 86, lineHeight: 1.08, marginTop: 6 }}>
            {copy.title[lang]}
          </h2>
        </div>
      </div>

      {/* the one-liner */}
      <p className="relative font-medium [text-wrap:pretty]" style={{ fontSize: 38, lineHeight: 1.45, marginTop: 32, color: '#4A443F' }}>
        {lang === 'en' ? `“${copy.description.en}”` : `「${copy.description['zh-TW']}」`}
      </p>

      {/* full board with prompts */}
      <div className="relative grid grid-cols-5" style={{ gap: GAP, marginTop: 48 }}>
        {Array.from({ length: CELL_COUNT }, (_, i) => {
          if (i === FREE_INDEX) {
            return (
              <div key="free" className="flex flex-col items-center justify-center rounded-[22px] bg-ink text-center text-white" style={{ height: CELL }}>
                <span style={{ fontSize: 44, lineHeight: 1 }} aria-hidden>☕</span>
                <span className="whitespace-pre-line font-bold" style={{ fontSize: 22, lineHeight: 1.25, marginTop: 8 }}>{t.centerText}</span>
              </div>
            )
          }
          const id = promptIdAt(board, i)
          const text = (id && getPrompt(id)?.text[lang]) ?? ''
          return <Tile key={id ?? i} text={text} marked={cells[i]} accent={role.accent} />
        })}
      </div>

      {/* stats + tagline */}
      <div className="relative flex items-center justify-between" style={{ marginTop: 40, gap: 24 }}>
        <div className="flex" style={{ gap: 16 }}>
          <Figure value={`${lines}/12`} label={t.lines} accent={role.accent} />
          <Figure value={`${count}/25`} label={t.marked} accent={role.accent} />
        </div>
        <p className="text-right text-ink-soft" style={{ fontSize: 24, maxWidth: 420 }}>{t.resultTagline}</p>
      </div>
    </div>
  )
})

/** One board square. Shrinks its own text (24 → 15px) until it fits; words never break mid-way. */
const Tile = memo(function Tile({ text, marked, accent }: { text: string; marked: boolean; accent: string }) {
  const box = useRef<HTMLDivElement>(null)
  const span = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = box.current
    const s = span.current
    if (!el || !s) return
    let size = 24
    s.style.fontSize = `${size}px`
    while (size > 15 && (s.scrollHeight > el.clientHeight - 28 || s.scrollWidth > s.clientWidth + 1)) {
      size -= 1
      s.style.fontSize = `${size}px`
    }
  }, [text])
  return (
    <div
      ref={box}
      className="relative flex items-center justify-center overflow-hidden rounded-[22px] text-center"
      style={{
        height: CELL,
        padding: 14,
        background: marked ? accent : '#ffffff',
        color: marked ? '#ffffff' : '#2F2B28',
        boxShadow: marked ? 'inset 0 -5px 0 rgba(0,0,0,0.12)' : '0 2px 8px -4px rgba(47,43,40,0.25)',
      }}
    >
      {marked && <span aria-hidden className="absolute" style={{ right: 12, top: 8, fontSize: 18, opacity: 0.8 }}>✓</span>}
      <span ref={span} className="block w-full font-medium" style={{ lineHeight: 1.25, overflowWrap: 'normal' }}>{text}</span>
    </div>
  )
})

function Figure({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div className="flex items-baseline rounded-full bg-white/85" style={{ gap: 12, padding: '14px 28px' }}>
      <span className="font-display font-extrabold tabular-nums" style={{ fontSize: 40, lineHeight: 1, color: accent }}>{value}</span>
      <span className="font-medium text-ink-soft" style={{ fontSize: 24 }}>{label}</span>
    </div>
  )
}
