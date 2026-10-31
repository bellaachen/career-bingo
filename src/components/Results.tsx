import type { Strings } from '../i18n/translations'

interface Props {
  t: Strings
  onViewResult: () => void
  onRegenerate: () => void
  onReset: () => void
  onSwitchRole: () => void
  canReset: boolean
}

/** Action bar under the board. Download and share live on the result sheet. */
export function Results({ t, onViewResult, onRegenerate, onReset, onSwitchRole, canReset }: Props) {
  const secondary =
    'inline-flex items-center justify-center gap-[1.2cqw] whitespace-nowrap rounded-full border border-line bg-white/80 px-[2cqw] py-[clamp(8px,2cqw,11px)] text-[clamp(12px,2.4cqw,14px)] font-medium text-ink transition-colors hover:border-[var(--accent)] disabled:opacity-40 disabled:hover:border-line'
  const primary =
    'inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-[3cqw] py-[clamp(10px,2.4cqw,14px)] text-[clamp(13px,2.7cqw,16px)] font-semibold transition-transform hover:-translate-y-0.5'

  return (
    <div className="mt-[4cqw] flex flex-col gap-[2.2cqw]">
      <button
        type="button"
        onClick={onViewResult}
        className={`${primary} text-white shadow-[0_6px_20px_-8px_rgba(47,43,40,0.5)]`}
        style={{ background: 'var(--accent)' }}
      >
        <span aria-hidden>🏆</span>
        {t.viewResult}
      </button>
      <div className="grid grid-cols-3 gap-[1.8cqw]">
        <button type="button" className={secondary} onClick={onRegenerate}><span aria-hidden>↻</span>{t.regenerate}</button>
        <button type="button" className={secondary} onClick={onReset} disabled={!canReset}><span aria-hidden>⌫</span>{t.reset}</button>
        <button type="button" className={secondary} onClick={onSwitchRole}><span aria-hidden>⇄</span>{t.switchRole}</button>
      </div>
    </div>
  )
}
