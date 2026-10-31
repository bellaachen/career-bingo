import { useCallback, useEffect, useState } from 'react'
import type { Lang, RoleId } from '../types'
import type { Strings } from '../i18n/translations'
import { ROLES, getRole } from '../data/roles'
import { getPrompt } from '../data/questions'
import { FREE_INDEX } from '../lib/bingo'
import { ROLE_MIN_SHARES, topPrompts, type RoleStats, type ShareCard, type WallScope } from '../lib/share'
import { getStats, getWall } from '../lib/api'

interface Props {
  lang: Lang
  t: Strings
  initialScope: WallScope
  /** A role to play, or 'everyone' to open the role picker */
  onPlay: (scope: WallScope) => void
  onBack?: () => void
}

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ok'; stats: RoleStats; cards: ShareCard[] }

/** Neutral look for the "All" tab, matching the off-white page. */
const EVERYONE = { tint: '#EEECE6', accent: '#2F2B28' }

export function Community({ lang, t, initialScope, onPlay, onBack }: Props) {
  const [scope, setScope] = useState<WallScope>(initialScope)
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const look = scope === 'everyone' ? EVERYONE : getRole(scope)

  const fetchScope = useCallback((s: WallScope) => {
    setLoad({ state: 'loading' })
    let alive = true
    Promise.all([getStats(s), getWall(s)])
      .then(([stats, wall]) => alive && setLoad({ state: 'ok', stats, cards: wall.cards }))
      .catch(() => alive && setLoad({ state: 'error' }))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => fetchScope(scope), [scope, fetchScope])

  const total = load.state === 'ok' ? load.stats.totalShares : null
  const tabs: { id: WallScope; label: string; emoji?: string; accent: string }[] = [
    { id: 'everyone', label: t.wallAll, accent: EVERYONE.accent },
    ...ROLES.map((r) => ({ id: r.id as WallScope, label: r.name[lang], emoji: r.emoji, accent: r.accent })),
  ]

  return (
    <section
      className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10"
      style={{ '--accent': look.accent, '--tint': look.tint } as React.CSSProperties}
      aria-labelledby="community-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="community-title" className="font-display text-2xl font-extrabold sm:text-3xl">{t.communityTitle}</h1>
          <p className="mt-1 min-h-[1.5rem] text-sm text-ink-soft">{total !== null ? t.communitySub(total) : ' '}</p>
        </div>
        {onBack && (
          <button type="button" onClick={onBack} className="text-sm font-medium text-ink-soft underline underline-offset-4 hover:text-ink">
            ← {t.backToGame}
          </button>
        )}
      </div>

      {/* Scope tabs: scroll inside the strip on small screens, never the page */}
      <div role="tablist" aria-label={t.pickRole} className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {tabs.map((tab) => {
          const active = tab.id === scope
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setScope(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active ? 'border-transparent text-white' : 'border-line bg-white/70 text-ink-soft hover:text-ink'
              }`}
              style={active ? { background: tab.accent } : undefined}
            >
              {tab.emoji && <span aria-hidden>{tab.emoji}</span>}
              {tab.label}
            </button>
          )
        })}
      </div>

      {load.state === 'loading' && <p className="mt-10 text-center text-ink-soft" aria-live="polite">…</p>}

      {load.state === 'error' && (
        <div className="mt-10 text-center" role="alert">
          <p className="text-ink-soft">{t.loadFailed}</p>
          <button type="button" onClick={() => fetchScope(scope)} className="mt-3 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium">
            {t.retry}
          </button>
        </div>
      )}

      {load.state === 'ok' && (
        <>
          <StatsPanel lang={lang} t={t} scope={scope} stats={load.stats} look={look} onPlay={() => onPlay(scope)} />

          <h2 className="mt-10 font-display text-lg font-bold">{t.latestTitle}</h2>
          {load.cards.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-line bg-white/60 p-6 text-center text-ink-soft">{t.emptyWall}</p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {load.cards.map((c) => (
                <MiniCard key={c.id} card={c} lang={lang} t={t} showRole={scope === 'everyone'} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

function StatsPanel({ lang, t, scope, stats, look, onPlay }: {
  lang: Lang; t: Strings; scope: WallScope; stats: RoleStats; look: { tint: string; accent: string }; onPlay: () => void
}) {
  const top = topPrompts(stats, 5)
  const ready = stats.shares >= ROLE_MIN_SHARES
  const everyone = scope === 'everyone'
  return (
    <div className="mt-6 rounded-3xl border border-white/80 p-5 shadow-[0_10px_40px_-22px_rgba(47,43,40,0.35)] sm:p-7" style={{ background: look.tint }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3">
          <Figure label={t.sharesCount} value={`${stats.shares}`} accent={look.accent} />
          <Figure label={t.avgLines} value={stats.shares ? `${stats.avgLines}` : '–'} accent={look.accent} />
        </div>
        <button type="button" onClick={onPlay} className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm" style={{ background: look.accent }}>
          {everyone ? t.start : t.playThisRole} →
        </button>
      </div>

      {ready && top.length > 0 ? (
        <>
          <h2 className="mt-6 text-sm font-bold text-ink-soft">{t.topTitle}</h2>
          <ol className="mt-3 space-y-2.5">
            {top.map((p, i) => {
              const prompt = getPrompt(p.id)
              const promptRole = prompt ? getRole(prompt.role) : null
              const accent = everyone && promptRole ? promptRole.accent : look.accent
              return (
                <li key={p.id} className="rounded-xl bg-white/85 px-3.5 py-2.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="mr-2 font-display font-bold" style={{ color: accent }}>{i + 1}</span>
                      {everyone && promptRole && <span className="mr-1.5" title={promptRole.name[lang]} aria-label={promptRole.name[lang]}>{promptRole.emoji}</span>}
                      {prompt?.text[lang]}
                    </span>
                    <span className="shrink-0 font-display font-extrabold tabular-nums" style={{ color: accent }}>{p.rate}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/5" aria-hidden>
                    <div className="h-full rounded-full" style={{ width: `${p.rate}%`, background: accent }} />
                  </div>
                </li>
              )
            })}
          </ol>
        </>
      ) : (
        <p className="mt-5 rounded-xl bg-white/70 px-4 py-3 text-sm text-ink-soft">
          {everyone ? t.collectingAll(stats.shares) : t.collecting(getRole(scope as RoleId).name[lang], stats.shares)}
        </p>
      )}
    </div>
  )
}

function Figure({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="min-w-20 rounded-2xl bg-white/85 px-4 py-2.5 text-center">
      <div className="font-display text-2xl font-extrabold leading-none tabular-nums" style={{ color: accent }}>{value}</div>
      <div className="mt-1.5 text-xs font-medium text-ink-soft">{label}</div>
    </div>
  )
}

function MiniCard({ card, lang, t, showRole }: { card: ShareCard; lang: Lang; t: Strings; showRole: boolean }) {
  const role = getRole(card.role)
  return (
    <li className="rounded-2xl border border-white/80 p-3 shadow-[0_4px_14px_-10px_rgba(47,43,40,0.4)]" style={{ background: role.tint }}>
      <div className="grid grid-cols-5 gap-[3px]" aria-hidden>
        {card.cells.map((on, i) => (
          <span
            key={i}
            className="aspect-square rounded-[3px]"
            style={{ background: i === FREE_INDEX ? '#2F2B28' : on ? role.accent : 'rgba(255,255,255,0.9)' }}
          />
        ))}
      </div>
      {showRole && (
        <p className="mt-2.5 text-[11px] font-semibold" style={{ color: role.accent }}>
          <span aria-hidden className="mr-1">{role.emoji}</span>{role.name[lang]}
        </p>
      )}
      <p className={`${showRole ? 'mt-0.5' : 'mt-2.5'} text-sm font-semibold leading-snug [overflow-wrap:anywhere]`}>{card.nickname ?? t.anonymous}</p>
      <p className="mt-1 text-[11px] text-ink-soft">
        <span className="font-bold tabular-nums" style={{ color: role.accent }}>{t.linesShort(card.lines)}</span>
        {' · '}
        <time dateTime={new Date(card.createdAt).toISOString()}>{relativeTime(card.createdAt, lang)}</time>
      </p>
    </li>
  )
}

function relativeTime(ts: number, lang: Lang): string {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  const sec = Math.round((ts - Date.now()) / 1000)
  const abs = Math.abs(sec)
  if (abs < 60) return rtf.format(0, 'second')
  if (abs < 3600) return rtf.format(Math.round(sec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), 'hour')
  return rtf.format(Math.round(sec / 86400), 'day')
}
