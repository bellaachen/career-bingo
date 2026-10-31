import { memo, useLayoutEffect, useRef } from 'react'

/** Shrink text in steps until it fits the square tile (keeps long prompts readable). */
function useFitText(text: string) {
  const box = useRef<HTMLButtonElement>(null)
  const inner = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = box.current
    const span = inner.current
    if (!el || !span) return
    const fit = () => {
      let scale = 1
      span.style.fontSize = ''
      // Don't break words while measuring: a long word (e.g. node_modules) should shrink first.
      span.style.overflowWrap = 'normal'
      const base = parseFloat(getComputedStyle(span).fontSize)
      const cs = getComputedStyle(el)
      const maxH = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 2
      const overflows = () => span.scrollHeight > maxH + 1 || span.scrollWidth > span.clientWidth + 1
      while (scale > 0.62 && overflows()) {
        scale -= 0.06
        span.style.fontSize = `${base * scale}px`
      }
      // Last resort at the smallest size: allow breaking inside a word rather than clipping it.
      if (overflows()) span.style.overflowWrap = 'anywhere'
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text])
  return { box, inner }
}

interface Props {
  index: number
  text: string
  marked: boolean
  free?: boolean
  centerNote?: string
  celebrate: boolean
  stateLabel: string
  /** % of same-role players who hit this square, when the sample is big enough */
  rate?: number | null
  onToggle?: () => void
}

export const BingoTile = memo(function BingoTile({ index, text, marked, free, centerNote, celebrate, stateLabel, rate, onToggle }: Props) {
  const { box, inner } = useFitText(text)
  const base =
    'relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[clamp(6px,2cqw,12px)] p-[clamp(3px,1.1cqw,7px)] text-center font-medium leading-[1.25] transition-[background-color,color,transform,box-shadow] duration-200 [overflow-wrap:break-word] [hyphens:manual] text-[clamp(8.5px,2.45cqw,13px)]'

  if (free) {
    return (
      <div
        data-cell={index}
        className={`${base} flex-col bg-ink text-white ${celebrate ? 'anim-glow' : ''}`}
        role="img"
        aria-label={`${text.replace('\n', '')} (${centerNote})`}
      >
        <span aria-hidden className="text-[clamp(14px,4.4cqw,26px)] leading-none">☕</span>
        <span className="mt-[0.8cqw] whitespace-pre-line font-bold leading-tight">{text}</span>
      </div>
    )
  }

  return (
    <button
      ref={box}
      type="button"
      data-cell={index}
      aria-pressed={marked}
      aria-label={`${text} — ${stateLabel}${rate != null ? ` — ${rate}%` : ''}`}
      onClick={onToggle}
      className={`${base} border ${
        marked
          ? 'anim-pop border-transparent text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)]'
          : 'border-line bg-white text-ink shadow-[0_2px_6px_-3px_rgba(47,43,40,0.2)] hover:-translate-y-px hover:border-[var(--accent)]'
      } ${celebrate ? 'anim-glow' : ''} ${rate != null ? 'pb-[3.4cqw]' : ''}`}
      style={marked ? { background: 'var(--accent)' } : undefined}
    >
      {marked && (
        <span aria-hidden className="absolute right-[6%] top-[3%] text-[clamp(7px,1.5cqw,10px)] leading-none opacity-70">✓</span>
      )}
      <span ref={inner} className="block w-full min-w-0 max-h-full">{text}</span>
      {rate != null && (
        <span
          aria-hidden
          className={`absolute bottom-[4%] left-1/2 -translate-x-1/2 rounded-full px-[1.2cqw] text-[clamp(7px,1.6cqw,10px)] font-bold leading-[1.5] tabular-nums ${
            marked ? 'bg-white/90 text-[var(--accent)]' : 'bg-[var(--tint)] text-ink-soft'
          }`}
        >
          {rate}%
        </span>
      )}
    </button>
  )
})
