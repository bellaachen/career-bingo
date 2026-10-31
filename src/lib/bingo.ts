/**
 * Pure bingo logic. Board positions are row-major 0..24, center (12) is FREE.
 * `board` arrays hold the 24 prompt IDs for every position except the center.
 */
export const SIZE = 5
export const CELL_COUNT = SIZE * SIZE
export const FREE_INDEX = 12
export const PROMPTS_PER_BOARD = CELL_COUNT - 1

/** All 12 lines as lists of cell indices: 5 rows, 5 columns, 2 diagonals. */
export const LINES: number[][] = (() => {
  const lines: number[][] = []
  for (let r = 0; r < SIZE; r++) lines.push(Array.from({ length: SIZE }, (_, c) => r * SIZE + c))
  for (let c = 0; c < SIZE; c++) lines.push(Array.from({ length: SIZE }, (_, r) => r * SIZE + c))
  lines.push(Array.from({ length: SIZE }, (_, i) => i * SIZE + i))
  lines.push(Array.from({ length: SIZE }, (_, i) => i * SIZE + (SIZE - 1 - i)))
  return lines
})()

/** Fisher–Yates sample without replacement. `random` is injectable for tests. */
export function sample<T>(pool: readonly T[], count: number, random: () => number = Math.random): T[] {
  if (pool.length < count) throw new Error(`Pool has ${pool.length} items, need ${count}`)
  const arr = pool.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, count)
}

export function generateBoard(poolIds: readonly string[], random?: () => number): string[] {
  return sample(poolIds, PROMPTS_PER_BOARD, random)
}

/**
 * Generate a new board, retrying a few times so it differs from the previous one
 * when the pool makes that possible.
 */
export function regenerateBoard(poolIds: readonly string[], previous: readonly string[], random?: () => number): string[] {
  let next = generateBoard(poolIds, random)
  for (let i = 0; i < 5 && sameOrder(next, previous); i++) next = generateBoard(poolIds, random)
  return next
}

function sameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

/** Map a cell index (0..24) to its prompt ID, or null for the FREE center. */
export function promptIdAt(board: readonly string[], cellIndex: number): string | null {
  if (cellIndex === FREE_INDEX) return null
  return board[cellIndex < FREE_INDEX ? cellIndex : cellIndex - 1] ?? null
}

/** Boolean per cell (length 25); center always true. */
export function markedCells(board: readonly string[], marked: Iterable<string>): boolean[] {
  const set = new Set(marked)
  return Array.from({ length: CELL_COUNT }, (_, i) => {
    const id = promptIdAt(board, i)
    return id === null ? true : set.has(id)
  })
}

/** Indices (into LINES) of completed lines. */
export function completedLines(cells: readonly boolean[]): number[] {
  return LINES.flatMap((line, idx) => (line.every((c) => cells[c]) ? [idx] : []))
}

/** Count of marked cells including the FREE center. */
export function markedCount(cells: readonly boolean[]): number {
  return cells.filter(Boolean).length
}

/** Lines present in `next` but not in `prev` — used to trigger celebration only once. */
export function newlyCompleted(prev: readonly number[], next: readonly number[]): number[] {
  const p = new Set(prev)
  return next.filter((l) => !p.has(l))
}
