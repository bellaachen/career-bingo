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

type Screen = 'landing' | 'roles' | 'game'
type Pending = 'regenerate' | 'reset' | 'switch' | null

declare const __BUILD_DATE__: string
const BUILD_DATE = __BUILD_DATE__

export default function App() {
  const game = useGame()
  const { state, lines } = game
  const t = STRINGS[state.lang]
  const [screen, setScreen] = useState<Screen>(state.role ? 'game' : 'landing')
  const [pending, setPending] = useState<Pending>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [celebrate, setCelebrate] = useState<number[]>([])
  const [exportState, setExportState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const boardRef = useRef<HTMLDivElement>(null)

  // Celebrate only lines that appear because of a user toggle on the same board.
  const prevLines = useRef<number[]>(lines)
  const prevBoard = useRef(state.board)
  useEffect(() => {
    const sameBoard = prevBoard.current === state.board
    const fresh = sameBoard ? newlyCompleted(prevLines.current, lines) : []
    prevLines.current = lines
    prevBoard.current = state.board
    if (fresh.length === 0) return
    setCelebrate(fresh)
    setToast(lines.length === 12 ? t.blackout : fresh.length === 1 ? t.bingoOne : t.bingoMany(fresh.length))
    const id = window.setTimeout(() => { setToast(null); setCelebrate([]) }, 2400)
    return () => window.clearTimeout(id)
  }, [lines, state.board, t])

  useEffect(() => {
    document.documentElement.lang = state.lang
  }, [state.lang])

  const role = state.role ? getRole(state.role) : null
  const accentStyle = role ? ({ '--accent': role.accent, '--tint': role.tint } as React.CSSProperties) : undefined

  const runPending = () => {
    if (pending === 'regenerate') game.regenerate()
    if (pending === 'reset') game.resetMarks()
    if (pending === 'switch') { game.leaveRole(); setScreen('roles') }
    setPending(null)
  }

  // Only confirm when there is meaningful progress to lose.
  const guarded = (action: Exclude<Pending, null>) => {
    if (!game.hasProgress) {
      if (action === 'regenerate') game.regenerate()
      if (action === 'switch') { game.leaveRole(); setScreen('roles') }
      return
    }
    setPending(action)
  }

  const handleExport = async () => {
    if (!boardRef.current || !state.role) return
    setExportState('busy')
    try {
      await exportNodeAsPng(boardRef.current, exportFilename(state.role, state.lang))
      setExportState('done')
      window.setTimeout(() => setExportState('idle'), 2000)
    } catch (err) {
      console.error(err)
      setExportState('error')
    }
  }

  const dialogCopy = {
    regenerate: [t.confirmRegenerateTitle, t.confirmRegenerateBody],
    reset: [t.confirmResetTitle, t.confirmResetBody],
    switch: [t.confirmSwitchTitle, t.confirmSwitchBody],
  } as const

  return (
    <div className="flex min-h-dvh flex-col" style={accentStyle}>
      <Header lang={state.lang} t={t} onLang={game.setLang} onHome={screen === 'landing' ? undefined : () => setScreen('landing')} />

      <main className="flex-1">
        {screen === 'landing' && (
          <>
            <Landing lang={state.lang} t={t} onStart={() => setScreen(state.role ? 'game' : 'roles')} />
            {state.role && (
              <p className="mx-auto -mt-6 w-full max-w-5xl px-4 text-sm text-ink-soft sm:px-6">
                <button type="button" className="underline underline-offset-4 hover:text-ink" onClick={() => { game.leaveRole(); setScreen('roles') }}>
                  {t.pickRole}
                </button>
              </p>
            )}
          </>
        )}

        {screen === 'roles' && (
          <RolePicker lang={state.lang} t={t} onPick={(r) => { game.startRole(r); setScreen('game') }} />
        )}

        {screen === 'game' && role && (
          <section className="mx-auto w-full max-w-[640px] px-3 pb-10 pt-4 sm:px-6 sm:pt-8">
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
              onToggle={game.toggle}
            />
            <Results
              t={t}
              exportState={exportState}
              onExport={handleExport}
              onRegenerate={() => guarded('regenerate')}
              onReset={() => setPending('reset')}
              onSwitchRole={() => guarded('switch')}
              canReset={game.hasProgress}
            />
          </section>
        )}
      </main>

      {!game.storageOk && (
        <p role="status" className="mx-auto mb-2 max-w-md px-4 text-center text-xs text-ink-soft">{t.storageWarning}</p>
      )}

      <footer className="py-6 text-center text-xs text-ink-soft">Bella Chen {BUILD_DATE}</footer>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-4 sm:top-5">
        {toast && (
          <div
            key={toast + lines.length}
            className="anim-toast flex items-center gap-3 rounded-full py-2.5 pl-2.5 pr-6 text-white shadow-[0_12px_32px_-10px_rgba(47,43,40,0.55)] ring-4 ring-white/70"
            style={{ background: 'var(--accent)' }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 font-display text-lg font-extrabold tabular-nums" style={{ color: 'var(--accent)' }}>
              {lines.length}
            </span>
            <span className="text-base font-bold sm:text-lg">{toast}</span>
          </div>
        )}
      </div>

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
