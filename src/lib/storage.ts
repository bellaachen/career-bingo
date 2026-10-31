import type { GameState, Lang } from '../types'
import { isRoleId } from '../data/roles'
import { PROMPTS_PER_BOARD } from './bingo'

export const STORAGE_KEY = 'career-bingo:v1'

export const DEFAULT_STATE: GameState = { lang: 'zh-TW', role: null, board: [], marked: [] }

function isLang(v: unknown): v is Lang {
  return v === 'zh-TW' || v === 'en'
}

/**
 * Validate a raw value from storage against the current question bank.
 * Anything stale (unknown role, removed/duplicate prompt IDs, wrong length)
 * degrades to a safe state: the language/role are kept where valid, and the
 * board is cleared so the app regenerates it instead of crashing.
 */
export function sanitizeState(raw: unknown, poolFor: (role: GameState['role'] & string) => readonly string[]): GameState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STATE }
  const r = raw as Record<string, unknown>
  const lang = isLang(r.lang) ? r.lang : DEFAULT_STATE.lang
  const role = isRoleId(r.role) ? r.role : null
  if (!role) return { lang, role: null, board: [], marked: [] }

  const pool = new Set(poolFor(role))
  const board = Array.isArray(r.board) ? r.board : []
  const boardValid =
    board.length === PROMPTS_PER_BOARD &&
    board.every((id) => typeof id === 'string' && pool.has(id)) &&
    new Set(board).size === board.length
  if (!boardValid) return { lang, role, board: [], marked: [] }

  const onBoard = new Set(board as string[])
  const marked = Array.isArray(r.marked)
    ? [...new Set(r.marked.filter((id): id is string => typeof id === 'string' && onBoard.has(id)))]
    : []
  return { lang, role, board: board as string[], marked }
}

/** Returns null when storage is unavailable (private mode, blocked cookies, etc.). */
export function loadRaw(storage: Storage | undefined = safeStorage()): unknown {
  if (!storage) return null
  try {
    const text = storage.getItem(STORAGE_KEY)
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

/** Returns false when the write failed; the game keeps working in memory. */
export function save(state: GameState, storage: Storage | undefined = safeStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

function safeStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined
  } catch {
    return undefined
  }
}
