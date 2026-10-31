import type { RoleId, RoleMeta } from '../types'

/** Selectable roles, in display order. */
export const ROLES: RoleMeta[] = [
  { id: 'pm', emoji: '🧭', name: { 'zh-TW': '產品經理', en: 'Product Manager' }, subtitle: { 'zh-TW': 'PM', en: 'PM' }, tint: '#F6E6DE', accent: '#C0705A' },
  { id: 'fe', emoji: '🖥️', name: { 'zh-TW': '前端工程師', en: 'Frontend Engineer' }, subtitle: { 'zh-TW': 'FE', en: 'FE' }, tint: '#DDEFF7', accent: '#3A8FB7' },
  { id: 'be', emoji: '🗄️', name: { 'zh-TW': '後端工程師', en: 'Backend Engineer' }, subtitle: { 'zh-TW': 'BE', en: 'BE' }, tint: '#E4E8EE', accent: '#5B6B82' },
  { id: 'qa', emoji: '🔍', name: { 'zh-TW': '測試工程師', en: 'QA Engineer' }, subtitle: { 'zh-TW': 'QA', en: 'QA' }, tint: '#DCEDE7', accent: '#4E8C76' },
  { id: 'ui', emoji: '🎨', name: { 'zh-TW': 'UI 設計師', en: 'UI Designer' }, subtitle: { 'zh-TW': 'UI', en: 'UI' }, tint: '#E6E1F4', accent: '#7D6BB5' },
  { id: 'ux', emoji: '🧩', name: { 'zh-TW': 'UX 設計師', en: 'UX Designer' }, subtitle: { 'zh-TW': 'UX', en: 'UX' }, tint: '#FFF5DF', accent: '#B98A2E' },
  { id: 'marketing', emoji: '📣', name: { 'zh-TW': '行銷人員', en: 'Marketing Specialist' }, subtitle: { 'zh-TW': 'MKT', en: 'MKT' }, tint: '#F9E3E8', accent: '#B4637A' },
  { id: 'am', emoji: '🤝', name: { 'zh-TW': '客戶經理', en: 'Account Manager' }, subtitle: { 'zh-TW': 'AM', en: 'AM' }, tint: '#E3F0EE', accent: '#3F8A8C' },
  { id: 'all', emoji: '🌏', name: { 'zh-TW': '科技業打工人', en: 'Everyone in Tech' }, subtitle: { 'zh-TW': 'ALL', en: 'ALL' }, tint: '#EEECE6', accent: '#6B6459' },
]

/** Retired roles: never offered, but cards already shared under them still render. */
export const LEGACY_ROLES: RoleMeta[] = [
  { id: 'rd', emoji: '💻', name: { 'zh-TW': '軟體工程師', en: 'Software Engineer' }, subtitle: { 'zh-TW': 'RD', en: 'RD' }, tint: '#DFEAF6', accent: '#4F7CAC' },
]

export const ROLE_IDS: RoleId[] = ROLES.map((r) => r.id)

export function getRole(id: RoleId): RoleMeta {
  const role = ROLES.find((r) => r.id === id) ?? LEGACY_ROLES.find((r) => r.id === id)
  if (!role) throw new Error(`Unknown role: ${id}`)
  return role
}

/** True only for roles that can be played and shared today (legacy roles excluded). */
export function isRoleId(value: unknown): value is RoleId {
  return typeof value === 'string' && (ROLE_IDS as string[]).includes(value)
}
