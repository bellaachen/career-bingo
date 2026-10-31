import type { Strings } from '../i18n/translations'

interface Props {
  t: Strings
  exportState: 'idle' | 'busy' | 'done' | 'error'
  onExport: () => void
  onRegenerate: () => void
  onReset: () => void
  onSwitchRole: () => void
  canReset: boolean
  /** Sharing is hidden entirely when the API isn't configured. */
  share?: { shared: boolean; onShare: () => void; onOpenWall: () => void }
}

/** Action bar under the board. */
export function Results({ t, exportState, onExport, onRegenerate, onReset, onSwitchRole, canReset, share }: Props) {
  const secondary =
    'inline-flex items-center justify-center gap-[1.2cqw] whitespace-nowrap rounded-full border border-line bg-white/80 px-[2cqw] py-[clamp(8px,2cqw,11px)] text-[clamp(12px,2.4cqw,14px)] font-medium text-ink transition-colors hover:border-[var(--accent)] disabled:opacity-40 disabled:hover:border-line'
  const primary =
    'inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-[3cqw] py-[clamp(10px,2.4cqw,14px)] text-[clamp(13px,2.7cqw,16px)] font-semibold shadow-[0_6px_20px_-8px_rgba(47,43,40,0.5)] transition-transform hover:-translate-y-0.5 disabled:opacity-70'

  const exportLabel = exportState === 'busy' ? t.exporting : exportState === 'done' ? t.exported : t.exportPng
  const exportIcon = exportState === 'busy' ? '⏳' : exportState === 'done' ? '✓' : '↓'

  return (
    <div className="mt-[4cqw] flex flex-col gap-[2.2cqw]">
      <div className={share ? 'grid grid-cols-2 gap-[1.8cqw]' : ''}>
        {share && (
          <button
            type="button"
            onClick={share.shared ? share.onOpenWall : share.onShare}
            className={`${primary} text-white`}
            style={{ background: 'var(--accent)' }}
          >
            <span aria-hidden>{share.shared ? '✓' : '↗'}</span>
            {share.shared ? t.sharedCta : t.shareCta}
          </button>
        )}
        <button
          type="button"
          onClick={onExport}
          disabled={exportState === 'busy'}
          aria-busy={exportState === 'busy'}
          className={share ? `${primary} border-2 border-[var(--accent)] bg-white text-[var(--accent)] shadow-none` : `${primary} text-white`}
          style={share ? undefined : { background: 'var(--accent)' }}
        >
          <span aria-hidden>{exportIcon}</span>
          {exportLabel}
        </button>
      </div>
      {exportState === 'error' && (
        <p role="alert" className="text-center text-sm text-[#B4473A]">{t.exportFailed}</p>
      )}
      <div className="grid grid-cols-3 gap-[1.8cqw]">
        <button type="button" className={secondary} onClick={onRegenerate}><span aria-hidden>↻</span>{t.regenerate}</button>
        <button type="button" className={secondary} onClick={onReset} disabled={!canReset}><span aria-hidden>⌫</span>{t.reset}</button>
        <button type="button" className={secondary} onClick={onSwitchRole}><span aria-hidden>⇄</span>{t.switchRole}</button>
      </div>
    </div>
  )
}
