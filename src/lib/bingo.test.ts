import { describe, expect, it } from 'vitest'
import {
  CELL_COUNT, FREE_INDEX, LINES, PROMPTS_PER_BOARD,
  completedLines, generateBoard, markedCells, markedCount, newlyCompleted, promptIdAt, regenerateBoard, sample,
} from './bingo'

const pool = Array.from({ length: 30 }, (_, i) => `p-${i}`)

/** Mark exactly the given cell indices (center is always marked). */
function cellsFor(indices: number[]) {
  const board = pool.slice(0, PROMPTS_PER_BOARD)
  const marked = indices.map((i) => promptIdAt(board, i)).filter((x): x is string => x !== null)
  return markedCells(board, marked)
}

describe('board generation', () => {
  it('has 12 lines of 5 cells', () => {
    expect(LINES).toHaveLength(12)
    LINES.forEach((l) => expect(l).toHaveLength(5))
  })

  it('produces 24 unique prompts from the pool', () => {
    const board = generateBoard(pool)
    expect(board).toHaveLength(24)
    expect(new Set(board).size).toBe(24)
    board.forEach((id) => expect(pool).toContain(id))
  })

  it('sample throws when the pool is too small', () => {
    expect(() => sample(['a'], 2)).toThrow()
  })

  it('regenerate produces a different order when possible', () => {
    const prev = generateBoard(pool)
    const next = regenerateBoard(pool, prev)
    expect(next).not.toEqual(prev)
  })

  it('maps 25 cells with a FREE center', () => {
    const board = generateBoard(pool)
    const ids = Array.from({ length: CELL_COUNT }, (_, i) => promptIdAt(board, i))
    expect(ids[FREE_INDEX]).toBeNull()
    expect(ids.filter((x) => x !== null)).toEqual(board)
  })
})

describe('line counting', () => {
  it('starts with only the center marked and no lines', () => {
    const cells = cellsFor([])
    expect(markedCount(cells)).toBe(1)
    expect(completedLines(cells)).toEqual([])
  })

  it('counts a full row as one line', () => {
    expect(completedLines(cellsFor([0, 1, 2, 3, 4]))).toHaveLength(1)
  })

  it('counts the middle row using the FREE center', () => {
    expect(completedLines(cellsFor([10, 11, 13, 14]))).toHaveLength(1)
  })

  it('counts a column and both diagonals', () => {
    expect(completedLines(cellsFor([0, 5, 10, 15, 20]))).toHaveLength(1)
    expect(completedLines(cellsFor([0, 6, 18, 24]))).toHaveLength(1)
    expect(completedLines(cellsFor([4, 8, 16, 20]))).toHaveLength(1)
  })

  it('counts intersecting lines separately', () => {
    // row 0 + column 0 share cell 0
    expect(completedLines(cellsFor([0, 1, 2, 3, 4, 5, 10, 15, 20]))).toHaveLength(2)
  })

  it('removes a line when a tile is unmarked', () => {
    expect(completedLines(cellsFor([0, 1, 2, 3]))).toHaveLength(0)
  })

  it('blackout yields all 12 lines', () => {
    const all = Array.from({ length: 25 }, (_, i) => i)
    expect(completedLines(cellsFor(all))).toHaveLength(12)
  })

  it('reports only newly completed lines', () => {
    expect(newlyCompleted([0, 5], [0, 5, 7])).toEqual([7])
    expect(newlyCompleted([0, 5], [0])).toEqual([])
  })
})
