import { useEffect, useRef, useState } from 'react'
import { useGame } from './hooks/useGame'
import { STRINGS } from './i18n/translations'
import { getRole } from './data/roles'
import { newlyCompleted } from './lib/bingo'
import { exportFilename, exportNodeAsPng } from './lib/export'
import { Header } from './components/Header'
import { Landing } from './components/Landing'
import { RolePicker } from './components/RolePicker'
import { BingoBoard } from './components/BingoBoard'
import { Results } from './components/Results'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ShareDialog } from './components/ShareDialog'
import { ResultView } from './components/ResultView'
import { getSurvivalCopy, getSurvivalLevel } from './data/levels'
import { Community } from './components/Community'
import { useShare } from './hooks/useShare'
import { ROLE_MIN_SHARES, type WallScope } from './lib/share'
import { apiEnabled } from './lib/api'
import type { RoleId } from './types'

type Screen = 'landing' | 'roles' | 'game' | 'community'
type Pending = 'regenerate' | 'reset' | 'switch' | 'play' | 'again' | null

const WALL_HASH = '#/wall'

export default function App() {
  const game = useGame()
  const { state, lines } = game
  const t = STRINGS[state.lang]
  const [screen, setScreen] = useState<Screen>(() =>
    apiEnabled && window.location.hash === WALL_HASH ? 'community' : state.role ? 'game' : 'landing',
  )
  const [playRole, setPlayRole] = useState<RoleId | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [wallScope, setWallScope] = useState<WallScope>('everyone')
  const share = useShare(state.role, state.board, state.marked, state.lang)
  const [pending, setPending] = useState<Pending>(null)
  // Each toast gets its own id so its dismiss timer is independent of later taps.
  const [toast, setToast] = useState<{ id: number; text: string; badge: string } | null>(null)
  const [resultOpen, setResultOpen] = useState(false)
  const [celebrate, setCelebrate] = useState<number[]>([])
  const boardRef = useRef<HTMLDivElement>(null)

  // Celebrate only lines that appear because of a user toggle on the same board.
  const prevLines = useRef<number[]>(lines)
  const prevBoard = useRef(state.board)
  useEffect(() => {
    const sameBoard = prevBoard.current === state.board
    const fresh = sameBoard ? newlyCompleted(prevLines.current, lines) : []
    const prevCount = prevLines.current.length
    prevLines.current = lines
    prevBoard.current = state.board
    if (fresh.length === 0) return
    setCelebrate(fresh)
    const before = getSurvivalLevel(prevCount)
    const now = getSurvivalLevel(lines.length)
    // A level-up outranks the plain bingo message (full card still gets its own line).
    const levelUp = now > before && state.role
      ? t.levelUp(getSurvivalCopy(state.role, now).title[state.lang])
      : null
    setToast({
      id: Date.now(),
      text: levelUp ?? (lines.length === 12 ? t.blackout : fresh.length === 1 ? t.bingoOne : t.bingoMany(fresh.length)),
      badge: levelUp ? `LV${now}` : `${lines.length}`,
    })
  }, [lines, state.board, state.role, state.lang, t])

  // Dismiss timer lives with the toast itself. Previously it was cleared by the next tap
  // (any marks change re-ran the effect above), which left the toast on screen forever.
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => { setToast(null); setCelebrate([]) }, 2400)
    return () => window.clearTimeout(id)
  }, [toast])

  // Leaving the game clears any celebration so it can't follow you to another page.
  useEffect(() => {
    if (screen !== 'game') { setToast(null); setCelebrate([]); setResultOpen(false) }
  }, [screen])

  useEffect(() => {
    document.documentElement.lang = state.lang
  }, [state.lang])

  // The wall has its own URL (#/wall) so it can be shared and the back button works.
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === WALL_HASH && apiEnabled) setScreen('community')
      else setScreen((s) => (s === 'community' ? (state.role ? 'game' : 'landing') : s))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [state.role])
  const openWall = (scope: WallScope = 'everyone') => {
    setWallScope(scope)
    if (window.location.hash !== WALL_HASH) window.location.hash = WALL_HASH
    setScreen('community')
    window.scrollTo({ top: 0 })
  }
  const go = (next: Screen) => {
    if (window.location.hash === WALL_HASH) history.pushState(null, '', window.location.pathname + window.location.search)
    setScreen(next)
  }

  const role = state.role ? getRole(state.role) : null
  const accentStyle = role ? ({ '--accent': role.accent, '--tint': role.tint } as React.CSSProperties) : undefined

  const runPending = () => {
    if (pending === 'regenerate') game.regenerate()
    if (pending === 'reset') game.resetMarks()
    if (pending === 'again') { game.regenerate(); setResultOpen(false) }
    if (pending === 'switch') { game.leaveRole(); go('roles') }
    if (pending === 'play' && playRole) { game.startRole(playRole); go('game') }
    setPending(null)
  }

  // Only confirm when there is meaningful progress to lose.
  const guarded = (action: Exclude<Pending, null>) => {
    if (!game.hasProgress) {
      if (action === 'regenerate') game.regenerate()
      if (action === 'switch') { game.leaveRole(); go('roles') }
      if (action === 'play' && playRole) { game.startRole(playRole); go('game') }
      if (action === 'again') { game.regenerate(); setResultOpen(false) }
      return
    }
    setPending(action)
  }

  // Both downloads are triggered from the result sheet; errors surface there.
  const downloadBoard = async () => {
    if (!boardRef.current || !state.role) throw new Error('no board')
    await exportNodeAsPng(boardRef.current, exportFilename(state.role, state.lang, 'card'))
  }
  const downloadResult = async (node: HTMLElement) => {
    if (!state.role) throw new Error('no role')
    await exportNodeAsPng(node, exportFilename(state.role, state.lang, 'result'), { pixelRatio: 1 })
  }
  const level = getSurvivalLevel(lines.length)

  const dialogCopy = {
    regenerate: [t.confirmRegenerateTitle, t.confirmRegenerateBody],
    reset: [t.confirmResetTitle, t.confirmResetBody],
    switch: [t.confirmSwitchTitle, t.confirmSwitchBody],
    play: [t.confirmSwitchTitle, t.confirmSwitchBody],
    again: [t.confirmPlayAgainTitle, t.confirmPlayAgainBody],
  } as const

  // From the wall: keep the current card if it's the same role, otherwise start that role.
  const playFromWall = (r: RoleId) => {
    if (r === state.role && state.board.length) return go('game')
    setPlayRole(r)
    if (!game.hasProgress) { game.startRole(r); go('game') }
    else setPending('play')
  }

  // Line under the board once this card is shared: stats legend, or the cold-start message.
  const roleName = role?.name[state.lang] ?? ''
  const boardNote = !share.shared || !share.stats
    ? null
    : share.stats.shares >= ROLE_MIN_SHARES
      ? t.rateLegend(roleName, share.stats.shares)
      : share.shared.position > 0
        ? t.youAreNth(roleName, share.shared.position)
        : t.collecting(roleName, share.stats.shares)

  return (
    <div className="flex min-h-dvh flex-col" style={accentStyle}>
      <Header lang={state.lang} t={t} onLang={game.setLang} onHome={screen === 'landing' ? undefined : () => go('landing')} onWall={apiEnabled && screen !== 'community' ? () => openWall() : undefined} />

      <main className="flex-1">
        {screen === 'landing' && (
          <>
            <Landing lang={state.lang} t={t} onStart={() => go(state.role ? 'game' : 'roles')} onWall={apiEnabled ? () => openWall() : undefined} />
            {state.role && (
              <p className="mx-auto -mt-6 w-full max-w-5xl px-4 text-sm text-ink-soft sm:px-6">
                <button type="button" className="underline underline-offset-4 hover:text-ink" onClick={() => { game.leaveRole(); go('roles') }}>
                  {t.pickRole}
                </button>
              </p>
            )}
          </>
        )}

        {screen === 'roles' && (
          <RolePicker lang={state.lang} t={t} onPick={(r) => { game.startRole(r); go('game') }} />
        )}

        {screen === 'game' && role && (
          <section className="game-col px-4 pb-8 pt-3 sm:pt-5">
            <BingoBoard
              ref={boardRef}
              lang={state.lang}
              t={t}
              role={role}
              board={state.board}
              cells={game.cells}
              lines={lines}
              count={game.count}
              celebrateLines={celebrate}
              stats={share.shared ? share.stats : null}
              note={boardNote}
              onToggle={game.toggle}
              onOpenResult={() => setResultOpen(true)}
            />
            <Results
              t={t}
              onViewResult={() => setResultOpen(true)}
              onRegenerate={() => guarded('regenerate')}
              onReset={() => setPending('reset')}
              onSwitchRole={() => guarded('switch')}
              canReset={game.hasProgress}
              share={share.enabled ? { shared: Boolean(share.shared), onShare: () => setShareOpen(true), onOpenWall: () => openWall(state.role ?? 'everyone') } : undefined}
            />
          </section>
        )}

        {screen === 'community' && apiEnabled && (
          <Community
            lang={state.lang}
            t={t}
            key={wallScope}
            initialScope={wallScope}
            onPlay={(scope) => (scope === 'everyone' ? go(state.role ? 'game' : 'roles') : playFromWall(scope))}
            onBack={state.role ? () => go('game') : undefined}
          />
        )}
      </main>

      {!game.storageOk && (
        <p role="status" className="mx-auto mb-2 max-w-md px-4 text-center text-xs text-ink-soft">{t.storageWarning}</p>
      )}

      <div className="h-6" aria-hidden />

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4 sm:top-5">
        {toast && (
          <div
            key={toast.id}
            className="anim-toast flex items-center gap-3 rounded-full py-2.5 pl-2.5 pr-6 text-white shadow-[0_12px_32px_-10px_rgba(47,43,40,0.55)] ring-4 ring-white/70"
            style={{ background: 'var(--accent)' }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 font-display text-lg font-extrabold tabular-nums" style={{ color: 'var(--accent)' }}>
              {toast.badge}
            </span>
            <span className="text-base font-bold sm:text-lg">{toast.text}</span>
          </div>
        )}
      </div>

      {role && (
        <ResultView
          open={resultOpen && screen === 'game'}
          lang={state.lang}
          t={t}
          role={role}
          level={level}
          copy={getSurvivalCopy(role.id, level)}
          lines={lines.length}
          count={game.count}
          cells={game.cells}
          onClose={() => setResultOpen(false)}
          onPlayAgain={() => guarded('again')}
          onDownloadResult={downloadResult}
          onDownloadBoard={downloadBoard}
        />
      )}

      <ShareDialog open={shareOpen} t={t} busy={share.busy} onSubmit={share.share} onClose={() => setShareOpen(false)} />

      <ConfirmDialog
        open={pending !== null}
        title={pending ? dialogCopy[pending][0] : ''}
        body={pending ? dialogCopy[pending][1] : ''}
        confirmLabel={t.confirm}
        cancelLabel={t.cancel}
        onConfirm={runPending}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
