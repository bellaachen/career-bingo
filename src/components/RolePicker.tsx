import type { Lang, RoleId } from '../types'
import type { Strings } from '../i18n/translations'
import { ROLES } from '../data/roles'
import { poolFor } from '../data/questions'

interface Props {
  lang: Lang
  t: Strings
  onPick: (role: RoleId) => void
}

export function RolePicker({ lang, t, onPick }: Props) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12" aria-labelledby="role-title">
      <h2 id="role-title" className="font-display text-2xl font-bold sm:text-3xl">{t.pickRole}</h2>
      <p className="mt-1 text-ink-soft">{t.pickRoleHint}</p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {ROLES.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onPick(r.id)}
              style={{ background: r.tint, ['--accent' as string]: r.accent }}
              className="group flex h-full w-full flex-col items-start gap-3 rounded-2xl border border-white/80 p-4 text-left shadow-[0_4px_14px_-8px_rgba(47,43,40,0.3)] transition-transform hover:-translate-y-1 sm:p-5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-2xl" aria-hidden>{r.emoji}</span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: r.accent }}>{r.subtitle[lang]}</span>
                <span className="mt-0.5 block text-base font-bold leading-tight sm:text-lg">{r.name[lang]}</span>
              </span>
              <span className="mt-auto text-xs text-ink-soft">
                {lang === 'zh-TW' ? `${poolFor(r.id).length} 題` : `${poolFor(r.id).length} prompts`}
                <span aria-hidden className="ml-1 inline-block transition-transform group-hover:translate-x-1">→</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
