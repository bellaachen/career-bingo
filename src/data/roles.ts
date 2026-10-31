import type { RoleId, RoleMeta } from '../types'

export const ROLES: RoleMeta[] = [
  { id: 'pm', emoji: '🧭', name: { 'zh-TW': '產品經理', en: 'Product Manager' }, subtitle: { 'zh-TW': 'PM', en: 'PM' }, tint: '#F6E6DE', accent: '#C0705A' },
  { id: 'rd', emoji: '💻', name: { 'zh-TW': '軟體工程師', en: 'Software Engineer' }, subtitle: { 'zh-TW': 'RD', en: 'RD' }, tint: '#DFEAF6', accent: '#4F7CAC' },
  { id: 'qa', emoji: '🔍', name: { 'zh-TW': 'QA 工程師', en: 'QA Engineer' }, subtitle: { 'zh-TW': 'QA', en: 'QA' }, tint: '#DCEDE7', accent: '#4E8C76' },
  { id: 'ui', emoji: '🎨', name: { 'zh-TW': 'UI 設計師', en: 'UI Designer' }, subtitle: { 'zh-TW': 'UI', en: 'UI' }, tint: '#E6E1F4', accent: '#7D6BB5' },
  { id: 'ux', emoji: '🧩', name: { 'zh-TW': 'UX 設計 / 研究', en: 'UX Designer / Researcher' }, subtitle: { 'zh-TW': 'UX', en: 'UX' }, tint: '#FFF5DF', accent: '#B98A2E' },
  { id: 'marketing', emoji: '📣', name: { 'zh-TW': '行銷', en: 'Marketing' }, subtitle: { 'zh-TW': 'Marketing', en: 'Marketing' }, tint: '#F9E3E8', accent: '#B4637A' },
  { id: 'am', emoji: '🤝', name: { 'zh-TW': '客戶經理', en: 'Account Manager' }, subtitle: { 'zh-TW': 'AM', en: 'AM' }, tint: '#E3F0EE', accent: '#3F8A8C' },
  { id: 'all', emoji: '🌏', name: { 'zh-TW': '所有科技人', en: 'Everyone in Tech' }, subtitle: { 'zh-TW': 'All Roles', en: 'All Roles' }, tint: '#EEECE6', accent: '#6B6459' },
]

export const ROLE_IDS: RoleId[] = ROLES.map((r) => r.id)

export function getRole(id: RoleId): RoleMeta {
  const role = ROLES.find((r) => r.id === id)
  if (!role) throw new Error(`Unknown role: ${id}`)
  return role
}

export function isRoleId(value: unknown): value is RoleId {
  return typeof value === 'string' && (ROLE_IDS as string[]).includes(value)
}
