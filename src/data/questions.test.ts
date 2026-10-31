import { describe, expect, it } from 'vitest'
import { QUESTIONS, poolFor } from './questions'
import { LEGACY_ROLES, ROLE_IDS, isRoleId } from './roles'

const PROMPTS_PER_ROLE = 40

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

  it('has no duplicate text within a role (FE and BE may share engineering pains)', () => {
    for (const role of ROLE_IDS) {
      for (const lang of ['en', 'zh-TW'] as const) {
        const texts = QUESTIONS.filter((q) => q.role === role).map((q) => q.text[lang].toLowerCase())
        expect(new Set(texts).size, `${role} ${lang}`).toBe(texts.length)
      }
    }
  })

  it.each(ROLE_IDS)('role %s has exactly 40 prompts', (role) => {
    expect(poolFor(role).length).toBe(PROMPTS_PER_ROLE)
  })

  it('IDs are prefixed by their role so pools never mix', () => {
    const prefix: Record<string, string> = { marketing: 'mk' }
    for (const q of QUESTIONS) expect(q.id.startsWith(`${prefix[q.role] ?? q.role}-`), q.id).toBe(true)
  })

  it('keeps every v1 prompt ID (shared cards and stats depend on them)', () => {
    const v1 = ['pm', 'rd', 'qa', 'ui', 'ux', 'mk', 'am', 'all'].flatMap((p) =>
      Array.from({ length: 30 }, (_, i) => `${p}-${String(i + 1).padStart(3, '0')}`),
    )
    const ids = new Set(QUESTIONS.map((q) => q.id))
    for (const id of v1) expect(ids.has(id), id).toBe(true)
  })

  it('retired RD is not selectable but still resolvable', () => {
    expect(isRoleId('rd')).toBe(false)
    expect(ROLE_IDS).toHaveLength(9)
    expect(LEGACY_ROLES.map((r) => r.id)).toEqual(['rd'])
    expect(poolFor('rd').length).toBe(30)
  })
})
