export type Lang = 'zh-TW' | 'en'

export type RoleId = 'pm' | 'rd' | 'qa' | 'ui' | 'ux' | 'marketing' | 'am' | 'all'

export interface LocalizedText {
  'zh-TW': string
  en: string
}

export interface Prompt {
  /** Stable, unique across all roles. Never derive from text. */
  id: string
  role: RoleId
  text: LocalizedText
}

export interface RoleMeta {
  id: RoleId
  emoji: string
  name: LocalizedText
  subtitle: LocalizedText
  /** Pastel background for cards/board */
  tint: string
  /** Stronger accent used for marked tiles, focus, buttons */
  accent: string
}

export interface GameState {
  lang: Lang
  role: RoleId | null
  /** 24 prompt IDs in row-major order, skipping the FREE center */
  board: string[]
  /** Marked prompt IDs (FREE center is implicit and always marked) */
  marked: string[]
}
