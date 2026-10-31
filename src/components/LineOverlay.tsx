import { useLayoutEffect, useRef, useState } from 'react'
import { LINES, SIZE } from '../lib/bingo'

interface Props {
  lines: number[]
  /** Lines that just formed — these animate; older lines are drawn instantly. */
  fresh: number[]
}

/**
 * SVG strike-through drawn over completed lines. Sits on top of the grid,
 * ignores pointer events, and is inside the export node so it shows in the PNG.
 * Cell centers are measured from the real layout because the gap is responsive.
 */
export function LineOverlay({ lines, fresh }: Props) {
  const ref = useRef<SVGSVGElement>(null)
  const [geo, setGeo] = useState<{ w: number; h: number; cell: number; step: number } | null>(null)

  useLayoutEffect(() => {
    const svg = ref.current
    const grid = svg?.parentElement
    if (!svg || !grid) return
    const measure = () => {
      const first = grid.querySelector<HTMLElement>('[data-cell="0"]')
      const second = grid.querySelector<HTMLElement>('[data-cell="1"]')
      if (!first || !second) return
      setGeo({ w: grid.clientWidth, h: grid.clientHeight, cell: first.offsetWidth, step: second.offsetLeft - first.offsetLeft })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(grid)
    return () => ro.disconnect()
  }, [])

  const freshSet = new Set(fresh)
  const center = (i: number) => (geo ? i * geo.step + geo.cell / 2 : 0)
  const overshoot = geo ? geo.cell * 0.32 : 0
  const stroke = geo ? Math.max(3, geo.cell * 0.055) : 4

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-visible"
      width={geo?.w ?? 0}
      height={geo?.h ?? 0}
    >
      {geo &&
        lines.map((l) => {
          const cells = LINES[l]
          const [a, b] = [cells[0], cells[SIZE - 1]]
          let x1 = center(a % SIZE), y1 = center(Math.floor(a / SIZE))
          let x2 = center(b % SIZE), y2 = center(Math.floor(b / SIZE))
          const len = Math.hypot(x2 - x1, y2 - y1)
          const ux = (x2 - x1) / len, uy = (y2 - y1) / len
          x1 -= ux * overshoot; y1 -= uy * overshoot
          x2 += ux * overshoot; y2 += uy * overshoot
          const isFresh = freshSet.has(l)
          return (
            <g key={l}>
              {/* soft halo so the line reads on both white and accent tiles */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} stroke="#FFFFFF" strokeOpacity={0.7}
                strokeWidth={stroke + 3} strokeLinecap="round" className={isFresh ? 'anim-draw' : ''} />
              <line x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} stroke="#2F2B28" strokeOpacity={0.62}
                strokeWidth={stroke} strokeLinecap="round" className={isFresh ? 'anim-draw' : ''} />
            </g>
          )
        })}
    </svg>
  )
}
