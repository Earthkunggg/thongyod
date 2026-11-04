// Per-game sound switch (DECISIONS #46: games and celebration screens play sound by default, with a toggle on screen).
import { useSyncExternalStore } from 'react'

const KEY = 'thongyod-sound'
const listeners = new Set<() => void>()

function read(): Record<string, boolean> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return value && typeof value === 'object' ? (value as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

let prefs = read()

export function setGameSound(game: string, on: boolean): void {
  prefs = { ...prefs, [game]: on }
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // Storage blocked: applies until the page closes.
  }
  listeners.forEach((l) => l())
}

/** Whether sound is on for this game (default on). */
export function useGameSound(game: string): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => prefs[game] !== false,
  )
}
