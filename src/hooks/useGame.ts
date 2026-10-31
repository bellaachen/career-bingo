import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GameState, Lang, RoleId } from '../types'
import { poolFor } from '../data/questions'
import { completedLines, generateBoard, markedCells, markedCount, regenerateBoard } from '../lib/bingo'
import { DEFAULT_STATE, loadRaw, sanitizeState, save } from '../lib/storage'

function initialState(): GameState {
  const state = sanitizeState(loadRaw(), poolFor)
  // Valid role but stale/invalid board → regenerate rather than crash.
  if (state.role && state.board.length === 0) {
    return { ...state, board: generateBoard(poolFor(state.role)), marked: [] }
  }
  return state
}

export function useGame() {
  const [state, setState] = useState<GameState>(() => {
    try {
      return initialState()
    } catch {
      return { ...DEFAULT_STATE }
    }
  })
  const [storageOk, setStorageOk] = useState(true)

  useEffect(() => {
    setStorageOk(save(state))
  }, [state])

  const cells = useMemo(() => markedCells(state.board, state.marked), [state.board, state.marked])
  const lines = useMemo(() => completedLines(cells), [cells])
  const count = useMemo(() => markedCount(cells), [cells])

  const setLang = useCallback((lang: Lang) => setState((s) => ({ ...s, lang })), [])

  const startRole = useCallback((role: RoleId) => {
    setState((s) => ({ ...s, role, board: generateBoard(poolFor(role)), marked: [] }))
  }, [])

  const toggle = useCallback((id: string) => {
    setState((s) => {
      if (!s.board.includes(id)) return s
      const marked = s.marked.includes(id) ? s.marked.filter((m) => m !== id) : [...s.marked, id]
      return { ...s, marked }
    })
  }, [])

  const regenerate = useCallback(() => {
    setState((s) => (s.role ? { ...s, board: regenerateBoard(poolFor(s.role), s.board), marked: [] } : s))
  }, [])

  const resetMarks = useCallback(() => setState((s) => ({ ...s, marked: [] })), [])

  const leaveRole = useCallback(() => setState((s) => ({ ...s, role: null, board: [], marked: [] })), [])

  return {
    state,
    cells,
    lines,
    count,
    hasProgress: state.marked.length > 0,
    storageOk,
    setLang,
    startRole,
    toggle,
    regenerate,
    resetMarks,
    leaveRole,
  }
}
