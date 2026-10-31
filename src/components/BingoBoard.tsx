import { forwardRef } from 'react'
import type { Lang, RoleMeta } from '../types'
import type { Strings } from '../i18n/translations'
import { CELL_COUNT, FREE_INDEX, LINES, promptIdAt } from '../lib/bingo'
import { getPrompt } from '../data/questions'
import { BingoTile } from './BingoTile'
import { hitRate, type RoleStats } from '../lib/share'
import { getSurvivalCopy, getSurvivalLevel } from '../data/levels'

interface Props {
  lang: Lang
  t: Strings
  role: RoleMeta
  board: string[]
  cells: boolean[]
  lines: number[]
  count: number
  celebrateLines: number[]
  /** Role stats after sharing; drives % badges on tiles */
  stats?: RoleStats | null
  /** One-line note under the grid (stats legend or cold-start message) */
  note?: string | null
  onToggle?: (id: string) => void
  readOnly?: boolean
  /** Opens the result sheet (level chip). Omitted in contexts without one. */
  onOpenResult?: () => void
}

/**
 * The exported area. Everything needed for a share image (title, role,
 * line count, language) lives inside this node.
 */
export const BingoBoard = forwardRef<HTMLDivElement, Props>(function BingoBoard(
  { lang, t, role, board, cells, lines, count, celebrateLines, stats, note, onToggle, onOpenResult, readOnly },
  ref,
) {
  const glowing = new Set(celebrateLines.flatMap((l) => LINES[l]))
  const level = getSurvivalLevel(lines.length)
  const levelTitle = getSurvivalCopy(role.id, level).title[lang]
  return (
    <div
      ref={ref}
      className="rounded-[clamp(16px,4.5cqw,28px)] border border-white/80 px-[5cqw] pb-[4cqw] pt-[5cqw] shadow-[0_10px_40px_-18px_rgba(47,43,40,0.35)]"
      style={{ background: role.tint }}
    >
      <div className="mb-[4.5cqw] flex items-center justify-between gap-[3cqw]">
        <div className="min-w-0">
          <p className="font-display text-[clamp(10px,2.2cqw,13px)] font-semibold tracking-wide text-ink-soft">
            Career Bingo{lang === 'zh-TW' ? ' · 職場生存賓果' : ''}
          </p>
          <h2 className="mt-[0.8cqw] font-display text-[clamp(16px,4.4cqw,25px)] font-extrabold leading-tight [text-wrap:balance]">
            <span aria-hidden className="mr-[1.2cqw]">{role.emoji}</span>
            {role.name[lang]}
          </h2>
          <button
            type="button"
            onClick={onOpenResult}
            disabled={!onOpenResult}
            className="mt-[1.4cqw] inline-flex max-w-full items-center gap-[1cqw] rounded-full px-[2.2cqw] py-[0.7cqw] text-[clamp(10px,2.2cqw,13px)] font-bold text-white transition-transform enabled:hover:-translate-y-px disabled:cursor-default"
            style={{ background: role.accent }}
          >
            <span aria-hidden>🏆</span>
            <span className="truncate">{t.levelChip(level, levelTitle)}</span>
          </button>
        </div>
        <div className="flex shrink-0 gap-[1.6cqw] text-center">
          <Stat label={t.lines} value={`${lines.length}/12`} accent={role.accent} />
          <Stat label={t.marked} value={`${count}/25`} accent={role.accent} />
        </div>
      </div>

      <div
        role="group"
        aria-label={t.boardLabel(role.name[lang])}
        className="grid grid-cols-5 gap-[clamp(4px,1.5cqw,9px)]"
      >
        {Array.from({ length: CELL_COUNT }, (_, i) => {
          if (i === FREE_INDEX) {
            return <BingoTile key="free" index={i} text={t.centerText} centerNote={t.centerNote} free marked celebrate={glowing.has(i)} stateLabel="" />
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
              rate={hitRate(stats ?? null, id)}
              onToggle={() => onToggle?.(id)}
              readOnly={readOnly}
            />
          )
        })}
      </div>

      <p className="mt-[3.5cqw] flex items-start justify-between gap-[3cqw] text-[clamp(9px,1.9cqw,11.5px)] text-ink-soft">
        <span className="shrink-0">{lang === 'zh-TW' ? '中文版' : 'English'}</span>
        <span className="text-right">{note ?? t.footerNote}</span>
      </p>
    </div>
  )
})

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="min-w-[clamp(44px,11.5cqw,66px)] rounded-[clamp(8px,2cqw,12px)] bg-white/80 px-[1.6cqw] py-[1.4cqw]">
      <div className="font-display text-[clamp(14px,3.8cqw,21px)] font-extrabold leading-none tabular-nums" style={{ color: accent }}>
        {value}
      </div>
      <div className="mt-[0.8cqw] text-[clamp(8.5px,1.9cqw,11px)] font-medium text-ink-soft">{label}</div>
    </div>
  )
}
