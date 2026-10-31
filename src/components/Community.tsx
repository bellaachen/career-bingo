import { useCallback, useEffect, useState } from 'react'
import type { Lang, RoleId } from '../types'
import type { Strings } from '../i18n/translations'
import { ROLES, getRole } from '../data/roles'
import { getPrompt } from '../data/questions'
import { FREE_INDEX } from '../lib/bingo'
import { ROLE_MIN_SHARES, topPrompts, type RoleStats, type ShareCard } from '../lib/share'
import { getStats, getWall, postReport } from '../lib/api'
import { addReported, getClientId, getReported } from '../lib/shareStore'

interface Props {
  lang: Lang
  t: Strings
  initialRole: RoleId
  onPlay: (role: RoleId) => void
  onBack?: () => void
}

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ok'; stats: RoleStats; cards: ShareCard[] }

export function Community({ lang, t, initialRole, onPlay, onBack }: Props) {
  const [roleId, setRoleId] = useState<RoleId>(initialRole)
  const [load, setLoad] = useState<Load>({ state: 'loading' })
  const [reported, setReported] = useState<Set<string>>(() => getReported())
  const role = getRole(roleId)

  const fetchRole = useCallback((r: RoleId) => {
    setLoad({ state: 'loading' })
    let alive = true
    Promise.all([getStats(r), getWall(r)])
      .then(([stats, wall]) => alive && setLoad({ state: 'ok', stats, cards: wall.cards }))
      .catch(() => alive && setLoad({ state: 'error' }))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => fetchRole(roleId), [roleId, fetchRole])

  const report = async (id: string) => {
    addReported(id)
    setReported(getReported())
    try {
      const res = await postReport(id, getClientId())
      if (res.hidden && load.state === 'ok') {
        setLoad({ ...load, cards: load.cards.map((c) => (c.id === id ? { ...c, nickname: null } : c)) })
      }
    } catch {
      /* best effort; the local "reported" state still stops repeat clicks */
    }
  }

  const accent = { '--accent': role.accent, '--tint': role.tint } as React.CSSProperties
  const total = load.state === 'ok' ? load.stats.totalShares : null

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10" style={accent} aria-labelledby="community-title">
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

      {/* Role tabs: scroll inside the strip on small screens, never the page */}
      <div role="tablist" aria-label={t.pickRole} className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {ROLES.map((r) => {
          const active = r.id === roleId
          return (
            <button
              key={r.id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setRoleId(r.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active ? 'border-transparent text-white' : 'border-line bg-white/70 text-ink-soft hover:text-ink'
              }`}
              style={active ? { background: r.accent } : undefined}
            >
              <span aria-hidden>{r.emoji}</span>
              {r.name[lang]}
            </button>
          )
        })}
      </div>

      {load.state === 'loading' && <p className="mt-10 text-center text-ink-soft" aria-live="polite">…</p>}

      {load.state === 'error' && (
        <div className="mt-10 text-center" role="alert">
          <p className="text-ink-soft">{t.loadFailed}</p>
          <button type="button" onClick={() => fetchRole(roleId)} className="mt-3 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium">
            {t.retry}
          </button>
        </div>
      )}

      {load.state === 'ok' && (
        <>
          <StatsPanel lang={lang} t={t} stats={load.stats} roleName={role.name[lang]} accent={role.accent} tint={role.tint} onPlay={() => onPlay(roleId)} />

          <h2 className="mt-10 font-display text-lg font-bold">{t.latestTitle}</h2>
          {load.cards.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-line bg-white/60 p-6 text-center text-ink-soft">{t.emptyWall}</p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {load.cards.map((c) => (
                <MiniCard key={c.id} card={c} lang={lang} t={t} tint={role.tint} accent={role.accent} reported={reported.has(c.id)} onReport={() => report(c.id)} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

function StatsPanel({ lang, t, stats, roleName, accent, tint, onPlay }: {
  lang: Lang; t: Strings; stats: RoleStats; roleName: string; accent: string; tint: string; onPlay: () => void
}) {
  const top = topPrompts(stats, 5)
  const ready = stats.shares >= ROLE_MIN_SHARES
  return (
    <div className="mt-6 rounded-3xl border border-white/80 p-5 shadow-[0_10px_40px_-22px_rgba(47,43,40,0.35)] sm:p-7" style={{ background: tint }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3">
          <Figure label={t.sharesCount} value={`${stats.shares}`} accent={accent} />
          <Figure label={t.avgLines} value={stats.shares ? `${stats.avgLines}` : '–'} accent={accent} />
        </div>
        <button type="button" onClick={onPlay} className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm" style={{ background: accent }}>
          {t.playThisRole} →
        </button>
      </div>

      {ready && top.length > 0 ? (
        <>
          <h2 className="mt-6 text-sm font-bold text-ink-soft">{t.topTitle}</h2>
          <ol className="mt-3 space-y-2.5">
            {top.map((p, i) => (
              <li key={p.id} className="rounded-xl bg-white/85 px-3.5 py-2.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0"><span className="mr-2 font-display font-bold" style={{ color: accent }}>{i + 1}</span>{getPrompt(p.id)?.text[lang]}</span>
                  <span className="shrink-0 font-display font-extrabold tabular-nums" style={{ color: accent }}>{p.rate}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--tint)]" aria-hidden>
                  <div className="h-full rounded-full" style={{ width: `${p.rate}%`, background: accent }} />
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="mt-5 rounded-xl bg-white/70 px-4 py-3 text-sm text-ink-soft">{t.collecting(roleName, stats.shares)}</p>
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

function MiniCard({ card, lang, t, tint, accent, reported, onReport }: {
  card: ShareCard; lang: Lang; t: Strings; tint: string; accent: string; reported: boolean; onReport: () => void
}) {
  return (
    <li className="rounded-2xl border border-white/80 p-3 shadow-[0_4px_14px_-10px_rgba(47,43,40,0.4)]" style={{ background: tint }}>
      <div className="grid grid-cols-5 gap-[3px]" aria-hidden>
        {card.cells.map((on, i) => (
          <span
            key={i}
            className="aspect-square rounded-[3px]"
            style={{ background: i === FREE_INDEX ? '#2F2B28' : on ? accent : 'rgba(255,255,255,0.9)' }}
          />
        ))}
      </div>
      <p className="mt-2.5 text-sm font-semibold leading-snug [overflow-wrap:anywhere]">{card.nickname ?? t.anonymous}</p>
      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-ink-soft">
        <span>
          <span className="font-bold tabular-nums" style={{ color: accent }}>{t.linesShort(card.lines)}</span>
          {' · '}
          <time dateTime={new Date(card.createdAt).toISOString()}>{relativeTime(card.createdAt, lang)}</time>
        </span>
        {card.nickname && (
          <button type="button" onClick={onReport} disabled={reported} className="underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60">
            {reported ? t.reported : t.report}
          </button>
        )}
      </div>
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
