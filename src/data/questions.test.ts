import { describe, expect, it } from 'vitest'
import { QUESTIONS, poolFor } from './questions'
import { ROLE_IDS } from './roles'
import { PROMPTS_PER_BOARD } from '../lib/bingo'

describe('question bank', () => {
  it('has unique IDs', () => {
    const ids = QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has no empty translations', () => {
    for (const q of QUESTIONS) {
      expect(q.text.en.trim(), q.id).not.toBe('')
      expect(q.text['zh-TW'].trim(), q.id).not.toBe('')
    }
  })

  it('has no duplicate text within a language', () => {
    for (const lang of ['en', 'zh-TW'] as const) {
      const texts = QUESTIONS.map((q) => q.text[lang].toLowerCase())
      expect(new Set(texts).size, lang).toBe(texts.length)
    }
  })

  it.each(ROLE_IDS)('role %s has enough prompts for a board', (role) => {
    expect(poolFor(role).length).toBeGreaterThanOrEqual(Math.max(30, PROMPTS_PER_BOARD))
  })

  it('IDs are prefixed by their role so pools never mix', () => {
    const prefix: Record<string, string> = { marketing: 'mk' }
    for (const q of QUESTIONS) expect(q.id.startsWith(`${prefix[q.role] ?? q.role}-`), q.id).toBe(true)
  })
})
