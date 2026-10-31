import type { Lang } from '../types'
import type { Strings } from '../i18n/translations'

interface Props {
  lang: Lang
  t: Strings
  onLang: (lang: Lang) => void
  onHome?: () => void
  onWall?: () => void
}

export function Header({ lang, t, onLang, onHome, onWall }: Props) {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
      <button
        type="button"
        onClick={onHome}
        disabled={!onHome}
        className="flex items-center gap-2 rounded-full py-1 pr-2 text-left disabled:cursor-default"
        aria-label={onHome ? t.home : t.appName}
      >
        <Logo />
        <span className="whitespace-nowrap font-display text-base font-bold tracking-tight sm:text-lg">{t.appName}</span>
      </button>
      <div className="flex items-center gap-2 sm:gap-3">
      {onWall && (
        <button type="button" onClick={onWall} aria-label={t.communityTitle} className="whitespace-nowrap rounded-full border border-line bg-white/70 px-2.5 py-1.5 text-sm font-medium text-ink-soft hover:text-ink sm:border-transparent sm:bg-transparent">
          <span aria-hidden className="sm:hidden">👀</span>
          <span className="hidden sm:inline">{t.communityTitle}</span>
        </button>
      )}
      <div role="group" aria-label={t.langLabel} className="flex shrink-0 rounded-full border border-line bg-white/70 p-1 text-sm shadow-sm">
        {(['zh-TW', 'en'] as const).map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={lang === l}
            onClick={() => onLang(l)}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              lang === l ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {l === 'zh-TW' ? '中文' : 'EN'}
          </button>
        ))}
      </div>
      </div>
    </header>
  )
}

export function Logo({ size = 28 }: { size?: number }) {
  const c = ['#F6E6DE', '#E6E1F4', '#DCEDE7', '#DFEAF6', '#FFF5DF']
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <rect
          key={i}
          x={1 + (i % 3) * 9}
          y={1 + Math.floor(i / 3) * 9}
          width="8"
          height="8"
          rx="2.5"
          fill={i === 4 ? '#2F2B28' : c[i % c.length]}
          stroke="#E7E3DC"
          strokeWidth="0.6"
        />
      ))}
    </svg>
  )
}
