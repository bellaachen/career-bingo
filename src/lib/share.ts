import type { Lang, RoleId } from '../types'
import { isRoleId } from '../data/roles'
import { poolFor } from '../data/questions'
import { PROMPTS_PER_BOARD, completedLines, markedCells } from './bingo'
import { checkNickname, normalizeNickname, type NicknameError } from './nickname'

/** Cold-start thresholds (spec: 冷啟動與統計顯示規則). */
export const ROLE_MIN_SHARES = 20
export const PROMPT_MIN_APPEARANCES = 10
export const DAILY_LIMIT_PER_CLIENT = 10
export const DAILY_LIMIT_PER_IP = 30
export const WALL_SIZE = 30

export interface ShareRequest {
  role: RoleId
  board: string[]
  marked: string[]
  nickname: string
  lang: Lang
  clientId: string
}

export interface PromptStat {
  appeared: number
  hits: number
}

/** The wall can show one role or every role together ("全部"). Not a role: 'all' is the Everyone-in-Tech role. */
export type WallScope = RoleId | 'everyone'

export interface RoleStats {
  role: WallScope
  shares: number
  avgLines: number
  totalShares: number
  prompts: Record<string, PromptStat>
}

export interface ShareCard {
  id: string
  role: RoleId
  /** The 24 prompt IDs in board order (lets the wall open the full card) */
  board: string[]
  nickname: string | null
  lines: number
  markedCount: number
  /** 25 booleans, row-major, center true */
  cells: boolean[]
  createdAt: number
}

export type ApiErrorCode =
  | 'invalid_request'
  | 'invalid_board'
  | `nickname_${NicknameError}`
  | 'duplicate'
  | 'rate_limited'
  | 'busy'
  | 'not_found'

export type ValidShare = ShareRequest & { lines: number; markedCount: number; cells: boolean[] }

const CLIENT_ID_RE = /^[a-zA-Z0-9-]{16,64}$/

/**
 * Validate an untrusted share request. Lines and counts are always recomputed here;
 * anything the client says about them is ignored.
 */
export function validateShare(raw: unknown, blocklist: readonly string[] = []): { ok: true; share: ValidShare } | { ok: false; code: ApiErrorCode } {
  if (!raw || typeof raw !== 'object') return { ok: false, code: 'invalid_request' }
  const r = raw as Record<string, unknown>
  if (!isRoleId(r.role) || (r.lang !== 'en' && r.lang !== 'zh-TW')) return { ok: false, code: 'invalid_request' }
  if (typeof r.clientId !== 'string' || !CLIENT_ID_RE.test(r.clientId)) return { ok: false, code: 'invalid_request' }
  if (typeof r.nickname !== 'string' || r.nickname.length > 200) return { ok: false, code: 'invalid_request' }

  const pool = new Set(poolFor(r.role))
  const board = r.board
  const marked = r.marked
  if (
    !Array.isArray(board) || board.length !== PROMPTS_PER_BOARD ||
    !board.every((id) => typeof id === 'string' && pool.has(id)) ||
    new Set(board).size !== board.length
  ) return { ok: false, code: 'invalid_board' }
  const onBoard = new Set(board as string[])
  if (!Array.isArray(marked) || marked.length > PROMPTS_PER_BOARD || !marked.every((id) => typeof id === 'string' && onBoard.has(id)) || new Set(marked).size !== marked.length) {
    return { ok: false, code: 'invalid_board' }
  }

  const nickname = normalizeNickname(r.nickname)
  const nickErr = nickname ? checkNickname(nickname, blocklist) : null
  if (nickErr) return { ok: false, code: `nickname_${nickErr}` }

  const cells = markedCells(board as string[], marked as string[])
  return {
    ok: true,
    share: {
      role: r.role, lang: r.lang, clientId: r.clientId, nickname,
      board: board as string[], marked: marked as string[],
      cells, lines: completedLines(cells).length, markedCount: (marked as string[]).length,
    },
  }
}

/** Hit rate for a prompt, or null when the sample is too small to show honestly. */
export function hitRate(stats: RoleStats | null, promptId: string): number | null {
  if (!stats || stats.shares < ROLE_MIN_SHARES) return null
  const p = stats.prompts[promptId]
  if (!p || p.appeared < PROMPT_MIN_APPEARANCES) return null
  return Math.round((p.hits / p.appeared) * 100)
}

/** Top N most-hit prompts that pass the thresholds. */
export function topPrompts(stats: RoleStats | null, n = 5): { id: string; rate: number }[] {
  if (!stats || stats.shares < ROLE_MIN_SHARES) return []
  return Object.keys(stats.prompts)
    .map((id) => ({ id, rate: hitRate(stats, id) }))
    .filter((x): x is { id: string; rate: number } => x.rate !== null)
    .sort((a, b) => b.rate - a.rate || a.id.localeCompare(b.id))
    .slice(0, n)
}
