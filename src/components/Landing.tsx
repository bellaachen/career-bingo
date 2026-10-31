import type { Lang } from '../types'
import type { Strings } from '../i18n/translations'
import { QUESTIONS } from '../data/questions'

interface Props {
  lang: Lang
  t: Strings
  onStart: () => void
}

// A few decorative floating tiles pulled from the real bank
const SHOWCASE = ['pm-002', 'rd-001', 'qa-004', 'ui-001', 'all-002', 'ux-028']
const TINTS = ['#F6E6DE', '#DFEAF6', '#DCEDE7', '#E6E1F4', '#FFF5DF', '#F9E3E8']
const ROT = [-4, 3, -2, 5, -3, 2]

export function Landing({ lang, t, onStart }: Props) {
  const samples = SHOWCASE.map((id) => QUESTIONS.find((q) => q.id === id)).filter(Boolean)
  return (
    <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 pb-10 pt-8 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-16">
      <div>
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1 text-xs font-medium text-ink-soft">
          <span aria-hidden>●</span> {lang === 'zh-TW' ? '5×5 · 8 種角色 · 中英雙語' : '5×5 · 8 roles · Bilingual'}
        </p>
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          {t.appNameLocal}
          {lang === 'zh-TW' && <span className="mt-1 block text-2xl font-semibold text-ink-soft sm:text-3xl">Career Bingo</span>}
        </h1>
        <p className="mt-4 text-xl font-medium text-ink sm:text-2xl">{t.tagline}</p>
        <p className="mt-3 max-w-md leading-relaxed text-ink-soft">{t.landingBody}</p>
        <button
          type="button"
          onClick={onStart}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-base font-semibold text-white shadow-[0_6px_20px_-6px_rgba(47,43,40,0.45)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {t.start} <span aria-hidden>→</span>
        </button>
      </div>

      <div aria-hidden="true" className="grid grid-cols-3 gap-3 sm:gap-4">
        {samples.map((q, i) => (
          <div
            key={q!.id}
            className="anim-float flex aspect-square items-center justify-center rounded-2xl border border-white/80 p-2 text-center text-[11px] font-medium leading-snug shadow-[0_4px_14px_-6px_rgba(47,43,40,0.25)] sm:text-sm"
            style={{ background: TINTS[i], ['--r' as string]: `${ROT[i]}deg`, animationDelay: `${i * 0.4}s` }}
          >
            {q!.text[lang]}
          </div>
        ))}
      </div>
    </section>
  )
}
