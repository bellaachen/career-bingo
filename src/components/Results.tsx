import type { Strings } from '../i18n/translations'

interface Props {
  t: Strings
  exportState: 'idle' | 'busy' | 'done' | 'error'
  onExport: () => void
  onRegenerate: () => void
  onReset: () => void
  onSwitchRole: () => void
  canReset: boolean
}

/** Action bar under the board. */
export function Results({ t, exportState, onExport, onRegenerate, onReset, onSwitchRole, canReset }: Props) {
  const secondary =
    'inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full border border-line bg-white/80 px-2 py-2.5 text-[13px] sm:gap-1.5 sm:px-4 sm:text-sm font-medium text-ink transition-colors hover:border-[var(--accent)] disabled:opacity-40 disabled:hover:border-line'
  return (
    <div className="mt-4 flex flex-col gap-3">
      <button
        type="button"
        onClick={onExport}
        disabled={exportState === 'busy'}
        aria-busy={exportState === 'busy'}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white shadow-[0_6px_20px_-8px_rgba(47,43,40,0.5)] transition-transform hover:-translate-y-0.5 disabled:opacity-70"
        style={{ background: 'var(--accent)' }}
      >
        <span aria-hidden>{exportState === 'busy' ? '⏳' : exportState === 'done' ? '✓' : '↓'}</span>
        {exportState === 'busy' ? t.exporting : exportState === 'done' ? t.exported : t.exportPng}
      </button>
      {exportState === 'error' && (
        <p role="alert" className="text-center text-sm text-[#B4473A]">{t.exportFailed}</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        <button type="button" className={secondary} onClick={onRegenerate}><span aria-hidden>↻</span>{t.regenerate}</button>
        <button type="button" className={secondary} onClick={onReset} disabled={!canReset}><span aria-hidden>⌫</span>{t.reset}</button>
        <button type="button" className={secondary} onClick={onSwitchRole}><span aria-hidden>⇄</span>{t.switchRole}</button>
      </div>
    </div>
  )
}
