import { describe, expect, it } from 'vitest'
import { checkNickname, nicknameWidth, normalizeNickname } from './nickname'
import { ROLE_MIN_SHARES, hitRate, topPrompts, validateShare, type RoleStats } from './share'
import { poolFor } from '../data/questions'
import { generateBoard, promptIdAt } from './bingo'

describe('nickname', () => {
  it('counts CJK and emoji as 2, ASCII as 1', () => {
    expect(nicknameWidth('爆肝的產品經理')).toBe(14)
    expect(nicknameWidth('Tired PM Bella')).toBe(14)
    expect(nicknameWidth('Bella 好累')).toBe(10)
    expect(nicknameWidth('👩‍💻PM')).toBe(4)
  })
  it('enforces the 14-unit limit', () => {
    expect(checkNickname('爆肝的產品經理')).toBeNull()
    expect(checkNickname('爆肝的產品經理呀')).toBe('too_long')
    expect(checkNickname('Tired PM Bella!')).toBe('too_long')
  })
  it('normalizes width, spaces and zero-width chars', () => {
    expect(normalizeNickname('  Ｂｅｌｌａ​   PM ')).toBe('Bella PM')
  })
  it('blocks links and contact info', () => {
    expect(checkNickname('www.spam')).toBe('url')
    expect(checkNickname('buy.com')).toBe('url')
    expect(checkNickname('a@b')).toBe('contact')
    expect(checkNickname('LINE 0912-345')).toBe('contact')
    expect(checkNickname('QA 2026')).toBeNull()
  })
  it('matches the blocklist through punctuation and case', () => {
    expect(checkNickname('F.u c-k PM', ['fuck'])).toBe('profanity')
    expect(checkNickname('靠 北 QA', ['靠北'])).toBe('profanity')
    expect(checkNickname('Calm QA', ['fuck'])).toBeNull()
  })
})

function validBody(over: Record<string, unknown> = {}) {
  const board = generateBoard(poolFor('pm'))
  return { role: 'pm', lang: 'zh-TW', clientId: 'abcdef0123456789abcd', nickname: '爆肝PM', board, marked: [promptIdAt(board, 0), promptIdAt(board, 1)], ...over }
}

describe('validateShare', () => {
  it('accepts a valid board and recomputes lines', () => {
    const board = generateBoard(poolFor('pm'))
    const row = [0, 1, 2, 3, 4].map((i) => promptIdAt(board, i)!)
    const res = validateShare({ ...validBody({ board, marked: row }), lines: 99 })
    expect(res.ok && res.share.lines).toBe(1)
    expect(res.ok && res.share.markedCount).toBe(5)
  })
  it('rejects boards that are not from the role pool', () => {
    expect(validateShare(validBody({ board: generateBoard(poolFor('qa')) }))).toEqual({ ok: false, code: 'invalid_board' })
  })
  it('rejects duplicates, wrong length, and marks off the board', () => {
    const b = generateBoard(poolFor('pm'))
    expect(validateShare(validBody({ board: [...b.slice(0, 23), b[0]] })).ok).toBe(false)
    expect(validateShare(validBody({ board: b.slice(0, 23) })).ok).toBe(false)
    expect(validateShare(validBody({ board: b, marked: ['qa-001'] })).ok).toBe(false)
  })
  it('rejects bad role, lang and client id', () => {
    expect(validateShare(validBody({ role: 'ceo' })).ok).toBe(false)
    expect(validateShare(validBody({ lang: 'fr' })).ok).toBe(false)
    expect(validateShare(validBody({ clientId: 'x' })).ok).toBe(false)
    expect(validateShare(null).ok).toBe(false)
  })
  it('surfaces nickname errors and allows empty nickname', () => {
    expect(validateShare(validBody({ nickname: 'www.x' }))).toEqual({ ok: false, code: 'nickname_url' })
    expect(validateShare(validBody({ nickname: '   ' })).ok).toBe(true)
  })
})

describe('stats thresholds', () => {
  const stats: RoleStats = {
    role: 'pm', shares: ROLE_MIN_SHARES, avgLines: 1, totalShares: 50,
    prompts: { 'pm-001': { appeared: 16, hits: 13 }, 'pm-002': { appeared: 9, hits: 9 }, 'pm-003': { appeared: 12, hits: 3 } },
  }
  it('hides rates below thresholds', () => {
    expect(hitRate(stats, 'pm-001')).toBe(81)
    expect(hitRate(stats, 'pm-002')).toBeNull()
    expect(hitRate({ ...stats, shares: ROLE_MIN_SHARES - 1 }, 'pm-001')).toBeNull()
  })
  it('ranks top prompts', () => {
    expect(topPrompts(stats).map((p) => p.id)).toEqual(['pm-001', 'pm-003'])
  })
})
