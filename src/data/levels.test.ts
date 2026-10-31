import { describe, expect, it } from 'vitest'
import { SURVIVAL_ROLES, getSurvivalCopy, getSurvivalLevel, type Level } from './levels'
import { ROLE_IDS } from './roles'
import { completedLines } from '../lib/bingo'

describe('survival level thresholds', () => {
  it.each([
    [0, 1], [1, 2], [2, 2], [3, 3], [4, 3], [5, 4], [7, 4], [8, 5], [10, 5], [11, 6], [12, 6],
  ])('%i lines → level %i', (lines, level) => {
    expect(getSurvivalLevel(lines)).toBe(level)
  })

  it('a full card is 12 lines and level 6; one square short is at most 10', () => {
    const all = Array(25).fill(true)
    expect(completedLines(all)).toHaveLength(12)
    expect(getSurvivalLevel(completedLines(all).length)).toBe(6)
    const maxShort = Math.max(...Array.from({ length: 25 }, (_, i) => i).filter((i) => i !== 12).map((i) => {
      const cells = all.slice()
      cells[i] = false
      return completedLines(cells).length
    }))
    expect(maxShort).toBe(10)
  })
})

describe('survival copy', () => {
  it('covers every playable role with 6 levels (54 combinations)', () => {
    expect([...SURVIVAL_ROLES].sort()).toEqual([...ROLE_IDS].sort())
    let n = 0
    for (const role of ROLE_IDS) {
      for (const level of [1, 2, 3, 4, 5, 6] as Level[]) {
        const c = getSurvivalCopy(role, level)
        for (const text of [c.title['zh-TW'], c.title.en, c.description['zh-TW'], c.description.en]) {
          expect(text.trim(), `${role} L${level}`).not.toBe('')
        }
        n++
      }
    }
    expect(n).toBe(54)
  })

  it('has unique titles within each role', () => {
    for (const role of ROLE_IDS) {
      const titles = ([1, 2, 3, 4, 5, 6] as Level[]).map((l) => getSurvivalCopy(role, l).title.en)
      expect(new Set(titles).size, role).toBe(6)
    }
  })

  it('matches spot-checked PRD copy, including the agreed tweaks', () => {
    expect(getSurvivalCopy('pm', 3).title['zh-TW']).toBe('需求接球員')
    expect(getSurvivalCopy('be', 6).title.en).toBe('Uptime Legend')
    expect(getSurvivalCopy('all', 1).description.en).toContain('Cherish that innocence.')
    expect(getSurvivalCopy('qa', 5).description['zh-TW']).toContain('工程師說無法重現')
  })

  it('retired RD borrows Everyone-in-Tech copy instead of crashing', () => {
    expect(getSurvivalCopy('rd', 2)).toEqual(getSurvivalCopy('all', 2))
  })
})
