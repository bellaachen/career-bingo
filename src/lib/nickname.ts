/**
 * Nickname rules, shared by the browser (live feedback) and the Worker (enforcement).
 * The profanity list lives only in the Worker and is passed in, so it never ships to clients.
 */
export const NICKNAME_MAX_WIDTH = 14

export type NicknameError = 'too_long' | 'url' | 'contact' | 'profanity'

const WIDE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}　-〿！-｠￠-￦]|\p{Extended_Pictographic}/u

/** NFKC, strip control/format chars (incl. zero-width), trim, collapse spaces. */
export function normalizeNickname(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(/[\p{Cc}\p{Cf}]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim()
}

function graphemes(s: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s), (g) => g.segment)
  }
  return Array.from(s)
}

/** CJK / full-width / emoji count 2, everything else 1. */
export function nicknameWidth(s: string): number {
  return graphemes(s).reduce((sum, g) => sum + (WIDE.test(g) ? 2 : 1), 0)
}

/** Lowercase and drop everything but letters/digits so "f.u c-k" still matches. */
function squash(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

const URL_RE = /(https?:|www\.|\.(com|net|org|io|tw|cc|me|ly|co|xyz|app|dev|link|info|top|vip)\b|[a-z0-9-]+\.[a-z]{2,}\/)/i
const CONTACT_RE = /@|[0-9０-９]{5,}/

export function checkNickname(nick: string, blocklist: readonly string[] = []): NicknameError | null {
  if (nicknameWidth(nick) > NICKNAME_MAX_WIDTH) return 'too_long'
  if (URL_RE.test(nick)) return 'url'
  if (CONTACT_RE.test(nick.replace(/[\s\-.]/g, ''))) return 'contact'
  const flat = squash(nick)
  if (blocklist.some((w) => flat.includes(squash(w)))) return 'profanity'
  return null
}
