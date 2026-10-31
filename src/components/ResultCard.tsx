import { forwardRef } from 'react'
import type { Lang, RoleMeta } from '../types'
import type { Strings } from '../i18n/translations'
import type { Level, SurvivalCopy } from '../data/levels'
import { FREE_INDEX } from '../lib/bingo'

interface Props {
  lang: Lang
  t: Strings
  role: RoleMeta
  level: Level
  copy: SurvivalCopy
  lines: number
  count: number
  cells: boolean[]
}

export const RESULT_WIDTH = 1080
export const RESULT_HEIGHT = 1350

/**
 * Share card authored at its exact export size (1080×1350, 4:5). On screen it's scaled
 * with a CSS transform by the parent, so what you see is exactly what downloads.
 * Sizes are fixed px on purpose; don't use cqw/vw here.
 */
export const ResultCard = forwardRef<HTMLDivElement, Props>(function ResultCard({ lang, t, role, level, copy, lines, count, cells }, ref) {
  return (
    <div
      ref={ref}
      className="relative flex flex-col overflow-hidden text-ink"
      style={{ width: RESULT_WIDTH, height: RESULT_HEIGHT, background: role.tint, padding: 88, borderRadius: 56 }}
    >
      {/* soft corner shapes in the role colour */}
      <span aria-hidden className="absolute rounded-full" style={{ width: 520, height: 520, right: -180, top: -200, background: role.accent, opacity: 0.08 }} />
      <span aria-hidden className="absolute rounded-full" style={{ width: 360, height: 360, left: -140, bottom: -120, background: '#ffffff', opacity: 0.45 }} />

      <div className="relative flex items-center justify-between" style={{ fontSize: 30 }}>
        <span className="font-display font-semibold tracking-wide text-ink-soft">Career Bingo{lang === 'zh-TW' ? ' · 職場生存賓果' : ''}</span>
        <span className="flex items-center rounded-full bg-white/85 font-semibold" style={{ gap: 12, padding: '12px 28px' }}>
          <span aria-hidden>{role.emoji}</span>
          {role.name[lang]}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col justify-center">
        <div className="flex items-center" style={{ gap: 24 }}>
          <span
            className="flex flex-col items-center justify-center rounded-full font-display font-extrabold text-white"
            style={{ width: 168, height: 168, background: role.accent, boxShadow: '0 16px 40px -18px rgba(47,43,40,0.55)' }}
          >
            <span style={{ fontSize: 30, letterSpacing: 4, opacity: 0.85 }}>LV</span>
            <span style={{ fontSize: 84, lineHeight: 0.9 }}>{level}</span>
          </span>
          <span className="font-semibold text-ink-soft" style={{ fontSize: 30 }}>{t.levelOf(level)}</span>
        </div>

        <h2 className="font-display font-extrabold [text-wrap:balance]" style={{ fontSize: lang === 'en' ? 92 : 112, lineHeight: 1.08, marginTop: 56 }}>
          {copy.title[lang]}
        </h2>
        <p className="text-ink-soft [text-wrap:pretty]" style={{ fontSize: 42, lineHeight: 1.5, marginTop: 32, maxWidth: 860 }}>
          {copy.description[lang]}
        </p>
      </div>

      <div className="relative flex items-end justify-between" style={{ gap: 40 }}>
        <div className="flex" style={{ gap: 20 }}>
          <Figure value={`${lines}/12`} label={t.lines} accent={role.accent} />
          <Figure value={`${count}/25`} label={t.marked} accent={role.accent} />
        </div>
        <div className="grid grid-cols-5 rounded-[28px] bg-white/70" style={{ gap: 8, padding: 18, width: 268 }} aria-hidden>
          {cells.map((on, i) => (
            <span
              key={i}
              className="aspect-square"
              style={{ borderRadius: 8, background: i === FREE_INDEX ? '#2F2B28' : on ? role.accent : '#ffffff' }}
            />
          ))}
        </div>
      </div>

      <p className="relative text-ink-soft" style={{ fontSize: 26, marginTop: 44 }}>{t.resultTagline}</p>
    </div>
  )
})

function Figure({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <div className="rounded-[32px] bg-white/85 text-center" style={{ padding: '26px 36px', minWidth: 200 }}>
      <div className="font-display font-extrabold tabular-nums" style={{ fontSize: 64, lineHeight: 1, color: accent }}>{value}</div>
      <div className="font-medium text-ink-soft" style={{ fontSize: 28, marginTop: 12 }}>{label}</div>
    </div>
  )
}
