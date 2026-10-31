import { useEffect, useRef, useState } from 'react'
import type { Strings } from '../i18n/translations'
import { NICKNAME_MAX_WIDTH, checkNickname, nicknameWidth, normalizeNickname } from '../lib/nickname'

interface Props {
  open: boolean
  t: Strings
  busy: boolean
  onSubmit: (nickname: string) => Promise<string | null>
  onClose: () => void
}

export function ShareDialog({ open, t, busy, onSubmit, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [nick, setNick] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      setServerError(null)
      d.showModal?.()
    }
    if (!open && d.open) d.close()
  }, [open])

  const normalized = normalizeNickname(nick)
  const width = nicknameWidth(normalized)
  // Live check without the blocklist (that one is server-only).
  const localError = normalized ? checkNickname(normalized) : null
  const errorCode = localError ? `nickname_${localError}` : serverError
  const over = width > NICKNAME_MAX_WIDTH

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (localError || busy) return
    const code = await onSubmit(normalized)
    if (code === null) onClose()
    else setServerError(code)
  }

  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); if (!busy) onClose() }}
      aria-labelledby="share-title"
      className="m-auto w-[min(92vw,420px)] rounded-2xl border border-line bg-paper p-6 text-ink shadow-xl"
    >
      <form onSubmit={submit}>
        <h2 id="share-title" className="font-display text-lg font-bold">{t.shareTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.shareBody}</p>

        <label htmlFor="nickname" className="mt-5 block text-sm font-semibold">{t.nicknameLabel}</label>
        <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-white px-3 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/30">
          <input
            id="nickname"
            value={nick}
            onChange={(e) => { setNick(e.target.value); setServerError(null) }}
            placeholder={t.nicknamePlaceholder}
            autoComplete="off"
            maxLength={40}
            aria-invalid={Boolean(errorCode)}
            aria-describedby="nickname-help"
            className="field-input min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none placeholder:text-ink-soft/60"
          />
          <span className={`shrink-0 text-xs tabular-nums ${over ? 'font-semibold text-[#B4473A]' : 'text-ink-soft'}`} aria-hidden>
            {width}/{NICKNAME_MAX_WIDTH}
          </span>
        </div>
        <p id="nickname-help" className={`mt-1.5 min-h-[1.25rem] text-xs ${errorCode ? 'text-[#B4473A]' : 'text-ink-soft'}`} role={errorCode ? 'alert' : undefined}>
          {errorCode ? (t.shareErrors[errorCode] ?? t.shareErrors.busy) : t.nicknameHint}
        </p>

        <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-soft">
          <span aria-hidden>🔒</span>
          {t.privacyNote}
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full px-4 py-2 font-medium text-ink-soft hover:bg-white">
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={busy || Boolean(localError)}
            aria-busy={busy}
            className="rounded-full px-5 py-2 font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {busy ? t.sharing : t.submitShare}
          </button>
        </div>
      </form>
    </dialog>
  )
}
