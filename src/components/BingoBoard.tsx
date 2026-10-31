import { forwardRef } from 'react'
import type { Lang, RoleMeta } from '../types'
import type { Strings } from '../i18n/translations'
import { CELL_COUNT, FREE_INDEX, LINES, promptIdAt } from '../lib/bingo'
import { getPrompt } from '../data/questions'
import { BingoTile } from './BingoTile'
import { LineOverlay } from './LineOverlay'

interface Props {
  lang: Lang
  t: Strings
  role: RoleMeta
  board: string[]
  cells: boolean[]
  lines: number[]
  count: number
  celebrateLines: number[]
  onToggle: (id: string) => void
}

/**
 * The exported area. Everything needed for a share image (title, role,
 * line count, language) lives inside this node.
 */
export const BingoBoard = forwardRef<HTMLDivElement, Props>(function BingoBoard(
  { lang, t, role, board, cells, lines, count, celebrateLines, onToggle },
  ref,
) {
  const glowing = new Set(celebrateLines.flatMap((l) => LINES[l]))
  return (
    <div
      ref={ref}
      className="rounded-[clamp(14px,4vw,28px)] border border-white/80 p-[clamp(10px,3vw,24px)] shadow-[0_10px_40px_-18px_rgba(47,43,40,0.35)]"
      style={{ background: role.tint }}
    >
      <div className="mb-[clamp(8px,2.5vw,18px)] flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[clamp(11px,2.8vw,14px)] font-bold tracking-wide text-ink-soft">
            Career Bingo{lang === 'zh-TW' ? ' · 職場生存賓果' : ''}
          </p>
          <h2 className="font-display text-[clamp(17px,4.6vw,28px)] font-extrabold leading-tight [text-wrap:balance]">
            <span aria-hidden className="mr-1.5">{role.emoji}</span>
            {role.name[lang]}
          </h2>
        </div>
        <div className="flex shrink-0 gap-2 text-center">
          <Stat label={t.lines} value={`${lines.length}`} accent={role.accent} />
          <Stat label={t.marked} value={`${count}/25`} accent={role.accent} />
        </div>
      </div>

      <div
        role="group"
        aria-label={t.boardLabel(role.name[lang])}
        className="relative grid grid-cols-5 gap-[clamp(4px,1.3vw,10px)]"
      >
        {Array.from({ length: CELL_COUNT }, (_, i) => {
          if (i === FREE_INDEX) {
            return <BingoTile key="free" index={i} text={t.free} freeHint={t.freeHint} free marked celebrate={glowing.has(i)} stateLabel="" />
          }
          const id = promptIdAt(board, i)!
          const prompt = getPrompt(id)
          return (
            <BingoTile
              key={id}
              index={i}
              text={prompt?.text[lang] ?? '—'}
              marked={cells[i]}
              celebrate={glowing.has(i)}
              stateLabel={cells[i] ? t.tileMarked : t.tileUnmarked}
              onToggle={() => onToggle(id)}
            />
          )
        })}
        <LineOverlay lines={lines} fresh={celebrateLines} />
      </div>

      <p className="mt-[clamp(8px,2.5vw,16px)] flex items-start justify-between gap-3 text-[clamp(9px,2.3vw,12px)] text-ink-soft">
        <span className="shrink-0">{lang === 'zh-TW' ? '中文版' : 'English'}</span>
        <span className="text-right">{t.footerNote}</span>
      </p>
    </div>
  )
})

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="min-w-[clamp(52px,14vw,76px)] rounded-xl bg-white/80 px-2 py-1.5">
      <div className="font-display text-[clamp(16px,4.4vw,24px)] font-extrabold leading-none tabular-nums" style={{ color: accent }}>
        {value}
      </div>
      <div className="mt-1 text-[clamp(9px,2.3vw,11px)] font-medium text-ink-soft">{label}</div>
    </div>
  )
}
