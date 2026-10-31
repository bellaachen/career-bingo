import { describe, expect, it } from 'vitest'
import { STORAGE_KEY, loadRaw, sanitizeState, save } from './storage'
import { poolFor } from '../data/questions'
import { generateBoard } from './bingo'

describe('storage', () => {
  it('round-trips a valid state', () => {
    const board = generateBoard(poolFor('pm'))
    const state = { lang: 'en' as const, role: 'pm' as const, board, marked: [board[0], board[5]] }
    expect(save(state, localStorage)).toBe(true)
    expect(sanitizeState(loadRaw(localStorage), poolFor)).toEqual(state)
  })

  it('switching language keeps board and marks', () => {
    const board = generateBoard(poolFor('qa'))
    const s = { lang: 'zh-TW' as const, role: 'qa' as const, board, marked: [board[3]] }
    save({ ...s, lang: 'en' }, localStorage)
    const restored = sanitizeState(loadRaw(localStorage), poolFor)
    expect(restored.board).toEqual(board)
    expect(restored.marked).toEqual([board[3]])
    expect(restored.lang).toBe('en')
  })

  it('clears the board when it contains stale IDs', () => {
    const board = generateBoard(poolFor('rd'))
    board[0] = 'deleted-999'
    const s = sanitizeState({ lang: 'en', role: 'rd', board, marked: [] }, poolFor)
    expect(s).toEqual({ lang: 'en', role: 'rd', board: [], marked: [] })
  })

  it('rejects prompts from a different role', () => {
    const board = generateBoard(poolFor('ui'))
    expect(sanitizeState({ lang: 'en', role: 'ux', board, marked: [] }, poolFor).board).toEqual([])
  })

  it('drops marks that are not on the board', () => {
    const board = generateBoard(poolFor('am'))
    const s = sanitizeState({ lang: 'en', role: 'am', board, marked: [board[1], 'nope', 42] }, poolFor)
    expect(s.marked).toEqual([board[1]])
  })

  it('handles garbage and corrupted JSON', () => {
    expect(sanitizeState('hello', poolFor).role).toBeNull()
    expect(sanitizeState({ role: 'ceo' }, poolFor).role).toBeNull()
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadRaw(localStorage)).toBeNull()
  })

  it('survives a throwing storage', () => {
    const broken = { getItem: () => { throw new Error('x') }, setItem: () => { throw new Error('quota') } } as unknown as Storage
    expect(loadRaw(broken)).toBeNull()
    expect(save({ lang: 'en', role: null, board: [], marked: [] }, broken)).toBe(false)
  })
})
