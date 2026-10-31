import { useCallback, useEffect, useState } from 'react'
import type { Lang, RoleId } from '../types'
import type { RoleStats } from '../lib/share'
import { ApiError, apiEnabled, getStats, postShare } from '../lib/api'
import { boardKey, getClientId, getShared, setShared, type SharedEntry } from '../lib/shareStore'

/** Share state for the current board: whether it's shared, and the role's stats to overlay. */
export function useShare(role: RoleId | null, board: string[], marked: string[], lang: Lang) {
  const key = role ? boardKey(role, board) : ''
  const [shared, setSharedState] = useState<SharedEntry | null>(() => (key ? getShared(key) : null))
  const [stats, setStats] = useState<RoleStats | null>(null)
  const [busy, setBusy] = useState(false)

  // New board → re-read whether it was shared; if so, refresh stats for the overlay.
  useEffect(() => {
    const entry = key ? getShared(key) : null
    setSharedState(entry)
    setStats(null)
    if (!entry || !role || !apiEnabled) return
    let alive = true
    getStats(role).then((s) => alive && setStats(s)).catch(() => undefined)
    return () => {
      alive = false
    }
  }, [key, role])

  const share = useCallback(
    async (nickname: string): Promise<string | null> => {
      if (!role) return 'invalid'
      setBusy(true)
      try {
        const res = await postShare({ role, board, marked, nickname, lang, clientId: getClientId() })
        const entry = { id: res.id, position: res.position }
        setShared(key, entry)
        setSharedState(entry)
        setStats(res.stats)
        return null
      } catch (err) {
        const code = err instanceof ApiError ? err.code : 'network'
        if (code === 'duplicate') {
          // Shared from this browser before but local memory was lost: treat as shared.
          const entry = { id: '', position: 0 }
          setShared(key, entry)
          setSharedState(entry)
          getStats(role).then(setStats).catch(() => undefined)
        }
        return code
      } finally {
        setBusy(false)
      }
    },
    [role, board, marked, lang, key],
  )

  return { enabled: apiEnabled, shared, stats, busy, share }
}
