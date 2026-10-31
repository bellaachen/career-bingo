import type { RoleStats, ShareCard, ShareRequest, WallScope } from './share'

/**
 * API base URL is injected at build time (VITE_API_BASE). When it's missing, every
 * sharing feature hides itself and the v1 game keeps working exactly as before.
 */
export const API_BASE: string = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '')
export const apiEnabled = API_BASE !== ''

export class ApiError extends Error {
  constructor(public code: string) {
    super(code)
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 10_000)
  let res: Response
  try {
    res = await fetch(API_BASE + path, { ...init, signal: ctrl.signal, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  } catch {
    throw new ApiError('network')
  } finally {
    clearTimeout(timer)
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const code = (body as { error?: string } | null)?.error ?? 'busy'
    throw new ApiError(code === 'invalid_request' || code === 'invalid_board' ? 'invalid' : code)
  }
  return body as T
}

export function postShare(req: ShareRequest) {
  return call<{ id: string; position: number; stats: RoleStats }>('/api/shares', { method: 'POST', body: JSON.stringify(req) })
}

export function getStats(scope: WallScope) {
  return call<RoleStats>(`/api/stats?role=${scope}`)
}

export function getWall(scope: WallScope) {
  return call<{ role: WallScope; cards: ShareCard[] }>(`/api/shares?role=${scope}`)
}
