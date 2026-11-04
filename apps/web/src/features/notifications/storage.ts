// Device storage for notification preferences (same pattern as the home layout).
import { useSyncExternalStore } from 'react'
import { parsePrefs, type NotifyPrefs } from './prefs'

const KEY = 'thongyod-notify-prefs'
const listeners = new Set<() => void>()

function read(): NotifyPrefs {
  try {
    return parsePrefs(localStorage.getItem(KEY))
  } catch {
    return parsePrefs(null)
  }
}

let current = read()

export function setNotifyPrefs(next: NotifyPrefs): void {
  current = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage blocked: the change applies until the page is closed.
  }
  listeners.forEach((l) => l())
}

export function useNotifyPrefs(): NotifyPrefs {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
  )
}
