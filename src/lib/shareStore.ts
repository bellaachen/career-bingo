/**
 * Local memory for Phase 2: an anonymous client ID and which boards this browser has shared.
 * Separate key from the game state so v1 saves are untouched. All access is fail-safe.
 */
const CLIENT_KEY = 'career-bingo:client:v1'
const SHARED_KEY = 'career-bingo:shared:v1'

export interface SharedEntry {
  id: string
  position: number
}

function store(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const v = store()?.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    store()?.setItem(key, JSON.stringify(value))
  } catch {
    /* in-memory only */
  }
}

let memoryClientId: string | null = null

export function getClientId(): string {
  const existing = readJson<string | null>(CLIENT_KEY, null)
  if (existing && /^[a-zA-Z0-9-]{16,64}$/.test(existing)) return existing
  const id = memoryClientId ?? (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}xxxxxxxx`)
  memoryClientId = id
  writeJson(CLIENT_KEY, id)
  return id
}

export function boardKey(role: string, board: readonly string[]): string {
  return `${role}:${board.join(',')}`
}

export function getShared(key: string): SharedEntry | null {
  return readJson<Record<string, SharedEntry>>(SHARED_KEY, {})[key] ?? null
}

export function setShared(key: string, entry: SharedEntry) {
  const all = readJson<Record<string, SharedEntry>>(SHARED_KEY, {})
  all[key] = entry
  // Keep the map small: only the 50 most recent shares matter.
  const trimmed = Object.fromEntries(Object.entries(all).slice(-50))
  writeJson(SHARED_KEY, trimmed)
}
