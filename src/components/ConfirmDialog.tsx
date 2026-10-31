import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** Native <dialog>: focus trap, Esc to close, and backdrop come for free. */
export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal?.()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); onCancel() }}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(92vw,380px)] rounded-2xl border border-line bg-paper p-6 text-ink shadow-xl"
    >
      <h2 id="confirm-title" className="font-display text-lg font-bold">{title}</h2>
      <p className="mt-2 text-ink-soft">{body}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" autoFocus onClick={onCancel} className="rounded-full px-4 py-2 font-medium text-ink-soft hover:bg-white">
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} className="rounded-full px-5 py-2 font-semibold text-white" style={{ background: 'var(--accent)' }}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
