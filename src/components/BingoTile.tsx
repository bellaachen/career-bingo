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
      const base = parseFloat(getComputedStyle(span).fontSize)
      const cs = getComputedStyle(el)
      const maxH = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 2
      const maxW = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      while (scale > 0.62 && (span.scrollHeight > maxH || span.scrollWidth > maxW)) {
        scale -= 0.06
        span.style.fontSize = `${base * scale}px`
      }
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
  freeHint?: string
  celebrate: boolean
  stateLabel: string
  onToggle?: () => void
}

export const BingoTile = memo(function BingoTile({ index, text, marked, free, freeHint, celebrate, stateLabel, onToggle }: Props) {
  const { box, inner } = useFitText(text)
  const base =
    'relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[clamp(6px,1.8vw,14px)] p-[clamp(3px,1vw,8px)] text-center font-medium leading-[1.25] transition-[background-color,color,transform,box-shadow] duration-200 [overflow-wrap:break-word] [hyphens:manual] text-[clamp(8.5px,2.45vw,14px)]'

  if (free) {
    return (
      <div
        data-cell={index}
        className={`${base} flex-col bg-ink text-white ${celebrate ? 'anim-glow' : ''}`}
        aria-label={`${text}, ${freeHint}`}
      >
        <span className="font-display text-[clamp(11px,3.4vw,20px)] font-extrabold tracking-wider">{text}</span>
        <span className="mt-0.5 text-[clamp(7px,1.9vw,11px)] opacity-75">{freeHint}</span>
      </div>
    )
  }

  return (
    <button
      ref={box}
      type="button"
      data-cell={index}
      aria-pressed={marked}
      aria-label={`${text} — ${stateLabel}`}
      onClick={onToggle}
      className={`${base} border ${
        marked
          ? 'anim-pop border-transparent text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.12)]'
          : 'border-line bg-white text-ink shadow-[0_2px_6px_-3px_rgba(47,43,40,0.2)] hover:-translate-y-px hover:border-[var(--accent)]'
      } ${celebrate ? 'anim-glow' : ''}`}
      style={marked ? { background: 'var(--accent)' } : undefined}
    >
      {marked && (
        <span aria-hidden className="absolute right-[6%] top-[3%] text-[clamp(7px,1.7vw,11px)] leading-none opacity-70">✓</span>
      )}
      <span ref={inner} className="block max-h-full">{text}</span>
    </button>
  )
})
